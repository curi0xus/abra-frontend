import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  typechain: {
    outDir: "types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["abis/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
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

export default config;
