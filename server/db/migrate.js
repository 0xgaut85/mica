import 'dotenv/config'
import pool from './pool.js'

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  chain TEXT NOT NULL DEFAULT 'EVM',
  name TEXT,
  avatar_url TEXT,
  x_handle TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
  valid_until TIMESTAMPTZ NOT NULL,
  payment_tx TEXT,
  asset TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sub_wallet ON subscriptions(wallet_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_payment_tx ON subscriptions(payment_tx) WHERE payment_tx IS NOT NULL;

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address),
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_apikey_wallet ON api_keys(wallet_address);
`

async function migrate() {
  console.log('Running migrations...')
  await pool.query(SQL)
  console.log('Migrations complete.')
  await pool.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
