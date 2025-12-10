import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { fitDataLimiter } from "../config/ratelimit.js";
import { validateTimeRange } from "../middleware/validation.js";
import { getFitData, getFitDataSummary } from "../controllers/fitdata.controller.js";

const router = Router();

// ==================== FITNESS DATA ROUTES ====================

// Get detailed fitness data
router.get("/", 
  requireAuth, 
  fitDataLimiter, 
  validateTimeRange, 
  getFitData
);

// Get fitness data summary (aggregated)
router.get("/summary",
  requireAuth,
  fitDataLimiter,
  validateTimeRange,
  getFitDataSummary
);

export default router;