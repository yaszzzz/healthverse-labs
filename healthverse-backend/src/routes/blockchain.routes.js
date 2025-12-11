import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
    getBlockchainHealth,
    getTodayProgress,
    getUserStatus,
    getTokenBalance,
    getDailyData,
    signHealthData,
    getGoals
} from "../controllers/blockchain.controller.js";

const router = Router();

// ==================== BLOCKCHAIN ROUTES ====================

// Health check (public)
router.get("/health", getBlockchainHealth);

// Get contract goals (public)
router.get("/goals", getGoals);

// Get today's progress for a wallet address
router.get("/progress", optionalAuth, getTodayProgress);

// Get user status from blockchain
router.get("/status", optionalAuth, getUserStatus);

// Get token balance for a wallet
router.get("/balance", optionalAuth, getTokenBalance);

// Get daily data for a specific date
router.get("/daily", optionalAuth, getDailyData);

// Sign health data for blockchain submission (requires auth)
router.post("/sign-health-data", requireAuth, signHealthData);

export default router;
