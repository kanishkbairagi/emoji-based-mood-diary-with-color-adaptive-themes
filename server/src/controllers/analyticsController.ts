import { Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export async function getAffectiveSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const stats = await db.getStats(req.user.userId);
    const totalEntries = stats.reduce((sum, item) => sum + item.count, 0);

    // Calculate aggregated Valence & Arousal across user's history
    let aggregateValence = 0;
    let aggregateArousal = 0;

    if (totalEntries > 0) {
      const totalValenceSum = stats.reduce((sum, item) => sum + item.avg_valence * item.count, 0);
      const totalArousalSum = stats.reduce((sum, item) => sum + item.avg_arousal * item.count, 0);
      aggregateValence = parseFloat((totalValenceSum / totalEntries).toFixed(2));
      aggregateArousal = parseFloat((totalArousalSum / totalEntries).toFixed(2));
    }

    res.json({
      summary: {
        totalEntries,
        aggregateValence, // Russell Circumplex mean: -1 (negative) to +1 (positive)
        aggregateArousal, // Russell Circumplex mean: -1 (lethargic) to +1 (activated)
        moodBreakdown: stats,
      },
    });
  } catch (err) {
    next(err);
  }
}
