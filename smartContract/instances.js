const {
  SHIB_ERC20,
  MIM_ERC20,
  CAULDRON_CONTRACT_ADDRESS,
  BENTO_CONTRACT_ADDRESS,
} = require("./constant");
const bentoABI = require("../abis/bento.abi.json");
const cauldronABI = require("../abis/cauldron.abi.json");
const shibABI = require("../abis/shib.abi.json");
const swapperABI = require("../abis/swapper.abi.json");
const mimABI = require("../abis/mim.abi.json");

const shibContract = (provider) =>
  new ethers.Contract(SHIB_ERC20, shibABI, provider);
const mimContract = (provider) =>
  new ethers.Contract(MIM_ERC20, mimABI, provider);
const cauldron = (provider) =>
  new ethers.Contract(CAULDRON_CONTRACT_ADDRESS, cauldronABI, provider);
const bentoBox = (provider) =>
  new ethers.Contract(BENTO_CONTRACT_ADDRESS, bentoABI, provider);

module.exports = {
  shibContract,
  mimContract,
  cauldron,
  bentoBox,
};
