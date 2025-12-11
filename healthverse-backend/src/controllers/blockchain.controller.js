import blockchainService from '../services/blockchain.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * Get blockchain health status
 */
export const getBlockchainHealth = async (req, res, next) => {
    try {
        const health = await blockchainService.getHealth();
        return sendSuccess(res, health, 'Blockchain health status');
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's today progress from blockchain
 */
export const getTodayProgress = async (req, res, next) => {
    try {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            return sendError(res, 'Wallet address is required', 400);
        }

        const progress = await blockchainService.getTodayProgress(walletAddress);
        return sendSuccess(res, progress, 'Today progress retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's status from blockchain
 */
export const getUserStatus = async (req, res, next) => {
    try {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            return sendError(res, 'Wallet address is required', 400);
        }

        const status = await blockchainService.getUserStatus(walletAddress);
        return sendSuccess(res, status, 'User status retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's token balance
 */
export const getTokenBalance = async (req, res, next) => {
    try {
        const { walletAddress } = req.query;

        if (!walletAddress) {
            return sendError(res, 'Wallet address is required', 400);
        }

        const balance = await blockchainService.getTokenBalance(walletAddress);
        return sendSuccess(res, { balance, symbol: 'HEALTH' }, 'Token balance retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Get daily data for a specific date
 */
export const getDailyData = async (req, res, next) => {
    try {
        const { walletAddress, date } = req.query;

        if (!walletAddress || !date) {
            return sendError(res, 'Wallet address and date are required', 400);
        }

        const dailyData = await blockchainService.getDailyData(walletAddress, parseInt(date));
        return sendSuccess(res, dailyData, 'Daily data retrieved');
    } catch (error) {
        next(error);
    }
};

/**
 * Sign health data for blockchain submission
 * User calls this to get a signature, then submits to blockchain
 */
export const signHealthData = async (req, res, next) => {
    try {
        const { walletAddress, steps, calories, heartRate } = req.body;

        if (!walletAddress || steps === undefined || calories === undefined || heartRate === undefined) {
            return sendError(res, 'walletAddress, steps, calories, and heartRate are required', 400);
        }

        // Validate data ranges (matching contract validation)
        if (heartRate < 40 || heartRate > 220) {
            return sendError(res, 'Heart rate must be between 40 and 220', 400);
        }
        if (steps > 50000) {
            return sendError(res, 'Steps cannot exceed 50000', 400);
        }
        if (calories > 20000) {
            return sendError(res, 'Calories cannot exceed 20000', 400);
        }

        const signedData = await blockchainService.signHealthData(
            walletAddress,
            parseInt(steps),
            parseInt(calories),
            parseInt(heartRate)
        );

        logger.info('Health data signed', { walletAddress, steps, calories, heartRate });

        return sendSuccess(res, signedData, 'Health data signed successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get contract goals
 */
export const getGoals = async (req, res, next) => {
    try {
        const goals = await blockchainService.getGoals();
        return sendSuccess(res, goals, 'Contract goals retrieved');
    } catch (error) {
        next(error);
    }
};
