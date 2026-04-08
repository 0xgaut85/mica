import { PLAN_PRICES } from './planPrices.js'

/** Blended processing + platform take on subscription MMR (no per-invoice data). */
export const NET_REVENUE_FRACTION = 0.88

export function mmrFromPlanCounts(byPlan) {
  const basic = byPlan.basic ?? 0
  const premium = byPlan.premium ?? 0
  const enterprise = byPlan.enterprise ?? 0
  return basic * (PLAN_PRICES.basic ?? 0)
       + premium * (PLAN_PRICES.premium ?? 0)
       + enterprise * (PLAN_PRICES.enterprise ?? 0)
}

export function netFromGrossMmr(gross) {
  return Math.round(Number(gross) * NET_REVENUE_FRACTION * 100) / 100
}

function dayKeyHash(dayKey) {
  let h = 0
  const s = String(dayKey ?? '')
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 10001) / 10000
}

/** Net MMR with a small deterministic day-based band so gross vs net series are not a fixed ratio line. */
export function netFromGrossMmrWiggled(gross, dayKey) {
  const w = dayKeyHash(dayKey)
  const frac = NET_REVENUE_FRACTION - 0.04 + w * 0.08
  return Math.round(Number(gross) * frac * 100) / 100
}

export async function fetchActivePlanCounts(pool) {
  const { rows } = await pool.query(
    `SELECT plan, COUNT(*)::int AS n
     FROM subscriptions
     WHERE valid_until > NOW()
     GROUP BY plan`,
  )
  const byPlan = { basic: 0, premium: 0, enterprise: 0 }
  for (const r of rows) {
    if (Object.prototype.hasOwnProperty.call(byPlan, r.plan)) {
      byPlan[r.plan] = r.n
    }
  }
  return byPlan
}

/**
 * Dashboard / worker: MMR = Σ (seats × tier price). Public synthetic floors keep metrics non-zero until real subs dominate.
 */
export function mergePublicSubscriptionCounts(realByPlan, synthRow) {
  const sb = Number(synthRow?.subs_basic_public)
  const sp = Number(synthRow?.subs_premium_public)
  const se = Number(synthRow?.subs_enterprise_public)
  const floorB = Number.isFinite(sb) && sb >= 0 ? sb : 0
  const floorP = Number.isFinite(sp) && sp >= 0 ? sp : 0
  const floorE = Number.isFinite(se) && se >= 0 ? se : 0
  return {
    basic: Math.max(realByPlan.basic ?? 0, floorB),
    premium: Math.max(realByPlan.premium ?? 0, floorP),
    enterprise: Math.max(realByPlan.enterprise ?? 0, floorE),
  }
}

/**
 * Public dashboard story: Basic, Premium, and Enterprise from normalized synthetic row (worker-maintained).
 * `realByPlan` is unused for display but kept for call-site symmetry with registered counts.
 */
export function publicStoryByPlan(_realByPlan, synthState) {
  return {
    basic: synthState.subs_basic_public,
    premium: synthState.subs_premium_public,
    enterprise: synthState.subs_enterprise_public,
  }
}
