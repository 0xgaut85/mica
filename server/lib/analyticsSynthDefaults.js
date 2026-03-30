import { PLAN_PRICES } from './planPrices.js'

/**
 * Public synthetic floors for dashboard + worker.
 * Seat story: Basic 400 + Premium 81 (+ Enterprise from DB). Account count: dashboard_users (211).
 * API keys published = round(1.5 × dashboard users).
 */
export const MVM_CREATED_CAP = 100

/** First calendar day of seeded `analytics_revenue_daily` (UTC); dashboard uses max(anchor, rolling 90d). */
export const REVENUE_DAILY_SERIES_START = '2026-03-30'

/** Published “accounts” count (distinct from paid seat totals). */
export const PUBLIC_DASHBOARD_USERS_SEED = 211

/** API key count = 1.5× user count (rounded). */
export function apiKeysForUsers(userCount) {
  const u = Math.max(0, Math.round(Number(userCount) || 0))
  return Math.round(u * 1.5)
}

export const PUBLIC_SYNTH_DEFAULTS = {
  mvm_created: 14,
  mvm_running: 11,
  cumulative_kwh_shifted: 2_180_000,
  dashboard_users: PUBLIC_DASHBOARD_USERS_SEED,
  subs_basic_public: 400,
  subs_premium_public: 81,
  api_keys_public: apiKeysForUsers(PUBLIC_DASHBOARD_USERS_SEED),
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
  const corruptUsers = rawUsers > SYNTH_USERS_CORRUPT_THRESHOLD
  const corruptSubs =
    rawB > SYNTH_SUBS_BASIC_CORRUPT_THRESHOLD ||
    rawP > SYNTH_SUBS_PREMIUM_CORRUPT_THRESHOLD
  const corrupt = corruptUsers || corruptSubs
  const usersBase = corruptUsers ? d.dashboard_users : rawUsers
  const keysBase = corrupt ? d.api_keys_public : rawKeys
  const subsBBase = corruptSubs ? d.subs_basic_public : rawB
  const subsPBase = corruptSubs ? d.subs_premium_public : rawP
  const dashboardUsers = Math.max(usersBase, d.dashboard_users)
  return {
    mvm_created: created,
    mvm_running: running,
    cumulative_kwh_shifted:
      Number(row.cumulative_kwh_shifted) || d.cumulative_kwh_shifted,
    dashboard_users: dashboardUsers,
    subs_basic_public: Math.max(subsBBase, d.subs_basic_public),
    subs_premium_public: Math.max(subsPBase, d.subs_premium_public),
    api_keys_public: Math.max(keysBase, d.api_keys_public, apiKeysForUsers(dashboardUsers)),
  }
}
