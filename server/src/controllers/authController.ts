import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { db } from "../db/index.js";
import { config } from "../config/env.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  cryptoSalt: z.string().min(16).optional(), // Salt for client-side PBKDF2 derivation
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password, cryptoSalt } = RegisterSchema.parse(req.body);

    const existing = await db.findUserByUsername(username);
    if (existing) {
      res.status(409).json({ error: "Conflict", message: "Username already taken." });
      return;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const clientSalt = cryptoSalt || crypto.randomBytes(16).toString("hex");

    const user = await db.createUser(username, passwordHash, clientSalt);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        cryptoSalt: user.crypto_salt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    const user = await db.findUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid username or credentials." });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid username or credentials." });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        cryptoSalt: user.crypto_salt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSalt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.query.username as string;
    if (!username) {
      res.status(400).json({ error: "Bad Request", message: "Query parameter 'username' is required." });
      return;
    }

    const user = await db.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User not found." });
      return;
    }

    res.json({ cryptoSalt: user.crypto_salt });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await db.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "User record not found." });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        cryptoSalt: user.crypto_salt,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
