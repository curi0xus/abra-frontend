require("dotenv").config();
const { expect } = require("chai");
const { ethers } = require("ethers");
const {
  calculateMaxMIMBorrowable,
  calculateRealExchangeRate,
  calculateCollaterizationRatio,
  calculateAnnualInterest,
  calculatePriceOfOneCollateralToken,
} = require("../helper/borrow");
const { mathjs } = require("../util/math");
const { toSolidityUint256, toCurrency, toFixed } = require("../util/ethersBN");
const {
  getSignedTypedDataParameters,
  recoverRSV,
  verifySignatureSigner,
  generateSignature,
} = require("../helper/signature");
const {
  setApproval,
  depositCollateral,
  addCollateral,
  borrowMIM,
  withdrawMIM,
} = require("../helper/cook");

const {
  shibContract,
  mimContract,
  cauldron,
  bentoBox,
} = require("../smartContract/instances");

const {
  MASTER_CONTRACT,
  BENTO_CONTRACT_ADDRESS,
  CAULDRON_CONTRACT_ADDRESS,
  SWAPPER_CONTRACT_ADDRESS,
  ETH_ERC20,
  MIM_ERC20,
  SHIB_ERC20,
} = require("../smartContract/constant");

const { PROVIDER_URL, PUBLIC_KEY, PRIVATE_KEY } = process.env;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const pubKey = PUBLIC_KEY;
const privKey = PRIVATE_KEY;
const UserWallet = new ethers.Wallet(privKey, provider);
const userAddress = UserWallet.connect(provider);

const COLLATERIZATION_RATE = 70000;
const LIQUIDATION_MULTIPLIER = 112500;
const BORROW_OPENING_FEE = 500;

let accrueInfo;
let exchangeRateETHBN;
let maxCollateralAvailableETHBN;
let chosenLTV = mathjs.bignumber("0.2");
let chosenCollateralBN = mathjs.bignumber("1000000");
let collateralizationRateETHBN;
let maxAllowedLTVBN;
let liquidationMultiplierETHBN;
let borrowingOpeningFeeETHBN;
let maxMimBorrowableBN;
let toBorrowAmountPlusBorrowFeeBN;
let rVal;
let sVal;
let vVal;
let setApprovalParams;
let depositCollateralParams;
let addCollateralParams;
let borrowMIMParams;
let withdrawMIMParams;
let collateralShareETHBN;
let maxMIMBorrowableETHBN;

async function approveTokenSpend(amount) {
  const tx = await shibContract(userAddress).functions.approve(
    BENTO_CONTRACT_ADDRESS,
    amount
  );
  const res = await tx.wait();
  return res;
}

async function getTokenBalance(smartContract) {
  return await smartContract.balanceOf(pubKey);
}

async function fundWallet(address) {
  const numberOfEther = "1.0";
  const numberOfWei = ethers.utils.parseEther(numberOfEther).toBigInt();
  const params = [
    [address],
    ethers.utils.hexValue(numberOfWei), // hex encoded wei amount
  ];
  await provider.send("tenderly_addBalance", params);
}

