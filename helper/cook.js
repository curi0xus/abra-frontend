const { ethers } = require("ethers");
const {
  MASTER_CONTRACT,
  SHIB_ERC20,
  MIM_ERC20,
} = require("../smartContract/constant");

const setApproval = (userAddress, v, r, s) => {
  const code = 24;
  const value = 0;
  const setApprovalAbiEncodedData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bool", "uint8", "bytes32", "bytes32"],
    [userAddress, MASTER_CONTRACT, true, v, r, s]
  );
  const encodedDataInBytes = ethers.utils.arrayify(setApprovalAbiEncodedData);
  return {
    code,
    value,
    bytes: encodedDataInBytes,
  };
};

const depositCollateral = (userAddress, collateralAmount, collateralShare) => {
  const code = 20;

  const value = 0;
  const depositCollateralAbiEncodedData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "int256", "int256"],
    [SHIB_ERC20, userAddress, collateralAmount, collateralShare]
  );
  const encodedDepositCollateralDataInBytes = ethers.utils.arrayify(
    depositCollateralAbiEncodedData
  );
  return {
    code,
    value,
    bytes: encodedDepositCollateralDataInBytes,
  };
};

const addCollateral = (collateralShare, userAddress) => {
  const code = 10;
  const value = 0;
  const addCollateralAbiEncodedData = ethers.utils.defaultAbiCoder.encode(
    ["int256", "address", "bool"],
    [collateralShare, userAddress, false]
  );
  const encodedAddCollateralDataInBytes = ethers.utils.arrayify(
    addCollateralAbiEncodedData
  );
  return {
    code,
    value,
    bytes: encodedAddCollateralDataInBytes,
  };
};

const borrowMIM = (userAddress, mimToBorrow) => {
  const code = 5;
  const value = 0;
  const borrowMimAbiEncodedData = ethers.utils.defaultAbiCoder.encode(
    ["int256", "address"],
    [mimToBorrow, userAddress]
  );
  const encodedborrowMimDataInBytes = ethers.utils.arrayify(
    borrowMimAbiEncodedData
  );
  return {
    code,
    value,
    bytes: encodedborrowMimDataInBytes,
  };
};

const withdrawMIM = (userAddress, mimToBorrow, mimShareToBorrow) => {
  const code = 21;
  const value = 0;
  const withdrawMimAbiEncodedData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "int256", "int256"],
    [MIM_ERC20, userAddress, mimToBorrow, mimShareToBorrow]
  );
  const encodedWithdrawMimDataInBytes = ethers.utils.arrayify(
    withdrawMimAbiEncodedData
  );
  return {
    code,
    value,
    bytes: encodedWithdrawMimDataInBytes,
  };
};

module.exports = {
  setApproval,
  depositCollateral,
  addCollateral,
  borrowMIM,
  withdrawMIM,
};
