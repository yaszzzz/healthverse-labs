// scripts/deployment/01_deploy_token.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying HealthToken...");
  
  const HealthToken = await ethers.getContractFactory("HealthToken");
  const healthToken = await HealthToken.deploy();
  const tokenAddress = await healthToken.getAddress();
  
  console.log("HealthToken deployed to:", tokenAddress);
  
  return tokenAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});