describe("Cauldron Smart Contract Borrow MIM Integration Test", function () {
  before(async function () {
    await fundWallet(userAddress.address);
  });

  describe("Public Variables", function () {
    it("Should retrieve the COLLATERIZATION_RATE of 70000", async function () {
      collateralizationRateETHBN = (
        await cauldron(userAddress).functions.COLLATERIZATION_RATE()
      )[0];
      const collateralizationRate = collateralizationRateETHBN.toNumber();
      expect(collateralizationRate).to.equal(COLLATERIZATION_RATE);
    });

    it("Should retrieve the LIQUIDATION_MULTIPLIER of 112500", async function () {
      liquidationMultiplierETHBN = (
        await cauldron(userAddress).functions.LIQUIDATION_MULTIPLIER()
      )[0];
      const liquidationMultiplier = liquidationMultiplierETHBN.toNumber();
      expect(liquidationMultiplier).to.equal(LIQUIDATION_MULTIPLIER);
    });
    it("Should retrieve the BORROW_OPENING_FEE of 500", async function () {
      borrowingOpeningFeeETHBN = (
        await cauldron(userAddress).functions.BORROW_OPENING_FEE()
      )[0];
      const borrowingOpeningFee = borrowingOpeningFeeETHBN.toNumber();
      expect(borrowingOpeningFee).to.equal(BORROW_OPENING_FEE);
    });
  });

  describe("Interest Rates Data", function () {
    it("Should retrieve AccrueInfo from the cauldron smart contract", async function () {
      const res = await cauldron(userAddress).functions.accrueInfo();
      accrueInfo = {
        interestPerSecond: res.INTEREST_PER_SECOND,
        feesEarned: res.feesEarned,
        lastAccrued: res.lastAccrued,
      };
      expect(res).to.have.deep.keys([
        "0",
        "1",
        "2",
        "INTEREST_PER_SECOND",
        "feesEarned",
        "lastAccrued",
      ]);
    });
  });
  describe("Exchange Rate Data", function () {
    it("Should retrieve exchangeRate from smart contract", async function () {
      const res = await cauldron(userAddress).functions.exchangeRate();
      exchangeRateETHBN = res[0];
      expect(exchangeRateETHBN).to.gte(0);
    });
  });

  describe("Borrow MIM Dashboard", function () {
    it("Should display SHIB balance", async function () {
      maxCollateralAvailableETHBN = await getTokenBalance(
        shibContract(userAddress)
      );
      expect(maxCollateralAvailableETHBN.toString()).to.equal(
        "1000000000000000000000000000"
      );
    });
    it("Should display MIM balance", async function () {
      mimBalETHBN = await getTokenBalance(mimContract(userAddress));
      expect(mimBalETHBN.toString()).to.equal("0");
    });
    it("Should calculate correct MIM to borrow based on the chosen LTV and collateral", async function () {
      maxMimBorrowableBN = calculateMaxMIMBorrowable(
        calculateRealExchangeRate(
          mathjs.bignumber(exchangeRateETHBN.toString()),
          mathjs.bignumber("1e18")
        ),
        chosenLTV,
        chosenCollateralBN
      );
      const roundedCollateralValue = mathjs.round(maxMimBorrowableBN, 16);
      expect(roundedCollateralValue.toString()).to.equal("1.630047509018786");
    });
    it("Should display readable LTV based on chosen LTV", async function () {
      expect(chosenLTV.toString()).to.equal("0.2");
    });
    it("Should have chosen LTV lower than max allowed LTV", async function () {
      maxAllowedLTVBN = calculateCollaterizationRatio(
        mathjs.bignumber(collateralizationRateETHBN.toString()),
        mathjs.bignumber("1e5")
      );
      const isWithinLTVLimits = chosenLTV <= maxAllowedLTVBN;
      expect(isWithinLTVLimits).to.equal(true);
    });
    it("Should display human readable 'Maximum collateral ratio' based on retrieved values", async function () {
      const readableMaxAllowedLTV = `${mathjs.multiply(maxAllowedLTVBN, 100)}%`;
      expect(readableMaxAllowedLTV).to.equal("70%");
    });
    it("Should display human readable 'Liquidation Fee' based on retrieved values", async function () {
      const liquidationMultiplierBN = mathjs.bignumber(
        liquidationMultiplierETHBN.toString()
      );
      const liquidationMultiplierPrecisionBN = mathjs.bignumber("1e5");
      const realLiquidationMultiplierBN = mathjs.divide(
        liquidationMultiplierBN,
        liquidationMultiplierPrecisionBN
      );
      const liquidationFeeBN = mathjs.multiply(
        mathjs.subtract(realLiquidationMultiplierBN, 1),
        100
      );
      const readableLiquidationFee = `${liquidationFeeBN.toString()}%`;
      expect(readableLiquidationFee).to.equal("12.5%");
    });
    it("Should display human readable 'Borrow Fee' based on retrieved values", async function () {
      const borrowingOpeningFeeBN = mathjs.bignumber(
        borrowingOpeningFeeETHBN.toString()
      );
      const borrowingOpeningFeePrecisionBN = mathjs.bignumber("1e5");
      const realBorrowingOpeningFeeBN = mathjs.divide(
        borrowingOpeningFeeBN,
        borrowingOpeningFeePrecisionBN
      );
      const borrowingOpeningFeePercentage = mathjs.multiply(
        realBorrowingOpeningFeeBN,
        100
      );
      const readableborrowingOpeningFee = `${borrowingOpeningFeePercentage.toString()}%`;
      expect(readableborrowingOpeningFee).to.equal("0.5%");
    });
    it("Should display human readable 'Interest' based on retrieved values", async function () {
      const annualInterestRateBNRoundedUp = calculateAnnualInterest(
        accrueInfo.interestPerSecond.toString()
      );
      const readableAnnualIR = `${annualInterestRateBNRoundedUp}%`;
      expect(readableAnnualIR).to.equal("6%");
    });
    it("Should display human readable 'Price' based on retrieved values", async function () {
      const price = calculatePriceOfOneCollateralToken(
        mathjs.divide(
          mathjs.bignumber(exchangeRateETHBN.toString()),
          mathjs.bignumber("1e18")
        )
      );
      const readablePrice = `$${price}`;
      expect(readablePrice).to.equal("$0.000008");
    });
    it("Should display human readable 'Collateral Deposit' based on selected values (4.dp)", async function () {
      const userCollateralShareETHBN = (
        await cauldron(userAddress).functions.userCollateralShare(
          userAddress.address
        )
      )[0];
      const userCollateralAmountETHBN = await bentoBox(
        userAddress
      ).functions.toAmount(
        SHIB_ERC20,
        userCollateralShareETHBN,
        userAddress.address
      );
      const userCollateralAmountBN = toCurrency(userCollateralAmountETHBN);
      const roundedCollateralDeposit = mathjs.round(
        mathjs.add(chosenCollateralBN, userCollateralAmountBN),
        4
      );
      const readableCollateralDeposit = `${roundedCollateralDeposit}`;
      expect(readableCollateralDeposit).to.equal("1000000");
    });
    it("Should display human readable 'MIM Borrowed' based on selected values (4.dp)", async function () {
      const userBorrowPartETHBN = (
        await cauldron(userAddress).functions.userBorrowPart(
          userAddress.address
        )
      )[0];

      const totalBorrow = await cauldron(userAddress).functions.totalBorrow();
      const userBorrowPartBN = toCurrency(userBorrowPartETHBN);
      const totalBorrowElasticBN = toCurrency(totalBorrow.elastic);
      const totalBorrowBaseBN = toCurrency(totalBorrow.base);
      const userBorrowAmountBN = mathjs.multiply(
        mathjs.divide(userBorrowPartBN, totalBorrowBaseBN),
        totalBorrowElasticBN
      );
      toBorrowAmountPlusBorrowFeeBN = mathjs.add(
        mathjs.multiply(maxMimBorrowableBN, 1.0005),
        userBorrowAmountBN
      );
      const roundedToBorrowAmountPlusBorrowFeeBN = mathjs.round(
        toBorrowAmountPlusBorrowFeeBN,
        4
      );
      expect(roundedToBorrowAmountPlusBorrowFeeBN.toString()).to.equal(
        "1.6309"
      );
    });
    it("Should display human readable 'Collateral Value' based on selected collateral and price of asset", async function () {
      const collateralValueBN = mathjs.multiply(
        mathjs.divide(
          mathjs.bignumber("1e18"),
          mathjs.bignumber(exchangeRateETHBN.toString())
        ),
        chosenCollateralBN
      );
      const roundedCollateralValue = mathjs.round(collateralValueBN, 2);
      const readableCollateralValue = `$${roundedCollateralValue}`;
      expect(readableCollateralValue).to.equal("$8.15");
    });
    it("Should display human readable 'Liquidation Price' based on selected LTV and price of asset", async function () {
      const liquidationPriceBN = mathjs.divide(
        mathjs.divide(toBorrowAmountPlusBorrowFeeBN, maxAllowedLTVBN),
        chosenCollateralBN
      );
      const roundedLiqPriceBN = mathjs.round(liquidationPriceBN, 6);
      const readableLiqPrice = `$${roundedLiqPriceBN}`;
      expect(readableLiqPrice).to.equal("$0.000002");
    });
  });
  describe("Allow Spend", function () {
    it("Should approve adequate token spend allowance if there is not enough for the deposit to go through", async function () {
      const approvedTokenSpendETHBN = (
        await shibContract(userAddress).functions.allowance(
          userAddress.address,
          BENTO_CONTRACT_ADDRESS
        )
      )[0];
      const approvedTokenSpendBN = mathjs.bignumber(
        approvedTokenSpendETHBN.toString()
      );
      const hasEnoughTokensApproved =
        approvedTokenSpendBN >= chosenCollateralBN;

      if (!hasEnoughTokensApproved) {
        await approveTokenSpend(toSolidityUint256(chosenCollateralBN));
        const afterApprovedTokenSpendETHBN = (
          await shibContract(userAddress).functions.allowance(
            userAddress.address,
            BENTO_CONTRACT_ADDRESS
          )
        )[0];
        const afterApprovedTokenSpendBN = mathjs.bignumber(
          afterApprovedTokenSpendETHBN.toString()
        );
        expect(toFixed(afterApprovedTokenSpendBN)).to.equal(
          toFixed(mathjs.add(approvedTokenSpendBN, afterApprovedTokenSpendBN))
        );
        return;
      }
      expect(hasEnoughTokensApproved).to.equal(true);
    });
  });
  describe("Create Signature", function () {
    it("Should create the correct signature", async function () {
      const { domain, types, value } = await getSignedTypedDataParameters(
        userAddress.address,
        provider
      );
      const signature = await generateSignature(userAddress)(
        domain,
        types,
        value
      );
      const { r, s, v } = recoverRSV(signature);
      rVal = r;
      sVal = s;
      vVal = v;
      const recoveredAddress = verifySignatureSigner({
        domain,
        types,
        value,
        r,
        s,
        v,
      });
      expect(recoveredAddress.toLowerCase()).to.equal(
        userAddress.address.toLowerCase()
      );
    });
  });

  describe("Cook", function () {
    it("Generates the correct Set Approval parameters", async function () {
      setApprovalParams = setApproval(userAddress.address, vVal, rVal, sVal);
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["address", "address", "bool", "uint8", "bytes32", "bytes32"],
        setApprovalParams.bytes
      );
      expect(setApprovalParams.code).to.equal(24);
      expect(setApprovalParams.value).to.equal(0);
      expect(decoded[0]).to.equal(userAddress.address);
      expect(decoded[2]).to.equal(true);
      expect(decoded[3]).to.equal(vVal);
      expect(decoded[4]).to.equal(rVal);
      expect(decoded[5]).to.equal(sVal);
    });

    it("Generates the correct Deposit Collateral parameters", async function () {
      const collateralToAddAsCollateralInETHBN =
        toSolidityUint256(chosenCollateralBN);
      collateralShareETHBN = (
        await bentoBox(userAddress).functions.toShare(
          SHIB_ERC20,
          collateralToAddAsCollateralInETHBN,
          false
        )
      )[0];
      depositCollateralParams = depositCollateral(
        userAddress.address,
        collateralToAddAsCollateralInETHBN,
        collateralShareETHBN
      );
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["address", "address", "int256", "int256"],
        depositCollateralParams.bytes
      );
      expect(depositCollateralParams.code).to.equal(20);
      expect(depositCollateralParams.value).to.equal(0);
      expect(decoded[0]).to.equal(SHIB_ERC20);
      expect(decoded[1]).to.equal(userAddress.address);
      expect(decoded[2]).to.equal(collateralToAddAsCollateralInETHBN);
      expect(decoded[3]).to.equal(collateralToAddAsCollateralInETHBN);
    });

    it("Generates the correct Add Collateral parameters", async function () {
      addCollateralParams = addCollateral(
        collateralShareETHBN,
        userAddress.address
      );
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["int256", "address", "bool"],
        addCollateralParams.bytes
      );
      expect(addCollateralParams.code).to.equal(10);
      expect(addCollateralParams.value).to.equal(0);
      expect(decoded[0]).to.equal(collateralShareETHBN);
      expect(decoded[1]).to.equal(userAddress.address);
      expect(decoded[2]).to.equal(false);
    });
    it("Generates the correct Borrow MIM parameters", async function () {
      maxMIMBorrowableETHBN = toSolidityUint256(maxMimBorrowableBN);
      borrowMIMParams = borrowMIM(userAddress.address, maxMIMBorrowableETHBN);
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["int256", "address"],
        borrowMIMParams.bytes
      );
      expect(borrowMIMParams.code).to.equal(5);
      expect(borrowMIMParams.value).to.equal(0);
      expect(decoded[0]).to.equal(maxMIMBorrowableETHBN);
      expect(decoded[1]).to.equal(userAddress.address);
    });

    it("Generates the correct Withdraw MIM parameters", async function () {
      const mimShareBorrowableETHBN = (
        await bentoBox(userAddress).functions.toShare(
          MIM_ERC20,
          maxMIMBorrowableETHBN,
          false
        )
      )[0];
      withdrawMIMParams = withdrawMIM(
        userAddress.address,
        maxMIMBorrowableETHBN,
        mimShareBorrowableETHBN
      );
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["address", "address", "int256", "int256"],
        withdrawMIMParams.bytes
      );
      expect(withdrawMIMParams.code).to.equal(21);
      expect(withdrawMIMParams.value).to.equal(0);
      expect(decoded[0]).to.equal(MIM_ERC20);
      expect(decoded[1]).to.equal(userAddress.address);
      expect(decoded[2]).to.equal(maxMIMBorrowableETHBN);
      expect(decoded[3]).to.equal(mimShareBorrowableETHBN);
    });

    it("Can cook loan recipe", async function () {
      const startingMIMBalance = mimBalETHBN;
      const expectedEndingMIMBalance = startingMIMBalance.add(
        maxMIMBorrowableETHBN
      );
      const tx = await cauldron(userAddress).functions.cook(
        [
          setApprovalParams.code,
          depositCollateralParams.code,
          addCollateralParams.code,
          borrowMIMParams.code,
          withdrawMIMParams.code,
        ],
        [
          setApprovalParams.value,
          depositCollateralParams.value,
          addCollateralParams.value,
          borrowMIMParams.value,
          withdrawMIMParams.value,
        ],
        [
          setApprovalParams.bytes,
          depositCollateralParams.bytes,
          addCollateralParams.bytes,
          borrowMIMParams.bytes,
          withdrawMIMParams.bytes,
        ],
        {
          gasPrice: 20,
          gasLimit: 400000,
        }
      );

      const res = await tx.wait();
      const statusCode = res.status;
      expect(statusCode).to.equal(1);
      const retrievedMIMBalanceETHBN = await getTokenBalance(
        mimContract(userAddress)
      );
      console.log("Start MIM Bal", startingMIMBalance.toString());
      console.log("MIM To Borrow:", maxMIMBorrowableETHBN.toString());
      console.log("Expected MIM Bal:", expectedEndingMIMBalance.toString());
      console.log("Actual MIM Bal:", retrievedMIMBalanceETHBN.toString());
      expect(retrievedMIMBalanceETHBN.toString()).to.equal(
        "1630047509018785949"
      );
    });
  });
});
