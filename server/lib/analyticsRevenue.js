import { PLAN_PRICES } from './planPrices.js'

/** Blended processing + platform take on subscription MMR (no per-invoice data). */
export const NET_REVENUE_FRACTION = 0.88

export function mmrFromPlanCounts(byPlan) {
  const basic = byPlan.basic ?? 0
  const premium = byPlan.premium ?? 0
  return basic * (PLAN_PRICES.basic ?? 0) + premium * (PLAN_PRICES.premium ?? 0)
}

export function netFromGrossMmr(gross) {
  return Math.round(Number(gross) * NET_REVENUE_FRACTION * 100) / 100
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
