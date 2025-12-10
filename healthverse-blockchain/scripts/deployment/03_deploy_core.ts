// scripts/deployment/03_deploy_core.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Ganti dengan addresses dari deployment sebelumnya
  const TOKEN_ADDRESS = "PASTE_TOKEN_ADDRESS_HERE";
  const ORACLE_ADDRESS = "PASTE_ORACLE_ADDRESS_HERE";
  
  console.log("Deploying HealthVerse...");
  const HealthVerse = await ethers.getContractFactory("HealthVerse");
  const healthVerse = await HealthVerse.deploy(TOKEN_ADDRESS, ORACLE_ADDRESS);
  const healthVerseAddress = await healthVerse.getAddress();
  
  console.log("HealthVerse deployed to:", healthVerseAddress);
  
  return healthVerseAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});