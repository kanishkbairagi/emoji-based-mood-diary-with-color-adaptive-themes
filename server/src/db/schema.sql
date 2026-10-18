-- ==============================================================================
-- Schema: Affective Health & Zero-Knowledge Encrypted Mood Vault
-- Designed for PostgreSQL 14+
-- ==============================================================================

-- Enable UUID generation extension if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: Users
-- Stores authentication credentials and the PBKDF2 salt used for client-side key derivation.
-- The server never receives or stores the client's master encryption key.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    crypto_salt VARCHAR(64) NOT NULL, -- Hex-encoded 32-byte salt for client PBKDF2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Diary Entries (Zero-Knowledge Encrypted Vault)
-- Encrypted payload contains journal reflection text.
-- Metadata (mood, circumplex coordinates) enables analytics without compromising journal privacy.
CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_id VARCHAR(32) NOT NULL,
    mood_label VARCHAR(64) NOT NULL,
    valence NUMERIC(3, 2) DEFAULT 0.00,  -- Continuous Valence: -1.00 (Displeasure) to +1.00 (Pleasure)
    arousal NUMERIC(3, 2) DEFAULT 0.00,  -- Continuous Arousal: -1.00 (Low Energy) to +1.00 (High Energy)
    encrypted_data TEXT NOT NULL,         -- Base64 ciphertext of journal text encrypted via AES-256-GCM
    iv VARCHAR(64) NOT NULL,               -- 12-byte initialization vector (Base64)
    auth_tag VARCHAR(64) NOT NULL,         -- GCM authentication tag for tamper detection
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Performance & Systems Query Optimization Indexes
-- ==============================================================================

-- Chronological composite index for paginated journal history & timeline lookups
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date 
    ON diary_entries (user_id, entry_date DESC, created_at DESC);

-- Mood distribution index for privacy-preserving affective analytics
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_mood 
    ON diary_entries (user_id, mood_id);

-- Date lookup index for calendar view
CREATE INDEX IF NOT EXISTS idx_diary_entries_date 
    ON diary_entries (user_id, entry_date);
