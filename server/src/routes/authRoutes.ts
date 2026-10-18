import { Router } from "express";
import { register, login, getSalt, getMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Strict rate limit on auth endpoints to prevent brute-force attacks (10 requests per minute)
const authLimiter = createRateLimiter({ maxRequests: 15, windowSeconds: 60 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/salt", authLimiter, getSalt);
router.get("/me", requireAuth, getMe);

export default router;
