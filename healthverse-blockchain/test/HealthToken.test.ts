import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HealthToken", function () {
    let healthToken: HealthToken;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let healthVerseContract: SignerWithAddress;

    const INITIAL_SUPPLY = ethers.parseEther("2000000"); // 2M tokens
    const MAX_SUPPLY = ethers.parseEther("10000000"); // 10M tokens

    beforeEach(async function () {
        [owner, user1, healthVerseContract] = await ethers.getSigners();
        const HealthTokenFactory = await ethers.getContractFactory("HealthToken");
        healthToken = await HealthTokenFactory.deploy();
        await healthToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await healthToken.name()).to.equal("HealthVerse Token");
            expect(await healthToken.symbol()).to.equal("HEALTH");
        });

        it("Should mint initial supply to owner", async function () {
            expect(await healthToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
        });

        it("Should set owner correctly", async function () {
            expect(await healthToken.owner()).to.equal(owner.address);
        });
    });

    describe("setHealthVerseContract", function () {
        it("Should allow owner to set HealthVerse contract", async function () {
            await expect(healthToken.setHealthVerseContract(healthVerseContract.address))
                .to.emit(healthToken, "HealthVerseContractUpdated")
                .withArgs(healthVerseContract.address);

            expect(await healthToken.healthVerseContract()).to.equal(healthVerseContract.address);
        });

        it("Should reject setting HealthVerse contract twice", async function () {
            await healthToken.setHealthVerseContract(healthVerseContract.address);
            await expect(healthToken.setHealthVerseContract(user1.address))
                .to.be.revertedWith("Already set");
        });

        it("Should reject non-owner setting HealthVerse contract", async function () {
            await expect(healthToken.connect(user1).setHealthVerseContract(healthVerseContract.address))
                .to.be.revertedWithCustomError(healthToken, "OwnableUnauthorizedAccount");
        });
    });

    describe("mintRewards", function () {
        beforeEach(async function () {
            await healthToken.setHealthVerseContract(healthVerseContract.address);
        });

        it("Should allow HealthVerse contract to mint rewards", async function () {
            const mintAmount = ethers.parseEther("100");
            await expect(healthToken.connect(healthVerseContract).mintRewards(user1.address, mintAmount))
                .to.emit(healthToken, "TokensMinted")
                .withArgs(user1.address, mintAmount);

            expect(await healthToken.balanceOf(user1.address)).to.equal(mintAmount);
        });

        it("Should reject minting from non-HealthVerse address", async function () {
            const mintAmount = ethers.parseEther("100");
            await expect(healthToken.connect(user1).mintRewards(user1.address, mintAmount))
                .to.be.revertedWith("Only HealthVerse can mint");
        });

        it("Should reject minting beyond MAX_SUPPLY", async function () {
            const overMintAmount = MAX_SUPPLY; // This would exceed max when added to initial supply
            await expect(healthToken.connect(healthVerseContract).mintRewards(user1.address, overMintAmount))
                .to.be.revertedWith("Exceeds max supply");
        });
    });

    describe("burn", function () {
        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("1000");
            const initialBalance = await healthToken.balanceOf(owner.address);

            await healthToken.burn(burnAmount);

            expect(await healthToken.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
        });

        it("Should reject burning more than balance", async function () {
            const burnAmount = ethers.parseEther("3000000"); // More than initial supply
            await expect(healthToken.burn(burnAmount))
                .to.be.revertedWithCustomError(healthToken, "ERC20InsufficientBalance");
        });
    });
});
