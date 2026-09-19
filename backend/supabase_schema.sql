-- ============================================================
-- PRAXIS — Supabase / PostgreSQL Database Schema
-- Events, Registrations, and Razorpay Payments
-- ============================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    registration_open BOOLEAN NOT NULL DEFAULT true,
    capacity INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial event prices & configurations
INSERT INTO events (slug, title, description, price, currency, registration_open)
VALUES
    ('infinity-trials', 'Infinity Trials', 'Face a cosmic challenge where strategy, speed, and teamwork decide who is worthy of the stones.', 99.00, 'INR', true),
    ('research-x', 'Research X', 'Channel thunderous ideas into a sharp research showcase built around insight, evidence, and impact.', 149.00, 'INR', true),
    ('bgmi-elite-showdown', 'BGMI Elite Showdown', 'Enter the battleground with disciplined teamwork, tactical precision, and the resolve to hold the line.', 199.00, 'INR', true),
    ('tech-roulette', 'Tech Roulette', 'A three-round technical showdown combining sustainability knowledge, rapid prototyping, and high-pressure solution pitching.', 49.00, 'INR', true),
    ('storyverse', 'StoryVerse', 'Transform an AI-generated story video into an interactive browser game across two connected creative rounds.', 79.00, 'INR', true)
ON CONFLICT (slug) DO UPDATE SET
    price = EXCLUDED.price,
    registration_open = EXCLUDED.registration_open,
    updated_at = NOW();

-- 2. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_code VARCHAR(32) UNIQUE NOT NULL, -- Non-sequential code e.g. PRX-8F3K21
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    college VARCHAR(255) NOT NULL,
    year VARCHAR(64) NOT NULL,
    branch VARCHAR(128) NOT NULL,
    team_name VARCHAR(255),
    team_size INTEGER DEFAULT 1,
    team_members JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to fast-check and enforce no duplicate confirmed registrations per email+event
CREATE INDEX IF NOT EXISTS idx_registrations_email_event ON registrations(email, event_slug);
CREATE INDEX IF NOT EXISTS idx_registrations_code ON registrations(registration_code);

-- 3. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    event_slug VARCHAR(100) NOT NULL,
    razorpay_order_id VARCHAR(128) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(128),
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'created', -- 'created' | 'pending' | 'paid' | 'failed' | 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_reg_id ON payments(registration_id);

-- RLS (Row Level Security) - read-only public or service role only
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow public read of open events
CREATE POLICY "Public events are viewable by everyone" ON events
    FOR SELECT USING (true);
