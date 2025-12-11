import { expect } from "chai";
import { ethers } from "hardhat";
import { GoogleFitOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GoogleFitOracle", function () {
    let oracle: GoogleFitOracle;
    let owner: SignerWithAddress;
    let trustedSigner: SignerWithAddress;
    let verifier: SignerWithAddress;
    let user: SignerWithAddress;

    beforeEach(async function () {
        [owner, trustedSigner, verifier, user] = await ethers.getSigners();
        const OracleFactory = await ethers.getContractFactory("GoogleFitOracle");
        oracle = await OracleFactory.deploy(trustedSigner.address);
        await oracle.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the trusted signer correctly", async function () {
            expect(await oracle.trustedSigner()).to.equal(trustedSigner.address);
        });

        it("Should set owner as authorized verifier", async function () {
            expect(await oracle.authorizedVerifiers(owner.address)).to.be.true;
        });

        it("Should reject zero address as trusted signer", async function () {
            const OracleFactory = await ethers.getContractFactory("GoogleFitOracle");
            await expect(OracleFactory.deploy(ethers.ZeroAddress))
                .to.be.revertedWith("Invalid signer address");
        });
    });

    describe("Verifier Management", function () {
        it("Should allow owner to add verifier", async function () {
            await expect(oracle.addVerifier(verifier.address))
                .to.emit(oracle, "VerifierAdded")
                .withArgs(verifier.address);

            expect(await oracle.authorizedVerifiers(verifier.address)).to.be.true;
        });

        it("Should allow owner to remove verifier", async function () {
            await oracle.addVerifier(verifier.address);
            await expect(oracle.removeVerifier(verifier.address))
                .to.emit(oracle, "VerifierRemoved")
                .withArgs(verifier.address);

            expect(await oracle.authorizedVerifiers(verifier.address)).to.be.false;
        });

        it("Should reject non-owner adding verifier", async function () {
            await expect(oracle.connect(user).addVerifier(verifier.address))
                .to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
        });
    });

    describe("setTrustedSigner", function () {
        it("Should allow owner to update trusted signer", async function () {
            const newSigner = user;
            await expect(oracle.setTrustedSigner(newSigner.address))
                .to.emit(oracle, "TrustedSignerUpdated")
                .withArgs(trustedSigner.address, newSigner.address);

            expect(await oracle.trustedSigner()).to.equal(newSigner.address);
        });

        it("Should reject zero address", async function () {
            await expect(oracle.setTrustedSigner(ethers.ZeroAddress))
                .to.be.revertedWith("Invalid signer address");
        });
    });

    describe("verifyHealthData", function () {
        const steps = 8000n;
        const calories = 2500n;
        const heartRate = 75n;
        let timestamp: bigint;

        beforeEach(async function () {
            timestamp = BigInt(Math.floor(Date.now() / 1000));
        });

        async function createSignature(
            signer: SignerWithAddress,
            userAddr: string,
            _steps: bigint,
            _calories: bigint,
            _heartRate: bigint,
            _timestamp: bigint
        ): Promise<string> {
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint64", "uint64", "uint64", "uint64"],
                [userAddr, _steps, _calories, _heartRate, _timestamp]
            );
            return await signer.signMessage(ethers.getBytes(messageHash));
        }

        it("Should verify valid health data with correct signature", async function () {
            const signature = await createSignature(
                trustedSigner, user.address, steps, calories, heartRate, timestamp
            );

            await expect(oracle.verifyHealthData(
                user.address, steps, calories, heartRate, timestamp, signature
            )).to.emit(oracle, "DataVerified");

            const date = timestamp / 86400n;
            expect(await oracle.isDataVerified(user.address, date)).to.be.true;
        });

        it("Should reject invalid signature", async function () {
            // Sign with wrong signer
            const signature = await createSignature(
                user, user.address, steps, calories, heartRate, timestamp
            );

            await expect(oracle.verifyHealthData(
                user.address, steps, calories, heartRate, timestamp, signature
            )).to.be.revertedWith("Invalid signature");
        });

        it("Should reject invalid steps (too high)", async function () {
            const invalidSteps = 60000n;
            const signature = await createSignature(
                trustedSigner, user.address, invalidSteps, calories, heartRate, timestamp
            );

            await expect(oracle.verifyHealthData(
                user.address, invalidSteps, calories, heartRate, timestamp, signature
            )).to.be.revertedWith("Invalid steps");
        });

        it("Should reject invalid heart rate", async function () {
            const invalidHeartRate = 250n;
            const signature = await createSignature(
                trustedSigner, user.address, steps, calories, invalidHeartRate, timestamp
            );

            await expect(oracle.verifyHealthData(
                user.address, steps, calories, invalidHeartRate, timestamp, signature
            )).to.be.revertedWith("Invalid heart rate");
        });

        it("Should reject non-verifier", async function () {
            const signature = await createSignature(
                trustedSigner, user.address, steps, calories, heartRate, timestamp
            );

            await expect(oracle.connect(user).verifyHealthData(
                user.address, steps, calories, heartRate, timestamp, signature
            )).to.be.revertedWith("Not authorized verifier");
        });
    });
});
