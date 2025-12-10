import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { 
  healthCheck, 
  detailedHealth, 
  loadBalancerHealth,
  readinessCheck,
  livenessCheck 
} from "../controllers/health.controller.js";

const router = Router();

// ==================== HEALTH CHECK ROUTES ====================

// Basic health check (public)
router.get("/", optionalAuth, healthCheck);

// Detailed health information (authenticated users)
router.get("/detailed", requireAuth, detailedHealth);

// Load balancer health check (simple pass/fail)
router.get("/lb", loadBalancerHealth);

// Kubernetes readiness probe
router.get("/ready", readinessCheck);

// Kubernetes liveness probe
router.get("/live", livenessCheck);

export default router;