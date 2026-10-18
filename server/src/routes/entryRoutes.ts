import { Router } from "express";
import { createEntry, getEntries, getEntryByDate, deleteEntry } from "../controllers/entryController.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();
const apiLimiter = createRateLimiter({ maxRequests: 100, windowSeconds: 60 });

router.use(requireAuth);
router.use(apiLimiter);

router.post("/", createEntry);
router.get("/", getEntries);
router.get("/date/:date", getEntryByDate);
router.delete("/:id", deleteEntry);

export default router;
