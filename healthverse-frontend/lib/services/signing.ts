import { ethers } from 'ethers';
import { logger } from '@/lib/utils/logger';

/**
 * Signing Service for creating ECDSA signatures for health data
 */
class SigningService {
    private signer: ethers.Wallet | null = null;
    private isInitialized = false;

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
                signerAddress: this.signer.address,
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
    getSignerAddress(): string {
        if (!this.isInitialized || !this.signer) {
            throw new Error('Signing service not initialized');
        }
        return this.signer.address;
    }

    /**
     * Sign health data for oracle verification
     */
    async signHealthData(
        userAddress: string,
        steps: number,
        calories: number,
        heartRate: number,
        timestamp: number
    ): Promise<string> {
        if (!this.isInitialized || !this.signer) {
            throw new Error('Signing service not initialized');
        }

        if (!ethers.isAddress(userAddress)) {
            throw new Error('Invalid user address');
        }

        // Create message hash matching the contract's expectation
        const messageHash = ethers.solidityPackedKeccak256(
            ['address', 'uint64', 'uint64', 'uint64', 'uint64'],
            [userAddress, steps, calories, heartRate, timestamp]
        );

        // Sign the message
        const signature = await this.signer.signMessage(ethers.getBytes(messageHash));

        logger.debug('Health data signed', {
            userAddress,
            steps,
            calories,
            heartRate,
            timestamp,
            signatureLength: signature.length,
        });

        return signature;
    }

    /**
     * Verify a signature (for testing purposes)
     */
    verifySignature(
        userAddress: string,
        steps: number,
        calories: number,
        heartRate: number,
        timestamp: number,
        signature: string
    ): boolean {
        if (!this.signer) return false;

        try {
            const messageHash = ethers.solidityPackedKeccak256(
                ['address', 'uint64', 'uint64', 'uint64', 'uint64'],
                [userAddress, steps, calories, heartRate, timestamp]
            );

            const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

            return recoveredAddress.toLowerCase() === this.signer.address.toLowerCase();
        } catch (error) {
            logger.error('Signature verification failed', error);
            return false;
        }
    }
}

export const signingService = new SigningService();
export default signingService;
