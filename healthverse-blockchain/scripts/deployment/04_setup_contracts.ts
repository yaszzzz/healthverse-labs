// scripts/deployment/04_setup_contracts.ts
import { ethers } from "hardhat";

async function main() {
  // Ganti dengan addresses yang benar
  const TOKEN_ADDRESS = "PASTE_TOKEN_ADDRESS_HERE";
  const HEALTHVERSE_ADDRESS = "PASTE_HEALTHVERSE_ADDRESS_HERE";
  
  console.log("Setting up contract relationships...");
  
  const healthToken = await ethers.getContractAt("HealthToken", TOKEN_ADDRESS);
  await healthToken.setHealthVerseContract(HEALTHVERSE_ADDRESS);
  
  console.log("Contracts setup completed!");
  console.log("HealthToken -> HealthVerse:", await healthToken.healthVerseContract());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});