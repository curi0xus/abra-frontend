const { mathjs } = require("../util/math");

//takes in 2 mathjs bignumbers and returns mathjs bignumber
const calculateCollaterizationRatio = (collateralizationRate, precision) => {
  return mathjs.divide(collateralizationRate, precision);
};

//takes in 2 mathjs bignumbers and returns mathjs bignumber
const calculateRealExchangeRate = (exchangeRate, precision) => {
  return mathjs.divide(exchangeRate, precision);
};

//mathjs BigNumber X 3 then returns mathjs bignumber
const calculateMaxMIMBorrowable = (
  exchangeRate,
  collaterisationRatio,
  numCollateralTokens
) => {
  return mathjs.multiply(
    mathjs.divide(collaterisationRatio, exchangeRate),
    numCollateralTokens
  );
};

//1x mathjs bignumber returns mathjs bignumber
const calculateAnnualInterest = (interestPerSecond) => {
  const numSecsInAYearBN = mathjs.bignumber(3.154 * 1e7);
  const interestPerSecondPrecision = mathjs.bignumber("1e18");
  return mathjs.round(
    mathjs.multiply(
      mathjs.divide(
        mathjs.multiply(interestPerSecond, numSecsInAYearBN),
        interestPerSecondPrecision
      ),
      100
    )
  );
};

//1x mathjs bignumber returns mathjs bignumber
const calculatePriceOfOneCollateralToken = (exchangeRate) => {
  return mathjs.round(mathjs.divide(1, exchangeRate), 6);
};

module.exports = {
  calculateMaxMIMBorrowable,
  calculateCollaterizationRatio,
  calculateRealExchangeRate,
  calculateAnnualInterest,
  calculatePriceOfOneCollateralToken,
};
