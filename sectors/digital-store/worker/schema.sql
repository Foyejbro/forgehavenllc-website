PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', total INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'usd', items TEXT NOT NULL, policy_version TEXT NOT NULL, accepted_at TEXT NOT NULL, stripe_session TEXT UNIQUE, payment_reference TEXT, received_reference TEXT, relay_url TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id), type TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS events_order ON events(order_id);
CREATE TABLE IF NOT EXISTS reviews(order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL, product_title TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), display_name TEXT NOT NULL, text TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY(order_id,product_id));
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
-- This column is part of the initial schema; do not execute the initialization twice.
