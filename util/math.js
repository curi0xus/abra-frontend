const { create, all } = require("mathjs");
const mathjs = create(all);
mathjs.config({
  number: "BigNumber", // Default type of number:
  // 'number' (default), 'BigNumber', or 'Fraction'
  precision: 18, // Number of significant digits for BigNumbers
  epsilon: 1e-30,
});

module.exports = { mathjs };
