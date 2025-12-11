import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthVerse, HealthToken, GoogleFitOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HealthVerse", function () {
    let healthVerse: HealthVerse;
    let healthToken: HealthToken;
    let oracle: GoogleFitOracle;
    let owner: SignerWithAddress;
    let trustedSigner: SignerWithAddress;
    let user: SignerWithAddress;

    const DAILY_GOAL_STEPS = 6000n;
    const DAILY_GOAL_CALORIES = 2000n;
    const REWARD_AMOUNT = ethers.parseEther("10");

    beforeEach(async function () {
        [owner, trustedSigner, user] = await ethers.getSigners();

        // Deploy HealthToken
        const HealthTokenFactory = await ethers.getContractFactory("HealthToken");
        healthToken = await HealthTokenFactory.deploy();
        await healthToken.waitForDeployment();

        // Deploy GoogleFitOracle
        const OracleFactory = await ethers.getContractFactory("GoogleFitOracle");
        oracle = await OracleFactory.deploy(trustedSigner.address);
        await oracle.waitForDeployment();

        // Deploy HealthVerse
        const HealthVerseFactory = await ethers.getContractFactory("HealthVerse");
        healthVerse = await HealthVerseFactory.deploy(
            await healthToken.getAddress(),
            await oracle.getAddress()
        );
        await healthVerse.waitForDeployment();

        // Setup: Set HealthVerse as the minting contract
        await healthToken.setHealthVerseContract(await healthVerse.getAddress());
    });

    describe("Deployment", function () {
        it("Should set token and oracle addresses correctly", async function () {
            const [tokenAddr, oracleAddr] = await healthVerse.getContractAddresses();
            expect(tokenAddr).to.equal(await healthToken.getAddress());
            expect(oracleAddr).to.equal(await oracle.getAddress());
        });

        it("Should have oracle verification disabled by default", async function () {
            const status = await healthVerse.getUserStatus(user.address);
            expect(status.oracleRequired).to.be.false;
        });
    });

    describe("addHealthData", function () {
        it("Should add valid health data", async function () {
            const steps = 5000n;
            const calories = 1500n;
            const heartRate = 80n;
            const signature = "0x"; // Empty signature when oracle verification is disabled

            await expect(healthVerse.connect(user).addHealthData(steps, calories, heartRate, signature))
                .to.emit(healthVerse, "HealthDataAdded");
        });

        it("Should reject invalid heart rate (too low)", async function () {
            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 30n, "0x"))
                .to.be.revertedWith("Invalid heart rate");
        });

        it("Should reject invalid heart rate (too high)", async function () {
            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 250n, "0x"))
                .to.be.revertedWith("Invalid heart rate");
        });

        it("Should reject steps too high", async function () {
            await expect(healthVerse.connect(user).addHealthData(60000n, 1500n, 80n, "0x"))
                .to.be.revertedWith("Steps too high");
        });

        it("Should reject calories too high", async function () {
            await expect(healthVerse.connect(user).addHealthData(5000n, 25000n, 80n, "0x"))
                .to.be.revertedWith("Calories too high");
        });

        it("Should accumulate daily data", async function () {
            await healthVerse.connect(user).addHealthData(3000n, 1000n, 75n, "0x");
            await healthVerse.connect(user).addHealthData(3000n, 1000n, 80n, "0x");

            const progress = await healthVerse.getTodayProgress(user.address);
            expect(progress.steps).to.equal(6000n);
            expect(progress.calories).to.equal(2000n);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to pause contract", async function () {
            await expect(healthVerse.pauseContract())
                .to.emit(healthVerse, "ContractPaused")
                .withArgs(true);

            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 80n, "0x"))
                .to.be.revertedWith("Contract paused");
        });

        it("Should allow owner to unpause contract", async function () {
            await healthVerse.pauseContract();
            await healthVerse.unpauseContract();

            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 80n, "0x"))
                .to.not.be.reverted;
        });

        it("Should allow owner to ban user", async function () {
            await expect(healthVerse.banUser(user.address))
                .to.emit(healthVerse, "UserBanned")
                .withArgs(user.address);

            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 80n, "0x"))
                .to.be.revertedWith("User banned");
        });

        it("Should allow owner to unban user", async function () {
            await healthVerse.banUser(user.address);
            await healthVerse.unbanUser(user.address);

            await expect(healthVerse.connect(user).addHealthData(5000n, 1500n, 80n, "0x"))
                .to.not.be.reverted;
        });

        it("Should allow owner to toggle oracle verification", async function () {
            await expect(healthVerse.toggleOracleVerification(true))
                .to.emit(healthVerse, "OracleVerificationToggled")
                .withArgs(true);

            const status = await healthVerse.getUserStatus(user.address);
            expect(status.oracleRequired).to.be.true;
        });
    });

    describe("View Functions", function () {
        it("Should return correct today progress", async function () {
            await healthVerse.connect(user).addHealthData(7000n, 2500n, 75n, "0x");

            const progress = await healthVerse.getTodayProgress(user.address);
            expect(progress.steps).to.equal(7000n);
            expect(progress.calories).to.equal(2500n);
            expect(progress.stepsGoalReached).to.be.true;
            expect(progress.caloriesGoalReached).to.be.true;
        });

        it("Should return correct user status", async function () {
            const status = await healthVerse.getUserStatus(user.address);
            expect(status.isBanned).to.be.false;
            expect(status.isContractPaused).to.be.false;
            expect(status.oracleRequired).to.be.false;
        });
    });
});
