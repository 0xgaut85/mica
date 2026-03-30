import { PLAN_PRICES } from './planPrices.js'

/**
 * Public synthetic floors for dashboard + worker.
 * Published “active users” = basic + premium + enterprise seats (same as subscription card total).
 * API keys published = round(1.5 × that total).
 */
export const MVM_CREATED_CAP = 100

/** Growth window length (days) for floor → ceiling MMR and linked synth metrics. */
export const SYNTH_GROWTH_DAYS_DEFAULT = 14

/** MMR ceiling (USD) the worker approaches over the growth window. */
export const SYNTH_MMR_CEILING_USD_DEFAULT = 110_000

/** When created MVM reaches cap, target running ≈ this fraction (e.g. 0.9 → 90 running at 100 created). */
export const MVM_RUNNING_FRAC_OF_CREATED = 0.9

/**
 * First day shown on revenue charts (UTC): yesterday so gross/net series start “today” with a prior point.
 */
export function revenueChartQueryStartDateUtc(now = new Date()) {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** UTC calendar date string (YYYY-MM-DD) for `now`. */
export function utcDateString(now = new Date()) {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

const _SUBS_BASIC_FLOOR = 400
const _SUBS_PREMIUM_FLOOR = 81

/** Published enterprise seats (worker grows toward ~10% of total; basic+premium ~90%). */
export const PUBLIC_ENTERPRISE_SEATS_FLOOR = 4
/** Target share of total seats (basic + premium + enterprise). */
export const PUBLIC_ENTERPRISE_SEAT_SHARE = 0.1

/** API key count = 1.5× active seat total (rounded). */
export function apiKeysForUsers(userCount) {
  const u = Math.max(0, Math.round(Number(userCount) || 0))
  return Math.round(u * 1.5)
}

const _SEAT_TOTAL_FLOOR =
  _SUBS_BASIC_FLOOR + _SUBS_PREMIUM_FLOOR + PUBLIC_ENTERPRISE_SEATS_FLOOR

export const PUBLIC_SYNTH_DEFAULTS = {
  mvm_created: 14,
  mvm_running: 11,
  cumulative_kwh_shifted: 2_180_000,
  subs_basic_public: _SUBS_BASIC_FLOOR,
  subs_premium_public: _SUBS_PREMIUM_FLOOR,
  subs_enterprise_public: PUBLIC_ENTERPRISE_SEATS_FLOOR,
  /** Stored row = basic + premium + synthetic enterprise. */
  dashboard_users: _SEAT_TOTAL_FLOOR,
  api_keys_public: apiKeysForUsers(_SEAT_TOTAL_FLOOR),
}

/** Tier MMR implied by public synthetic seat floors (stays in sync with PLAN_PRICES). */
export function publicSyntheticMmrUsd(row = PUBLIC_SYNTH_DEFAULTS) {
  const b = Number(row?.subs_basic_public) || 0
  const p = Number(row?.subs_premium_public) || 0
  const pb = PLAN_PRICES.basic ?? 40
  const pp = PLAN_PRICES.premium ?? 150
  return b * pb + p * pp
}

/** Above this, treat `dashboard_users` as legacy seed noise and snap to public defaults. */
const SYNTH_USERS_CORRUPT_THRESHOLD = 2200
/** Inflated test subscription rows in `analytics_synthetic_state` — snap seat floors to defaults. */
const SYNTH_SUBS_BASIC_CORRUPT_THRESHOLD = 2000
const SYNTH_SUBS_PREMIUM_CORRUPT_THRESHOLD = 500

export function normalizeSynthStateRow(row) {
  const d = PUBLIC_SYNTH_DEFAULTS
  if (!row) {
    return {
      ...d,
      mvm_running: Math.min(d.mvm_running, d.mvm_created),
    }
  }
  const created = Math.min(
    MVM_CREATED_CAP,
    Math.max(0, Number(row.mvm_created) || d.mvm_created),
  )
  let running = Math.max(0, Number(row.mvm_running) || d.mvm_running)
  running = Math.min(running, created)
  const rawUsers = Number(row.dashboard_users) || 0
  const rawKeys = Number(row.api_keys_public) || 0
  const rawB = Number(row.subs_basic_public) || 0
  const rawP = Number(row.subs_premium_public) || 0
  const rawE = Number(row.subs_enterprise_public)
  const rawEsafe = Number.isFinite(rawE) ? rawE : 0
  const corruptUsers = rawUsers > SYNTH_USERS_CORRUPT_THRESHOLD
  const corruptSubs =
    rawB > SYNTH_SUBS_BASIC_CORRUPT_THRESHOLD ||
    rawP > SYNTH_SUBS_PREMIUM_CORRUPT_THRESHOLD
  const corrupt = corruptUsers || corruptSubs
  const usersBase = corruptUsers ? d.dashboard_users : rawUsers
  const keysBase = corrupt ? d.api_keys_public : rawKeys
  const subsBBase = corruptSubs ? d.subs_basic_public : rawB
  const subsPBase = corruptSubs ? d.subs_premium_public : rawP
  const subsEBase = corruptSubs ? d.subs_enterprise_public : rawEsafe
  const sb = Math.max(subsBBase, d.subs_basic_public)
  const sp = Math.max(subsPBase, d.subs_premium_public)
  const se = Math.max(subsEBase, d.subs_enterprise_public)
  const seatFloor = sb + sp + se
  let dashboardUsers = Math.max(usersBase, d.dashboard_users, seatFloor)
  return {
    mvm_created: created,
    mvm_running: running,
    cumulative_kwh_shifted:
      Number(row.cumulative_kwh_shifted) || d.cumulative_kwh_shifted,
    dashboard_users: dashboardUsers,
    subs_basic_public: sb,
    subs_premium_public: sp,
    subs_enterprise_public: se,
    api_keys_public: Math.max(keysBase, d.api_keys_public, apiKeysForUsers(dashboardUsers)),
  }
}
