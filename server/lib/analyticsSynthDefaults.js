/**
 * Public synthetic floors for dashboard + worker.
 * MMR ≈ 200×$40 + 40×$150 = $14,000 (users seed capped at 150).
 */
export const MVM_CREATED_CAP = 100

export const PUBLIC_SYNTH_DEFAULTS = {
  mvm_created: 14,
  mvm_running: 11,
  cumulative_kwh_shifted: 2_180_000,
  dashboard_users: 150,
  subs_basic_public: 200,
  subs_premium_public: 40,
  api_keys_public: 40,
}

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
  return {
    mvm_created: created,
    mvm_running: running,
    cumulative_kwh_shifted:
      Number(row.cumulative_kwh_shifted) || d.cumulative_kwh_shifted,
    dashboard_users: Math.max(Number(row.dashboard_users) || 0, d.dashboard_users),
    subs_basic_public: Math.max(Number(row.subs_basic_public) || 0, d.subs_basic_public),
    subs_premium_public: Math.max(
      Number(row.subs_premium_public) || 0,
      d.subs_premium_public,
    ),
    api_keys_public: Math.max(Number(row.api_keys_public) || 0, d.api_keys_public),
  }
}
