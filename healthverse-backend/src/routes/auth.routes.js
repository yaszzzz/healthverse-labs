import { Router } from "express";
import { authLimiter } from "../config/ratelimit.js";
import { validateAuthCallback } from "../middleware/validation.js";
import {
  startAuth,
  authCallback,
  checkAuthStatus,
  logout,
  register,
  login
} from "../controllers/auth.controller.js";

const router = Router();

// ==================== OAUTH2 FLOW ====================
router.get("/google", authLimiter, startAuth);
// Changed from /google/callback to /callback to match .env REDIRECT_URI
router.get("/callback", authLimiter, validateAuthCallback, authCallback);

// ==================== AUTH MANAGEMENT ====================
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.get("/status", authLimiter, checkAuthStatus);
router.post("/logout", authLimiter, logout);

export default router;