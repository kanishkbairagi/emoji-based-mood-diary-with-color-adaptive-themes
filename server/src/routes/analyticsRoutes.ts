import { Router } from "express";
import { getAffectiveSummary } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();
const analyticsLimiter = createRateLimiter({ maxRequests: 60, windowSeconds: 60 });

router.use(requireAuth);
router.use(analyticsLimiter);

router.get("/summary", getAffectiveSummary);

export default router;
