import { PLAN_PRICES } from './planPrices.js'
import {
  PUBLIC_ENTERPRISE_SEATS_FLOOR,
  PUBLIC_ENTERPRISE_SEAT_SHARE,
} from './analyticsSynthDefaults.js'

/** Linear trajectory MMR (USD) from floor to ceiling over growth window. */
export function growthProgressMs(startAt, growthDays, nowMs = Date.now()) {
  if (!startAt || !Number.isFinite(growthDays) || growthDays <= 0) return 1
  const t0 = new Date(startAt).getTime()
  if (!Number.isFinite(t0)) return 1
  const span = growthDays * 86400000
  return Math.min(1, Math.max(0, (nowMs - t0) / span))
}

export function targetMmrUsd(floorUsd, ceilingUsd, progress) {
  const lo = Number(floorUsd) || 0
  const hi = Number(ceilingUsd) || lo
  const p = Math.min(1, Math.max(0, progress))
  return lo + p * (hi - lo)
}

/**
 * Seat split for a target MMR: ~90% from enterprise, remainder from basic/premium.
 * Returns { basic, premium, enterprise }.
 */
export function seatsForTargetMmr(targetUsd) {
  const pb = PLAN_PRICES.basic ?? 40
  const pp = PLAN_PRICES.premium ?? 150
  const pe = PLAN_PRICES.enterprise ?? 6200
  const t = Math.max(0, Number(targetUsd) || 0)

  const enterpriseBudget = t * 0.9
  const enterprise = Math.max(
    PUBLIC_ENTERPRISE_SEATS_FLOOR,
    Math.round(enterpriseBudget / pe),
  )

  const remainder = Math.max(0, t - enterprise * pe)
  const premium = Math.max(0, Math.round((remainder * 0.35) / pp))
  const basic = Math.max(0, Math.round((remainder - premium * pp) / pb))

  return { basic, premium, enterprise }
}

/**
 * Enterprise seat target so enterprise revenue ≈ 90% of total MMR.
 * Respects a floor (e.g. 4).
 */
export function enterpriseSeatsTargetForMix(basic, premium) {
  const pb = PLAN_PRICES.basic ?? 40
  const pp = PLAN_PRICES.premium ?? 150
  const pe = PLAN_PRICES.enterprise ?? 6200
  const b = Math.max(0, Math.round(Number(basic) || 0))
  const p = Math.max(0, Math.round(Number(premium) || 0))
  const bpRevenue = b * pb + p * pp
  const targetEntRevenue = bpRevenue * 9
  const target = Math.round(targetEntRevenue / pe)
  return Math.max(PUBLIC_ENTERPRISE_SEATS_FLOOR, target)
}

/**
 * Move current toward target in at most ceil(|diff|/ticksLeft) per step (credible crawl).
 */
export function stepTowardInt(current, target, ticksLeft) {
  const c = Math.round(Number(current) || 0)
  const t = Math.round(Number(target) || 0)
  if (c === t) return c
  const diff = t - c
  const tl = Math.max(1, Math.round(ticksLeft))
  const step = Math.min(Math.abs(diff), Math.max(1, Math.ceil(Math.abs(diff) / tl)))
  return c + Math.sign(diff) * step
}

export function tickIntervalMs() {
  const raw = Number(process.env.ANALYTICS_TICK_INTERVAL_MS)
  if (Number.isFinite(raw) && raw >= 15000) return raw
  return 60000
}

export function ticksRemainingApprox(growthStartAt, growthDays, nowMs = Date.now()) {
  const t0 = new Date(growthStartAt).getTime()
  const iv = tickIntervalMs()
  if (!Number.isFinite(t0)) return Math.max(240, Math.ceil((86400000 * 2) / iv))
  const end = t0 + growthDays * 86400000
  const msLeft = end - nowMs
  if (msLeft <= 0) {
    /** Post-growth plateau: spread micro-moves over several days of ticks. */
    return Math.max(180, Math.ceil((86400000 * 5) / iv))
  }
  return Math.max(1, Math.ceil(msLeft / iv))
}
