import pg from "pg";
import { config } from "../config/env.js";

const { Pool } = pg;

export interface UserRecord {
  id: string;
  username: string;
  password_hash: string;
  crypto_salt: string;
  created_at: Date;
}

export interface DiaryEntryRecord {
  id: string;
  user_id: string;
  mood_id: string;
  mood_label: string;
  valence: number;
  arousal: number;
  encrypted_data: string;
  iv: string;
  auth_tag: string;
  entry_date: string;
  created_at: Date;
  updated_at: Date;
}

export interface IDatabase {
  init(): Promise<void>;
  createUser(username: string, passwordHash: string, cryptoSalt: string): Promise<UserRecord>;
  findUserByUsername(username: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createEntry(entry: Omit<DiaryEntryRecord, "id" | "created_at" | "updated_at">): Promise<DiaryEntryRecord>;
  getEntries(userId: string, limit?: number, offset?: number): Promise<DiaryEntryRecord[]>;
  getEntryByDate(userId: string, date: string): Promise<DiaryEntryRecord | null>;
  deleteEntry(id: string, userId: string): Promise<boolean>;
  getStats(userId: string): Promise<{ mood_id: string; count: number; avg_valence: number; avg_arousal: number }[]>;
}

// ---------------------------------------------------------------------------
// PostgreSQL Implementation (pg.Pool with Connection Pooling)
// ---------------------------------------------------------------------------
class PostgresDatabase implements IDatabase {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 20, // Max clients in connection pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      console.log("[DB] Connected to PostgreSQL with connection pool.");
      // Auto-run schema initialization
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            crypto_salt VARCHAR(64) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS diary_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mood_id VARCHAR(32) NOT NULL,
            mood_label VARCHAR(64) NOT NULL,
            valence NUMERIC(3, 2) DEFAULT 0.00,
            arousal NUMERIC(3, 2) DEFAULT 0.00,
            encrypted_data TEXT NOT NULL,
            iv VARCHAR(64) NOT NULL,
            auth_tag VARCHAR(64) NOT NULL,
            entry_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries (user_id, entry_date DESC);
        CREATE INDEX IF NOT EXISTS idx_diary_entries_user_mood ON diary_entries (user_id, mood_id);
      `);
      console.log("[DB] Schema and indexes verified.");
    } finally {
      client.release();
    }
  }

  async createUser(username: string, passwordHash: string, cryptoSalt: string): Promise<UserRecord> {
    const res = await this.pool.query(
      `INSERT INTO users (username, password_hash, crypto_salt)
       VALUES ($1, $2, $3)
       RETURNING id, username, password_hash, crypto_salt, created_at`,
      [username, passwordHash, cryptoSalt]
    );
    return res.rows[0];
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    const res = await this.pool.query(
      `SELECT id, username, password_hash, crypto_salt, created_at FROM users WHERE username = $1`,
      [username]
    );
    return res.rows[0] || null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const res = await this.pool.query(
      `SELECT id, username, password_hash, crypto_salt, created_at FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async createEntry(entry: Omit<DiaryEntryRecord, "id" | "created_at" | "updated_at">): Promise<DiaryEntryRecord> {
    const res = await this.pool.query(
      `INSERT INTO diary_entries (user_id, mood_id, mood_label, valence, arousal, encrypted_data, iv, auth_tag, entry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, mood_id, mood_label, valence::float, arousal::float, encrypted_data, iv, auth_tag, entry_date::text, created_at, updated_at`,
      [
        entry.user_id,
        entry.mood_id,
        entry.mood_label,
        entry.valence,
        entry.arousal,
        entry.encrypted_data,
        entry.iv,
        entry.auth_tag,
        entry.entry_date,
      ]
    );
    return res.rows[0];
  }

