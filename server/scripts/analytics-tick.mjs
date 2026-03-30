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
 * - Organic bumps: public user floor, MVM counters, cumulative kWh (bounded; running <= created).
 */

import 'dotenv/config'
import pool from '../db/pool.js'
import {
  mergePublicSubscriptionCounts,
  mmrFromPlanCounts,
  netFromGrossMmrWiggled,
} from '../lib/analyticsRevenue.js'

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
      `INSERT INTO analytics_synthetic_state (
         id, mvm_created, mvm_running, cumulative_kwh_shifted, dashboard_users,
         subs_basic_public, subs_premium_public, api_keys_public
       )
       VALUES (1, 92, 60, 218000, 95, 52, 28, 48)
       ON CONFLICT (id) DO NOTHING`,
    )

    const { rows: stRows } = await client.query(
      `SELECT mvm_created, mvm_running, cumulative_kwh_shifted, dashboard_users,
              subs_basic_public, subs_premium_public, api_keys_public
       FROM analytics_synthetic_state WHERE id = 1 FOR UPDATE`,
    )
    let mvmCreated = stRows[0]?.mvm_created ?? 92
    let mvmRunning = stRows[0]?.mvm_running ?? 60
    let kwh = Number(stRows[0]?.cumulative_kwh_shifted) ?? 218000
    let dashboardUsers = stRows[0]?.dashboard_users ?? 95
    if (!Number.isFinite(dashboardUsers)) dashboardUsers = 95
    let subsBasicPublic = Number(stRows[0]?.subs_basic_public)
    let subsPremiumPublic = Number(stRows[0]?.subs_premium_public)
    let apiKeysPublic = Number(stRows[0]?.api_keys_public)
    if (!Number.isFinite(subsBasicPublic)) subsBasicPublic = 52
    if (!Number.isFinite(subsPremiumPublic)) subsPremiumPublic = 28
    if (!Number.isFinite(apiKeysPublic)) apiKeysPublic = 48

    if (randomChance(0.14) && dashboardUsers < 500_000) dashboardUsers += 1
    if (randomChance(0.02) && dashboardUsers < 500_000) dashboardUsers += 1

    if (randomChance(0.09) && mvmCreated < 25_000) mvmCreated += 1
    if (randomChance(0.11) && mvmRunning < mvmCreated) mvmRunning += 1
    if (randomChance(0.045) && mvmRunning > 0) mvmRunning -= 1
    mvmRunning = clamp(mvmRunning, 0, mvmCreated)

    if (randomChance(0.48)) {
      kwh += 12 + Math.floor(Math.random() * 52)
    }
    if (randomChance(0.12)) {
      kwh += 20 + Math.floor(Math.random() * 80)
    }

    if (randomChance(0.1) && subsBasicPublic < 200_000) subsBasicPublic += 1
    if (randomChance(0.06) && subsPremiumPublic < 80_000) subsPremiumPublic += 1
    if (randomChance(0.12) && apiKeysPublic < 500_000) apiKeysPublic += 1

    await client.query(
      `UPDATE analytics_synthetic_state
       SET mvm_created = $1, mvm_running = $2, cumulative_kwh_shifted = $3, dashboard_users = $4,
           subs_basic_public = $5, subs_premium_public = $6, api_keys_public = $7, updated_at = now()
       WHERE id = 1`,
      [
        mvmCreated,
        mvmRunning,
        kwh,
        dashboardUsers,
        subsBasicPublic,
        subsPremiumPublic,
        apiKeysPublic,
      ],
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
    const synthRow = {
      subs_basic_public: subsBasicPublic,
      subs_premium_public: subsPremiumPublic,
    }
    const merged = mergePublicSubscriptionCounts(byPlan, synthRow)
    const gross = mmrFromPlanCounts(merged)

    const { rows: dayRows } = await client.query(`SELECT CURRENT_DATE::text AS d`)
    const dayKey = dayRows[0]?.d ?? ''
    const net = netFromGrossMmrWiggled(gross, dayKey)

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
      `analytics-tick: ok users~${dashboardUsers} keys~${apiKeysPublic} mvm ${mvmRunning}/${mvmCreated} kwh~${Math.round(
        kwh,
      )} mmr_gross=${gross} subs_pub ${subsBasicPublic}/${subsPremiumPublic}`,
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
