/**
 * Analytics organic growth + daily revenue sync.
 *
 * Schedule (production): run every 1h via cron or systemd timer, e.g.
 *   0 * * * * cd /path/to/server && node scripts/analytics-tick.mjs
 * Or PM2 with cron_restart / a separate worker process.
 *
 * Env: DATABASE_URL (see server/db/pool.js; SSL auto for Railway URLs).
 *
 * Behavior:
 * - Upserts today's analytics_revenue_daily from live subscription MMR (gross) and
 *   net = gross * NET_REVENUE_FRACTION (see server/lib/analyticsRevenue.js).
 * - Occasionally increments MVM counters and cumulative kWh (bounded; running <= created).
 */

import 'dotenv/config'
import pool from '../db/pool.js'
import { NET_REVENUE_FRACTION, mmrFromPlanCounts } from '../lib/analyticsRevenue.js'

function randomChance(p) {
  return Math.random() < p
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('analytics-tick: DATABASE_URL is not set')
    process.exit(1)
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO analytics_synthetic_state (id, mvm_created, mvm_running, cumulative_kwh_shifted)
       VALUES (1, 14, 7, 42000)
       ON CONFLICT (id) DO NOTHING`,
    )

    const { rows: stRows } = await client.query(
      `SELECT mvm_created, mvm_running, cumulative_kwh_shifted
       FROM analytics_synthetic_state WHERE id = 1 FOR UPDATE`,
    )
    let mvmCreated = stRows[0]?.mvm_created ?? 14
    let mvmRunning = stRows[0]?.mvm_running ?? 7
    let kwh = Number(stRows[0]?.cumulative_kwh_shifted) ?? 42000

    if (randomChance(0.06) && mvmCreated < 10_000) mvmCreated += 1
    if (randomChance(0.08) && mvmRunning < mvmCreated) mvmRunning += 1
    if (randomChance(0.04) && mvmRunning > 0) mvmRunning -= 1
    mvmRunning = clamp(mvmRunning, 0, mvmCreated)

    if (randomChance(0.35)) {
      kwh += 8 + Math.floor(Math.random() * 24)
    }

    await client.query(
      `UPDATE analytics_synthetic_state
       SET mvm_created = $1, mvm_running = $2, cumulative_kwh_shifted = $3, updated_at = now()
       WHERE id = 1`,
      [mvmCreated, mvmRunning, kwh],
    )

    const { rows: planRows } = await client.query(
      `SELECT plan, COUNT(*)::int AS n
       FROM subscriptions
       WHERE valid_until > NOW()
       GROUP BY plan`,
    )
    const byPlan = { basic: 0, premium: 0, enterprise: 0 }
    for (const r of planRows) {
      if (Object.prototype.hasOwnProperty.call(byPlan, r.plan)) {
        byPlan[r.plan] = r.n
      }
    }
    const gross = mmrFromPlanCounts(byPlan)
    const net = Math.round(gross * NET_REVENUE_FRACTION * 100) / 100

    await client.query(
      `INSERT INTO analytics_revenue_daily (day, gross_usd, net_usd, notes)
       VALUES (CURRENT_DATE, $1, $2, 'tick')
       ON CONFLICT (day) DO UPDATE SET
         gross_usd = EXCLUDED.gross_usd,
         net_usd = EXCLUDED.net_usd,
         notes = 'tick'`,
      [gross, net],
    )

    await client.query('COMMIT')
    console.log(
      `analytics-tick: ok mvm ${mvmRunning}/${mvmCreated} kwh~${Math.round(kwh)} mmr_gross=${gross}`,
    )
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('analytics-tick:', e)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
