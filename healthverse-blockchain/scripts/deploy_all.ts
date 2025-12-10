// scripts/deploy_all.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting HealthVerse deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address, "\n");

  // 1. Deploy Token
  console.log("1. Deploying HealthToken...");
  const HealthToken = await ethers.getContractFactory("HealthToken");
  const healthToken = await HealthToken.deploy();
  const tokenAddress = await healthToken.getAddress();
  console.log("✅ HealthToken deployed to:", tokenAddress);

  // 2. Deploy Oracle
  console.log("\n2. Deploying GoogleFitOracle...");
  const GoogleFitOracle = await ethers.getContractFactory("GoogleFitOracle");
  const oracle = await GoogleFitOracle.deploy();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ GoogleFitOracle deployed to:", oracleAddress);

  // 3. Deploy HealthVerse
  console.log("\n3. Deploying HealthVerse...");
  const HealthVerse = await ethers.getContractFactory("HealthVerse");
  const healthVerse = await HealthVerse.deploy(tokenAddress, oracleAddress);
  const healthVerseAddress = await healthVerse.getAddress();
  console.log("✅ HealthVerse deployed to:", healthVerseAddress);

  // 4. Setup contracts
  console.log("\n4. Setting up contract relationships...");
  await healthToken.setHealthVerseContract(healthVerseAddress);
  console.log("✅ Contracts setup completed!");

  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("======================");
  console.log("HealthToken:", tokenAddress);
  console.log("GoogleFitOracle:", oracleAddress);
  console.log("HealthVerse:", healthVerseAddress);
  console.log("======================\n");

  // Save addresses untuk frontend
  const addresses = {
    HealthToken: tokenAddress,
    GoogleFitOracle: oracleAddress,
    HealthVerse: healthVerseAddress,
  };
  
  console.log("💾 Save these addresses for frontend integration:");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});