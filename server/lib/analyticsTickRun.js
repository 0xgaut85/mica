import {
  mergePublicSubscriptionCounts,
  mmrFromPlanCounts,
  netFromGrossMmrWiggled,
} from './analyticsRevenue.js'
import {
  growthProgressMs,
  seatsForTargetMmr,
  stepTowardInt,
  targetMmrUsd,
  tickIntervalMs,
  ticksRemainingApprox,
} from './analyticsSynthGrowth.js'
import { MVM_CREATED_CAP, PUBLIC_SYNTH_DEFAULTS } from './analyticsSynthDefaults.js'

function randomChance(p) {
  return Math.random() < p
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

const d = PUBLIC_SYNTH_DEFAULTS
const KWH_BASE = d.cumulative_kwh_shifted
const MMR_BASE = 14000

/**
 * Single analytics tick inside an open transaction (caller owns BEGIN/COMMIT).
 * Drives public MMR from synth_mmr_floor_usd → synth_mmr_ceiling_usd over synth_growth_days,
 * with users, API keys, MVM, and kWh scaled to the same trajectory (then micro jitter).
 *
 * @param {import('pg').PoolClient} client
 */
export async function runAnalyticsTickOnce(client) {
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
    `UPDATE analytics_synthetic_state
     SET synth_growth_start_at = COALESCE(synth_growth_start_at, now())
     WHERE id = 1`,
  )

  const { rows: stRows } = await client.query(
    `SELECT mvm_created, mvm_running, cumulative_kwh_shifted, dashboard_users,
            subs_basic_public, subs_premium_public, api_keys_public,
            synth_mmr_floor_usd, synth_mmr_ceiling_usd, synth_growth_days, synth_growth_start_at
     FROM analytics_synthetic_state WHERE id = 1 FOR UPDATE`,
  )
  const st = stRows[0]
  if (!st) {
    throw new Error('analytics_synthetic_state row missing after insert')
  }

  const mmrFloor = Number(st.synth_mmr_floor_usd) || MMR_BASE
  const mmrCeil = Number(st.synth_mmr_ceiling_usd) || 110000
  const growthDays = Number(st.synth_growth_days) || 15
  const growthStart = st.synth_growth_start_at

  const nowMs = Date.now()
  const progress = growthProgressMs(growthStart, growthDays, nowMs)
  const ticksLeft = ticksRemainingApprox(growthStart, growthDays, nowMs)

  let targetMmr = targetMmrUsd(mmrFloor, mmrCeil, progress)
  if (progress < 1 && randomChance(0.12)) {
    targetMmr += (Math.random() - 0.5) * 180
    targetMmr = clamp(targetMmr, mmrFloor, mmrCeil)
  }

  const seatTargets = seatsForTargetMmr(targetMmr)
  const userTarget = Math.round(d.dashboard_users * (targetMmr / MMR_BASE))
  const keysTarget = Math.round(d.api_keys_public * (targetMmr / MMR_BASE))
  const kwhTarget = KWH_BASE * (targetMmr / MMR_BASE)
  const mvmTargetCreated = Math.round(
    d.mvm_created + progress * (MVM_CREATED_CAP - d.mvm_created),
  )
  const runFrac = clamp(0.74 + Math.random() * 0.1, 0.65, 0.92)
  const mvmTargetRunning = Math.min(
    mvmTargetCreated,
    Math.round(mvmTargetCreated * runFrac),
  )

  let mvmCreated = Number(st.mvm_created) || d.mvm_created
  let mvmRunning = Number(st.mvm_running) || d.mvm_running
  let kwh = Number(st.cumulative_kwh_shifted) || KWH_BASE
  let dashboardUsers = Number(st.dashboard_users) || d.dashboard_users
  let subsBasicPublic = Number(st.subs_basic_public) || d.subs_basic_public
  let subsPremiumPublic = Number(st.subs_premium_public) || d.subs_premium_public
  let apiKeysPublic = Number(st.api_keys_public) || d.api_keys_public

  subsBasicPublic = Math.max(subsBasicPublic, d.subs_basic_public)
  subsPremiumPublic = Math.max(subsPremiumPublic, d.subs_premium_public)
  apiKeysPublic = Math.max(apiKeysPublic, d.api_keys_public)
  dashboardUsers = Math.max(dashboardUsers, d.dashboard_users)

  subsBasicPublic = stepTowardInt(subsBasicPublic, seatTargets.basic, ticksLeft)
  subsPremiumPublic = stepTowardInt(subsPremiumPublic, seatTargets.premium, ticksLeft)
  dashboardUsers = stepTowardInt(dashboardUsers, userTarget, ticksLeft)
  apiKeysPublic = stepTowardInt(apiKeysPublic, keysTarget, ticksLeft)
  mvmCreated = clamp(
    stepTowardInt(mvmCreated, mvmTargetCreated, ticksLeft),
    0,
    MVM_CREATED_CAP,
  )
  mvmRunning = clamp(
    stepTowardInt(mvmRunning, mvmTargetRunning, ticksLeft),
    0,
    mvmCreated,
  )

  const kwhStep = Math.max(500, Math.abs(kwhTarget - kwh) / ticksLeft)
  if (kwh < kwhTarget) {
    kwh = Math.min(kwhTarget, kwh + kwhStep + Math.random() * 400)
  } else if (kwh > kwhTarget + 2000) {
    kwh = Math.max(kwhTarget, kwh - kwhStep * 0.5)
  } else if (randomChance(0.42)) {
    kwh += 12 + Math.floor(Math.random() * 48)
  }

  if (progress >= 1) {
    if (randomChance(0.006) && dashboardUsers < 2_000_000) dashboardUsers += 1
    if (randomChance(0.005) && apiKeysPublic < 2_000_000) apiKeysPublic += 1
    if (randomChance(0.004) && subsBasicPublic < 500_000) subsBasicPublic += 1
    if (randomChance(0.003) && subsPremiumPublic < 200_000) subsPremiumPublic += 1
  }

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
  const merged = mergePublicSubscriptionCounts(byPlan, {
    subs_basic_public: subsBasicPublic,
    subs_premium_public: subsPremiumPublic,
  })
  const gross = mmrFromPlanCounts(merged)

  const { rows: dayRows } = await client.query(`SELECT CURRENT_DATE::text AS day`)
  const dayKey = dayRows[0]?.day ?? ''
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

  return {
    dashboardUsers,
    apiKeysPublic,
    mvmRunning,
    mvmCreated,
    kwh: Math.round(kwh),
    gross,
    subsBasicPublic,
    subsPremiumPublic,
    progress,
    targetMmr,
    tickIntervalMs: tickIntervalMs(),
  }
}