  async getEntries(userId: string, limit = 50, offset = 0): Promise<DiaryEntryRecord[]> {
    const res = await this.pool.query(
      `SELECT id, user_id, mood_id, mood_label, valence::float, arousal::float, encrypted_data, iv, auth_tag, entry_date::text, created_at, updated_at
       FROM diary_entries
       WHERE user_id = $1
       ORDER BY entry_date DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  }

  async getEntryByDate(userId: string, date: string): Promise<DiaryEntryRecord | null> {
    const res = await this.pool.query(
      `SELECT id, user_id, mood_id, mood_label, valence::float, arousal::float, encrypted_data, iv, auth_tag, entry_date::text, created_at, updated_at
       FROM diary_entries
       WHERE user_id = $1 AND entry_date = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, date]
    );
    return res.rows[0] || null;
  }

  async deleteEntry(id: string, userId: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM diary_entries WHERE id = $1 AND user_id = $2`, [id, userId]);
    return (res.rowCount ?? 0) > 0;
  }

  async getStats(userId: string): Promise<{ mood_id: string; count: number; avg_valence: number; avg_arousal: number }[]> {
    const res = await this.pool.query(
      `SELECT mood_id, COUNT(*)::int as count, AVG(valence)::float as avg_valence, AVG(arousal)::float as avg_arousal
       FROM diary_entries
       WHERE user_id = $1
       GROUP BY mood_id
       ORDER BY count DESC`,
      [userId]
    );
    return res.rows;
  }
}

// ---------------------------------------------------------------------------
// In-Memory Dev Database (Fallback when DATABASE_URL is not set)
// ---------------------------------------------------------------------------
class InMemoryDatabase implements IDatabase {
  private users: Map<string, UserRecord> = new Map();
  private entries: Map<string, DiaryEntryRecord> = new Map();

  async init(): Promise<void> {
    console.log("[DB] Using in-memory store (Set DATABASE_URL to connect PostgreSQL).");
  }

  async createUser(username: string, passwordHash: string, cryptoSalt: string): Promise<UserRecord> {
    const record: UserRecord = {
      id: crypto.randomUUID(),
      username,
      password_hash: passwordHash,
      crypto_salt: cryptoSalt,
      created_at: new Date(),
    };
    this.users.set(record.id, record);
    return record;
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  async createEntry(entry: Omit<DiaryEntryRecord, "id" | "created_at" | "updated_at">): Promise<DiaryEntryRecord> {
    const record: DiaryEntryRecord = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.entries.set(record.id, record);
    return record;
  }

  async getEntries(userId: string, limit = 50, offset = 0): Promise<DiaryEntryRecord[]> {
    const userEntries = Array.from(this.entries.values())
      .filter((e) => e.user_id === userId)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    return userEntries.slice(offset, offset + limit);
  }

  async getEntryByDate(userId: string, date: string): Promise<DiaryEntryRecord | null> {
    const match = Array.from(this.entries.values()).find(
      (e) => e.user_id === userId && e.entry_date === date
    );
    return match || null;
  }

  async deleteEntry(id: string, userId: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (entry && entry.user_id === userId) {
      return this.entries.delete(id);
    }
    return false;
  }

  async getStats(userId: string): Promise<{ mood_id: string; count: number; avg_valence: number; avg_arousal: number }[]> {
    const counts = new Map<string, { count: number; sumValence: number; sumArousal: number }>();
    for (const entry of this.entries.values()) {
      if (entry.user_id !== userId) continue;
      const current = counts.get(entry.mood_id) || { count: 0, sumValence: 0, sumArousal: 0 };
      current.count += 1;
      current.sumValence += entry.valence;
      current.sumArousal += entry.arousal;
      counts.set(entry.mood_id, current);
    }
    return Array.from(counts.entries()).map(([mood_id, data]) => ({
      mood_id,
      count: data.count,
      avg_valence: data.sumValence / data.count,
      avg_arousal: data.sumArousal / data.count,
    }));
  }
}

export const db: IDatabase = config.databaseUrl
  ? new PostgresDatabase(config.databaseUrl)
  : new InMemoryDatabase();
