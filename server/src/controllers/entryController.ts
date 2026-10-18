import { Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const CreateEntrySchema = z.object({
  moodId: z.string().min(1).max(32),
  moodLabel: z.string().min(1).max(64),
  valence: z.number().min(-1.0).max(1.0).default(0.0),
  arousal: z.number().min(-1.0).max(1.0).default(0.0),
  encryptedData: z.string().min(1, "Encrypted payload is required"),
  iv: z.string().min(8, "Initialization vector is required"),
  authTag: z.string().min(8, "Authentication tag is required"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
});

export async function createEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = CreateEntrySchema.parse(req.body);

    const record = await db.createEntry({
      user_id: req.user.userId,
      mood_id: data.moodId,
      mood_label: data.moodLabel,
      valence: data.valence,
      arousal: data.arousal,
      encrypted_data: data.encryptedData,
      iv: data.iv,
      auth_tag: data.authTag,
      entry_date: data.entryDate,
    });

    res.status(201).json({
      message: "Encrypted entry persisted successfully",
      entry: record,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEntries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "50", 10)));
    const offset = Math.max(0, parseInt((req.query.offset as string) || "0", 10));

    const entries = await db.getEntries(req.user.userId, limit, offset);

    res.json({
      entries,
      pagination: { limit, offset, count: entries.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEntryByDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Bad Request", message: "Date must match YYYY-MM-DD format." });
      return;
    }

    const entry = await db.getEntryByDate(req.user.userId, date);
    if (!entry) {
      res.status(404).json({ error: "Not Found", message: `No entry found for date ${date}` });
      return;
    }

    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteEntry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const id = req.params.id;
    const deleted = await db.deleteEntry(id, req.user.userId);

    if (!deleted) {
      res.status(404).json({ error: "Not Found", message: "Entry not found or access denied." });
      return;
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    next(err);
  }
}
