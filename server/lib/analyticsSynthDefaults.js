/**
 * Public synthetic floors for dashboard + worker.
 * MMR ≈ 200×$40 + 40×$150 = $14,000. User/API key floors scale together (~59 keys ≈ 27% of 221 users).
 */
export const MVM_CREATED_CAP = 100

/** First calendar day of seeded `analytics_revenue_daily` (UTC); dashboard uses max(anchor, rolling 90d). */
export const REVENUE_DAILY_SERIES_START = '2026-01-01'

export const PUBLIC_SYNTH_DEFAULTS = {
  mvm_created: 14,
  mvm_running: 11,
  cumulative_kwh_shifted: 2_180_000,
  dashboard_users: 221,
  subs_basic_public: 200,
  subs_premium_public: 40,
  api_keys_public: 59,
}

/** Above this, treat `dashboard_users` as legacy seed noise and snap to public defaults. */
const SYNTH_USERS_CORRUPT_THRESHOLD = 2200

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
  const corruptUsers = rawUsers > SYNTH_USERS_CORRUPT_THRESHOLD
  const usersBase = corruptUsers ? d.dashboard_users : rawUsers
  const keysBase = corruptUsers ? d.api_keys_public : rawKeys
  return {
    mvm_created: created,
    mvm_running: running,
    cumulative_kwh_shifted:
      Number(row.cumulative_kwh_shifted) || d.cumulative_kwh_shifted,
    dashboard_users: Math.max(usersBase, d.dashboard_users),
    subs_basic_public: Math.max(Number(row.subs_basic_public) || 0, d.subs_basic_public),
    subs_premium_public: Math.max(
      Number(row.subs_premium_public) || 0,
      d.subs_premium_public,
    ),
    api_keys_public: Math.max(keysBase, d.api_keys_public),
  }
}
