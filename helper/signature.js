const {
  BENTO_CONTRACT_ADDRESS,
  MASTER_CONTRACT,
} = require("../smartContract/constant");
const bentoABI = require("../abis/bento.abi.json");
const { ethers } = require("ethers");
const util = require("ethereumjs-util");

const generateSignature = (provider) => (domain, types, value) => {
  return provider._signTypedData(domain, types, value);
};

const verifySignatureSigner = ({ domain, types, value, r, s, v }) => {
  const digest = ethers.utils._TypedDataEncoder.hash(domain, types, value);
  const digestBuffer = util.toBuffer(digest);
  const pubK = util.ecrecover(
    digestBuffer,
    util.toBuffer(v),
    util.toBuffer(r),
    util.toBuffer(s)
  );
  const addressBuffer = util.pubToAddress(pubK);
  const address = util.bufferToHex(addressBuffer);
  return address;
};

const getSignedTypedDataParameters = async (userAddress, provider) => {
  const bento = await new ethers.Contract(
    BENTO_CONTRACT_ADDRESS,
    bentoABI,
    provider
  );
  const res = await bento.functions.nonces(userAddress);
  const nonceStr = res.toString();
  const nonce = parseInt(nonceStr);

  //Domain Separator
  const domain = {
    name: "BentoBox V1",
    chainId: 1,
    verifyingContract: BENTO_CONTRACT_ADDRESS,
  };

  const types = {
    SetMasterContractApproval: [
      { name: "warning", type: "string" },
      { name: "user", type: "address" },
      { name: "masterContract", type: "address" },
      { name: "approved", type: "bool" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const value = {
    warning: "Give FULL access to funds in (and approved to) BentoBox?",
    user: userAddress,
    masterContract: MASTER_CONTRACT,
    approved: true,
    nonce,
  };

  return {
    domain,
    types,
    value,
  };
};

function recoverRSV(signed) {
  const signature = signed.substring(2);
  const r = "0x" + signature.substring(0, 64);
  const s = "0x" + signature.substring(64, 128);
  const v = parseInt(signature.substring(128, 130), 16);
  return {
    r,
    s,
    v,
  };
}

module.exports = {
  generateSignature,
  verifySignatureSigner,
  getSignedTypedDataParameters,
  recoverRSV,
};
