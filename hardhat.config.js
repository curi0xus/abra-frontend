require("@nomicfoundation/hardhat-toolbox");
require("./tasks/faucet");

module.exports = {
  solidity: "0.8.9",
  networks: {
    tenderly: {
      chainId: 1,
      url: "https://rpc.tenderly.co/fork/e21f7be5-892f-4169-86f1-80a29635b95b",
      accounts: [
        "0xd273a2a4f3377bcc0de92830b8aca056064d9b53257b26c492197c98169f1513",
      ],
    },
  },
};
