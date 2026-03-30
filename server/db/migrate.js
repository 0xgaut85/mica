import 'dotenv/config'
import pool from './pool.js'
import { NET_REVENUE_FRACTION } from '../lib/analyticsRevenue.js'
import {
  PUBLIC_SYNTH_DEFAULTS,
  REVENUE_DAILY_SERIES_START,
} from '../lib/analyticsSynthDefaults.js'

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
  mvm_running INT NOT NULL DEFAULT 11,
  cumulative_kwh_shifted DOUBLE PRECISION NOT NULL DEFAULT 2180000,
  dashboard_users INT NOT NULL DEFAULT 221,
  subs_basic_public INT NOT NULL DEFAULT 200,
  subs_premium_public INT NOT NULL DEFAULT 40,
  api_keys_public INT NOT NULL DEFAULT 59,
  synth_mmr_floor_usd NUMERIC(14,2) NOT NULL DEFAULT 14000,
  synth_mmr_ceiling_usd NUMERIC(14,2) NOT NULL DEFAULT 110000,
  synth_growth_days INT NOT NULL DEFAULT 15,
  synth_growth_start_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS synth_mmr_floor_usd NUMERIC(14,2) NOT NULL DEFAULT 14000;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS synth_mmr_ceiling_usd NUMERIC(14,2) NOT NULL DEFAULT 110000;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS synth_growth_days INT NOT NULL DEFAULT 15;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS synth_growth_start_at TIMESTAMPTZ;

ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS dashboard_users INT NOT NULL DEFAULT 221;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS subs_basic_public INT NOT NULL DEFAULT 200;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS subs_premium_public INT NOT NULL DEFAULT 40;
ALTER TABLE analytics_synthetic_state
  ADD COLUMN IF NOT EXISTS api_keys_public INT NOT NULL DEFAULT 59;

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
  const d = PUBLIC_SYNTH_DEFAULTS
  await client.query(
    `INSERT INTO analytics_synthetic_state (
       id, mvm_created, mvm_running, cumulative_kwh_shifted, dashboard_users,
       subs_basic_public, subs_premium_public, api_keys_public
     )
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [
      d.mvm_created,
      d.mvm_running,
      d.cumulative_kwh_shifted,
      d.dashboard_users,
      d.subs_basic_public,
      d.subs_premium_public,
      d.api_keys_public,
    ],
  )
  await client.query(
    `UPDATE analytics_synthetic_state SET
       subs_basic_public = GREATEST(subs_basic_public, $1),
       subs_premium_public = GREATEST(subs_premium_public, $2),
       api_keys_public = GREATEST(api_keys_public, $3),
       dashboard_users = GREATEST(dashboard_users, $4),
       cumulative_kwh_shifted = GREATEST(cumulative_kwh_shifted, $5)
     WHERE id = 1`,
    [
      d.subs_basic_public,
      d.subs_premium_public,
      d.api_keys_public,
      d.dashboard_users,
      d.cumulative_kwh_shifted,
    ],
  )
  await client.query(
    `UPDATE analytics_synthetic_state SET
       dashboard_users = $1,
       api_keys_public = $2,
       synth_growth_start_at = $3::timestamptz
     WHERE id = 1 AND dashboard_users > 2200`,
    [d.dashboard_users, d.api_keys_public, `${REVENUE_DAILY_SERIES_START}T00:00:00Z`],
  )
  await client.query(
    `UPDATE analytics_synthetic_state SET
       mvm_created = 14,
       mvm_running = 11
     WHERE id = 1 AND mvm_created = 92 AND mvm_running = 60`,
  )
  await client.query(
    `UPDATE analytics_synthetic_state SET mvm_created = LEAST(mvm_created, 100) WHERE id = 1`,
  )
  await client.query(
    `UPDATE analytics_synthetic_state SET mvm_running = LEAST(mvm_running, mvm_created) WHERE id = 1`,
  )

  await client.query(
    `UPDATE analytics_synthetic_state SET
       synth_growth_start_at = COALESCE(synth_growth_start_at, now()),
       synth_mmr_floor_usd = COALESCE(NULLIF(synth_mmr_floor_usd, 0), 14000),
       synth_mmr_ceiling_usd = COALESCE(NULLIF(synth_mmr_ceiling_usd, 0), 110000),
       synth_growth_days = CASE WHEN synth_growth_days < 1 THEN 15 ELSE synth_growth_days END
     WHERE id = 1`,
  )

  const regions = [
    ['AT', 'Austria', '0.2400', 'https://spot.utilitarian.io/'],
    ['DE', 'Germany (DE_LU bidding zone)', '0.3300', 'https://spot.utilitarian.io/'],
    ['ES', 'Spain', '0.1800', 'https://spot.utilitarian.io/'],
    [
      'EU',
      'EU household retail proxy (comparison; not wholesale spot)',
      '0.2900',
      'https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Electricity_price_statistics',
    ],
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

  await client.query(
    `UPDATE analytics_electricity_reference
     SET label = $2, usd_per_kwh = $3, source_url = $4, updated_at = now()
     WHERE region_code = $1`,
    [
      'EU',
      'EU household retail proxy (comparison; not wholesale spot)',
      '0.2900',
      'https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Electricity_price_statistics',
    ],
  )

  const { rows: maxRow } = await client.query(
    `SELECT COALESCE(MAX(gross_usd), 0)::numeric AS m FROM analytics_revenue_daily`,
  )
  const { rows: minDayRow } = await client.query(`SELECT MIN(day) AS d FROM analytics_revenue_daily`)
  const maxGross = Number(maxRow[0]?.m) || 0
  const rawMin = minDayRow[0]?.d
  const minDayStr =
    rawMin == null
      ? null
      : typeof rawMin === 'string'
        ? rawMin.slice(0, 10)
        : rawMin instanceof Date
          ? rawMin.toISOString().slice(0, 10)
          : String(rawMin).slice(0, 10)
  /** Reseed when empty or first row is not the configured anchor (e.g. 2026-01-01). */
  const needsRevenueReseed = !minDayStr || minDayStr !== REVENUE_DAILY_SERIES_START
  if (!needsRevenueReseed && maxGross > 0 && maxGross >= 13500) return

  await client.query(`DELETE FROM analytics_revenue_daily`)

  const startMs = Date.parse(`${REVENUE_DAILY_SERIES_START}T00:00:00.000Z`)
  const grossStart = 3200
  const grossEnd = 14000
  for (let i = 0; i < 90; i += 1) {
    const dayDate = new Date(startMs + i * 86400000)
    const dayStr = dayDate.toISOString().slice(0, 10)
    const t = i / 89
    const gross =
      Math.round((grossStart + t * (grossEnd - grossStart) + Math.sin(t * Math.PI * 6) * 48) * 100) / 100
    const baseNet = gross * NET_REVENUE_FRACTION
    const netWiggle =
      Math.round((baseNet - 26 + Math.sin(t * Math.PI * 4 + 0.9) * 34) * 100) / 100
    const net = Math.min(netWiggle, gross - 55)
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
