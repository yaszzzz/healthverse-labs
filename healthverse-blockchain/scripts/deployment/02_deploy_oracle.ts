// scripts/deployment/02_deploy_oracle.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GoogleFitOracle...");
  
  const GoogleFitOracle = await ethers.getContractFactory("GoogleFitOracle");
  const oracle = await GoogleFitOracle.deploy();
  const oracleAddress = await oracle.getAddress();
  
  console.log("GoogleFitOracle deployed to:", oracleAddress);
  
  return oracleAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});