const { mathjs } = require("../util/math");
const { ethers } = require("ethers");

//Currency Conversion

//pass in a big number -> Used to convert mathjs to ether BN to send to SC
const toSolidityUint256 = (qtyOfToken) => {
  const preciseQtyOfToken = mathjs.multiply(qtyOfToken, mathjs.number("1e18"));
  return ethers.BigNumber.from(toFixed(preciseQtyOfToken));
};

//takes in a ETHERS BigNumber -> Used to convert to currency to be rounded off to displayed or to be compared as a number string
const toCurrency = (solidityBN) => {
  const currency = mathjs.divide(
    mathjs.bignumber(solidityBN.toString()),
    mathjs.bignumber("1e18")
  );
  return currency;
};

//takes in a BigNumber -> Format bignumber to fixed number to avoid abbrievation
const toFixed = (bignumber) => {
  return mathjs.format(bignumber, { notation: "fixed" });
};

const toBigNumber = (ethBN) => {
  return mathjs.bignumber(ethBN.toString());
};

module.exports = { toSolidityUint256, toCurrency, toFixed, toBigNumber };
