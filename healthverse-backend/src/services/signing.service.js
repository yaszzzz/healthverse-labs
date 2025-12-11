import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Signing Service for creating ECDSA signatures for health data
 * Used by the Oracle contract to verify health data authenticity
 */
class SigningService {
    constructor() {
        this.signer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the signing wallet
     */
    initialize() {
        try {
            const privateKey = process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY;

            if (!privateKey) {
                logger.warn('BLOCKCHAIN_SIGNER_PRIVATE_KEY not configured, signing disabled');
                return false;
            }

            this.signer = new ethers.Wallet(privateKey);
            this.isInitialized = true;

            logger.info('Signing service initialized', {
                signerAddress: this.signer.address
            });

            return true;
        } catch (error) {
            logger.error('Failed to initialize signing service', error);
            return false;
        }
    }

    /**
     * Get the signer's address
     */
    getSignerAddress() {
        if (!this.isInitialized) {
            throw new AppError('Signing service not initialized', 500, 'SIGNING_NOT_INITIALIZED');
        }
        return this.signer.address;
    }

    /**
     * Sign health data for oracle verification
     * @param {string} userAddress - User's wallet address
     * @param {number} steps - Number of steps
     * @param {number} calories - Calories burned
     * @param {number} heartRate - Average heart rate
     * @param {number} timestamp - Unix timestamp
     * @returns {string} ECDSA signature
     */
    async signHealthData(userAddress, steps, calories, heartRate, timestamp) {
        if (!this.isInitialized) {
            throw new AppError('Signing service not initialized', 500, 'SIGNING_NOT_INITIALIZED');
        }

        try {
            // Validate inputs
            if (!ethers.isAddress(userAddress)) {
                throw new AppError('Invalid user address', 400, 'INVALID_ADDRESS');
            }

            // Create message hash matching the contract's expectation
            // abi.encodePacked(_user, _steps, _calories, _heartRate, _timestamp)
            const messageHash = ethers.solidityPackedKeccak256(
                ['address', 'uint64', 'uint64', 'uint64', 'uint64'],
                [userAddress, steps, calories, heartRate, timestamp]
            );

            // Sign the message (this creates an Ethereum signed message)
            const signature = await this.signer.signMessage(ethers.getBytes(messageHash));

            logger.debug('Health data signed', {
                userAddress,
                steps,
                calories,
                heartRate,
                timestamp,
                signatureLength: signature.length
            });

            return signature;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Failed to sign health data', error);
            throw new AppError('Failed to sign health data', 500, 'SIGNING_ERROR');
        }
    }

    /**
     * Verify a signature (for testing purposes)
     * @param {string} userAddress 
     * @param {number} steps 
     * @param {number} calories 
     * @param {number} heartRate 
     * @param {number} timestamp 
     * @param {string} signature 
     * @returns {boolean}
     */
    verifySignature(userAddress, steps, calories, heartRate, timestamp, signature) {
        try {
            const messageHash = ethers.solidityPackedKeccak256(
                ['address', 'uint64', 'uint64', 'uint64', 'uint64'],
                [userAddress, steps, calories, heartRate, timestamp]
            );

            const recoveredAddress = ethers.verifyMessage(
                ethers.getBytes(messageHash),
                signature
            );

            return recoveredAddress.toLowerCase() === this.signer.address.toLowerCase();
        } catch (error) {
            logger.error('Signature verification failed', error);
            return false;
        }
    }
}

export const signingService = new SigningService();
export default signingService;
