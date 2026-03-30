import 'dotenv/config'
import pool from './pool.js'
import { NET_REVENUE_FRACTION } from '../lib/analyticsRevenue.js'

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

CREATE TABLE IF NOT EXISTS analytics_synthetic_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mvm_created INT NOT NULL DEFAULT 14,
  mvm_running INT NOT NULL DEFAULT 7,
  cumulative_kwh_shifted DOUBLE PRECISION NOT NULL DEFAULT 42000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_revenue_daily (
  day DATE PRIMARY KEY,
  gross_usd NUMERIC(14,2) NOT NULL,
  net_usd NUMERIC(14,2) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS analytics_electricity_reference (
  region_code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  usd_per_kwh NUMERIC(10,4) NOT NULL,
  source_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

async function seedAnalyticsDefaults(client) {
  await client.query(
    `INSERT INTO analytics_synthetic_state (id, mvm_created, mvm_running, cumulative_kwh_shifted)
     VALUES (1, 14, 7, 42000)
     ON CONFLICT (id) DO NOTHING`,
  )

  const regions = [
    ['AT', 'Austria', '0.2400', 'https://spot.utilitarian.io/'],
    ['DE', 'Germany (DE_LU bidding zone)', '0.3300', 'https://spot.utilitarian.io/'],
    ['ES', 'Spain', '0.1800', 'https://spot.utilitarian.io/'],
    ['EU', 'EU blend (DE+FR+NL+PL day-ahead avg)', '0.2600', 'https://spot.utilitarian.io/'],
    ['FR', 'France', '0.2200', 'https://spot.utilitarian.io/'],
    ['JP', 'Japan (static reference)', '0.2200', 'https://www.iea.org/reports/japan'],
    ['NL', 'Netherlands', '0.2000', 'https://spot.utilitarian.io/'],
    ['NORDIC', 'Nordic blend (SE3+NO2+FI day-ahead avg)', '0.0950', 'https://spot.utilitarian.io/'],
    ['PL', 'Poland', '0.1900', 'https://spot.utilitarian.io/'],
    ['UK', 'United Kingdom (static reference)', '0.2800', 'https://www.gov.uk/guidance/energy-prices-and-bills'],
    ['US', 'United States (fallback retail proxy)', '0.1600', 'https://www.priceofelectricity.com/api/v1/states'],
  ]
  for (const [code, label, usd, url] of regions) {
    await client.query(
      `INSERT INTO analytics_electricity_reference (region_code, label, usd_per_kwh, source_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (region_code) DO NOTHING`,
      [code, label, usd, url],
    )
  }

  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS c FROM analytics_revenue_daily`,
  )
  if (rows[0].c > 0) return

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  for (let i = 89; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const t = (89 - i) / 89
    const gross = Math.round((650 + t * 520 + Math.sin(t * Math.PI * 4) * 45) * 100) / 100
    const net = Math.round(gross * NET_REVENUE_FRACTION * 100) / 100
    await client.query(
      `INSERT INTO analytics_revenue_daily (day, gross_usd, net_usd, notes)
       VALUES ($1::date, $2, $3, 'seed')`,
      [dayStr, gross, net],
    )
  }
}

async function migrate() {
  console.log('Running migrations...')
  await pool.query(SQL)
  const client = await pool.connect()
  try {
    await seedAnalyticsDefaults(client)
  } finally {
    client.release()
  }
  console.log('Migrations complete.')
  await pool.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
