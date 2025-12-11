import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { HEALTHVERSE_ABI, HEALTH_TOKEN_ABI, GOOGLE_FIT_ORACLE_ABI } from '../contracts/abis.js';
import signingService from './signing.service.js';

/**
 * Blockchain Service for interacting with HealthVerse smart contracts
 */
class BlockchainService {
    constructor() {
        this.provider = null;
        this.healthVerseContract = null;
        this.healthTokenContract = null;
        this.oracleContract = null;
        this.isInitialized = false;
    }

    /**
     * Initialize blockchain connections
     */
    async initialize() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
            const healthVerseAddress = process.env.HEALTHVERSE_CONTRACT_ADDRESS;
            const healthTokenAddress = process.env.HEALTH_TOKEN_CONTRACT_ADDRESS;
            const oracleAddress = process.env.GOOGLE_FIT_ORACLE_CONTRACT_ADDRESS;

            if (!rpcUrl || !healthVerseAddress || healthVerseAddress === '0x0000000000000000000000000000000000000000') {
                logger.warn('Blockchain not configured, running in mock mode');
                return false;
            }

            // Create provider
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // Test connection
            await this.provider.getNetwork();

            // Initialize read-only contracts
            this.healthVerseContract = new ethers.Contract(healthVerseAddress, HEALTHVERSE_ABI, this.provider);
            this.healthTokenContract = new ethers.Contract(healthTokenAddress, HEALTH_TOKEN_ABI, this.provider);
            this.oracleContract = new ethers.Contract(oracleAddress, GOOGLE_FIT_ORACLE_ABI, this.provider);

            // Initialize signing service
            signingService.initialize();

            this.isInitialized = true;

            logger.info('Blockchain service initialized', {
                rpcUrl,
                healthVerseAddress,
                healthTokenAddress,
                oracleAddress
            });

            return true;
        } catch (error) {
            logger.error('Failed to initialize blockchain service', error);
            return false;
        }
    }

    /**
     * Check if blockchain is connected
     */
    isConnected() {
        return this.isInitialized;
    }

    /**
     * Get user's today progress from blockchain
     * @param {string} userAddress - User's wallet address
     */
    async getTodayProgress(userAddress) {
        if (!this.isInitialized) {
            throw new AppError('Blockchain not connected', 503, 'BLOCKCHAIN_NOT_CONNECTED');
        }

        try {
            const result = await this.healthVerseContract.getTodayProgress(userAddress);

            return {
                steps: Number(result.steps),
                calories: Number(result.calories),
                stepsGoalReached: result.stepsGoalReached,
                caloriesGoalReached: result.caloriesGoalReached,
                canClaimReward: result.canClaimReward,
                oracleVerified: result.oracleVerified
            };
        } catch (error) {
            logger.error('Failed to get today progress', error);
            throw new AppError('Failed to get blockchain data', 500, 'BLOCKCHAIN_READ_ERROR');
        }
    }

    /**
     * Get user's status from blockchain
     * @param {string} userAddress
     */
    async getUserStatus(userAddress) {
        if (!this.isInitialized) {
            throw new AppError('Blockchain not connected', 503, 'BLOCKCHAIN_NOT_CONNECTED');
        }

        try {
            const result = await this.healthVerseContract.getUserStatus(userAddress);

            return {
                isBanned: result.isBanned,
                lastActive: Number(result.lastActive),
                isContractPaused: result.isContractPaused,
                oracleRequired: result.oracleRequired
            };
        } catch (error) {
            logger.error('Failed to get user status', error);
            throw new AppError('Failed to get user status', 500, 'BLOCKCHAIN_READ_ERROR');
        }
    }

    /**
     * Get user's token balance
     * @param {string} userAddress
     */
    async getTokenBalance(userAddress) {
        if (!this.isInitialized) {
            throw new AppError('Blockchain not connected', 503, 'BLOCKCHAIN_NOT_CONNECTED');
        }

        try {
            const balance = await this.healthTokenContract.balanceOf(userAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            logger.error('Failed to get token balance', error);
            throw new AppError('Failed to get token balance', 500, 'BLOCKCHAIN_READ_ERROR');
        }
    }

    /**
     * Get daily data for a specific date
     * @param {string} userAddress
     * @param {number} date - Unix timestamp / 86400
     */
    async getDailyData(userAddress, date) {
        if (!this.isInitialized) {
            throw new AppError('Blockchain not connected', 503, 'BLOCKCHAIN_NOT_CONNECTED');
        }

        try {
            const result = await this.healthVerseContract.getDailyData(userAddress, date);

            return {
                steps: Number(result.steps),
                calories: Number(result.calories),
                rewardStatus: result.rewardStatus,
                oracleVerified: result.oracleVerified
            };
        } catch (error) {
            logger.error('Failed to get daily data', error);
            throw new AppError('Failed to get daily data', 500, 'BLOCKCHAIN_READ_ERROR');
        }
    }

    /**
     * Sign health data for submission
     * This creates the signature that the user needs to submit to the blockchain
     * @param {string} userAddress
     * @param {number} steps
     * @param {number} calories  
     * @param {number} heartRate
     */
    async signHealthData(userAddress, steps, calories, heartRate) {
        const timestamp = Math.floor(Date.now() / 1000);

        const signature = await signingService.signHealthData(
            userAddress,
            steps,
            calories,
            heartRate,
            timestamp
        );

        return {
            signature,
            timestamp,
            signerAddress: signingService.getSignerAddress()
        };
    }

    /**
     * Get contract goals
     */
    async getGoals() {
        if (!this.isInitialized) {
            throw new AppError('Blockchain not connected', 503, 'BLOCKCHAIN_NOT_CONNECTED');
        }

        try {
            const [stepsGoal, caloriesGoal, rewardAmount] = await Promise.all([
                this.healthVerseContract.DAILY_GOAL_STEPS(),
                this.healthVerseContract.DAILY_GOAL_CALORIES(),
                this.healthVerseContract.REWARD_AMOUNT()
            ]);

            return {
                dailyStepsGoal: Number(stepsGoal),
                dailyCaloriesGoal: Number(caloriesGoal),
                rewardAmount: ethers.formatEther(rewardAmount)
            };
        } catch (error) {
            logger.error('Failed to get goals', error);
            throw new AppError('Failed to get goals', 500, 'BLOCKCHAIN_READ_ERROR');
        }
    }

    /**
     * Get blockchain health status
     */
    async getHealth() {
        try {
            if (!this.isInitialized) {
                return {
                    status: 'not_configured',
                    message: 'Blockchain not configured'
                };
            }

            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();

            return {
                status: 'connected',
                chainId: Number(network.chainId),
                blockNumber,
                contracts: {
                    healthVerse: await this.healthVerseContract.getAddress(),
                    healthToken: await this.healthTokenContract.getAddress(),
                    oracle: await this.oracleContract.getAddress()
                }
            };
        } catch (error) {
            logger.error('Blockchain health check failed', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
