import { ethers } from 'ethers';
import { logger } from '@/lib/utils/logger';
import { HEALTHVERSE_ABI, HEALTH_TOKEN_ABI, GOOGLE_FIT_ORACLE_ABI } from '@/lib/contracts/abis';
import signingService from './signing';

interface TodayProgress {
    steps: number;
    calories: number;
    stepsGoalReached: boolean;
    caloriesGoalReached: boolean;
    canClaimReward: boolean;
    oracleVerified: boolean;
}

interface UserStatus {
    isBanned: boolean;
    lastActive: number;
    isContractPaused: boolean;
    oracleRequired: boolean;
}

interface DailyData {
    steps: number;
    calories: number;
    rewardStatus: number;
    oracleVerified: boolean;
}

interface Goals {
    dailyStepsGoal: number;
    dailyCaloriesGoal: number;
    rewardAmount: string;
}

interface BlockchainHealth {
    status: string;
    message?: string;
    chainId?: number;
    blockNumber?: number;
    contracts?: {
        healthVerse: string;
        healthToken: string;
        oracle: string;
    };
}

/**
 * Blockchain Service for interacting with HealthVerse smart contracts
 */
class BlockchainService {
    private provider: ethers.JsonRpcProvider | null = null;
    private healthVerseContract: ethers.Contract | null = null;
    private healthTokenContract: ethers.Contract | null = null;
    private oracleContract: ethers.Contract | null = null;
    private isInitialized = false;

    /**
     * Initialize blockchain connections
     */
    async initialize(): Promise<boolean> {
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
            this.healthTokenContract = new ethers.Contract(healthTokenAddress!, HEALTH_TOKEN_ABI, this.provider);
            this.oracleContract = new ethers.Contract(oracleAddress!, GOOGLE_FIT_ORACLE_ABI, this.provider);

            // Initialize signing service
            signingService.initialize();

            this.isInitialized = true;

            logger.info('Blockchain service initialized', {
                rpcUrl,
                healthVerseAddress,
                healthTokenAddress,
                oracleAddress,
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
    isConnected(): boolean {
        return this.isInitialized;
    }

    /**
     * Ensure service is initialized
     */
    private ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Blockchain not connected');
        }
    }

    /**
     * Get user's today progress from blockchain
     */
    async getTodayProgress(userAddress: string): Promise<TodayProgress> {
        this.ensureInitialized();

        try {
            const result = await this.healthVerseContract!.getTodayProgress(userAddress);

            return {
                steps: Number(result.steps),
                calories: Number(result.calories),
                stepsGoalReached: result.stepsGoalReached,
                caloriesGoalReached: result.caloriesGoalReached,
                canClaimReward: result.canClaimReward,
                oracleVerified: result.oracleVerified,
            };
        } catch (error) {
            logger.error('Failed to get today progress', error);
            throw new Error('Failed to get blockchain data');
        }
    }

    /**
     * Get user's status from blockchain
     */
    async getUserStatus(userAddress: string): Promise<UserStatus> {
        this.ensureInitialized();

        try {
            const result = await this.healthVerseContract!.getUserStatus(userAddress);

            return {
                isBanned: result.isBanned,
                lastActive: Number(result.lastActive),
                isContractPaused: result.isContractPaused,
                oracleRequired: result.oracleRequired,
            };
        } catch (error) {
            logger.error('Failed to get user status', error);
            throw new Error('Failed to get user status');
        }
    }

    /**
     * Get user's token balance
     */
    async getTokenBalance(userAddress: string): Promise<string> {
        this.ensureInitialized();

        try {
            const balance = await this.healthTokenContract!.balanceOf(userAddress);
            return ethers.formatEther(balance);
        } catch (error) {
            logger.error('Failed to get token balance', error);
            throw new Error('Failed to get token balance');
        }
    }

    /**
     * Get daily data for a specific date
     */
    async getDailyData(userAddress: string, date: number): Promise<DailyData> {
        this.ensureInitialized();

        try {
            const result = await this.healthVerseContract!.getDailyData(userAddress, date);

            return {
                steps: Number(result.steps),
                calories: Number(result.calories),
                rewardStatus: Number(result.rewardStatus),
                oracleVerified: result.oracleVerified,
            };
        } catch (error) {
            logger.error('Failed to get daily data', error);
            throw new Error('Failed to get daily data');
        }
    }

    /**
     * Sign health data for submission
     */
    async signHealthData(
        userAddress: string,
        steps: number,
        calories: number,
        heartRate: number
    ) {
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
            signerAddress: signingService.getSignerAddress(),
        };
    }

    /**
     * Get contract goals
     */
    async getGoals(): Promise<Goals> {
        this.ensureInitialized();

        try {
            const [stepsGoal, caloriesGoal, rewardAmount] = await Promise.all([
                this.healthVerseContract!.DAILY_GOAL_STEPS(),
                this.healthVerseContract!.DAILY_GOAL_CALORIES(),
                this.healthVerseContract!.REWARD_AMOUNT(),
            ]);

            return {
                dailyStepsGoal: Number(stepsGoal),
                dailyCaloriesGoal: Number(caloriesGoal),
                rewardAmount: ethers.formatEther(rewardAmount),
            };
        } catch (error) {
            logger.error('Failed to get goals', error);
            throw new Error('Failed to get goals');
        }
    }

    /**
     * Get blockchain health status
     */
    async getHealth(): Promise<BlockchainHealth> {
        try {
            if (!this.isInitialized) {
                return {
                    status: 'not_configured',
                    message: 'Blockchain not configured',
                };
            }

            const network = await this.provider!.getNetwork();
            const blockNumber = await this.provider!.getBlockNumber();

            return {
                status: 'connected',
                chainId: Number(network.chainId),
                blockNumber,
                contracts: {
                    healthVerse: await this.healthVerseContract!.getAddress(),
                    healthToken: await this.healthTokenContract!.getAddress(),
                    oracle: await this.oracleContract!.getAddress(),
                },
            };
        } catch (error) {
            logger.error('Blockchain health check failed', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
