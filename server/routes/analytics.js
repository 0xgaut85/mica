import { Router } from 'express'
import pool from '../db/pool.js'
import { computeEnvironmentFromKwh } from '../lib/analyticsEnv.js'
import {
  fetchLiveElectricitySnapshots,
  getMicaElectricityPayFraction,
} from '../lib/electricityLiveFetch.js'
import {
  fetchActivePlanCounts,
  mmrFromPlanCounts,
  publicStoryByPlan,
} from '../lib/analyticsRevenue.js'
import {
  apiKeysForUsers,
  effectiveSynthMmrFloorUsd,
  normalizeSynthStateRow,
  REVENUE_SERIES_QUERY_DAYS,
  SYNTH_GROWTH_DAYS_DEFAULT,
  SYNTH_MMR_CEILING_USD_DEFAULT,
} from '../lib/analyticsSynthDefaults.js'
import { growthProgressMs, targetMmrUsd } from '../lib/analyticsSynthGrowth.js'

const router = Router()

function revenueSeriesQueryStartUtc() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const rolling = new Date(today)
  rolling.setUTCDate(rolling.getUTCDate() - (REVENUE_SERIES_QUERY_DAYS - 1))
  return rolling.toISOString().slice(0, 10)
}

const ANALYTICS_API_META = {
  analyticsApiVersion: 4,
  gitCommit:
    (process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.COMMIT_REF ||
      '')
      .toString()
      .slice(0, 7) || null,
}

function round4(x) {
  return Math.round(Number(x) * 10000) / 10000
}

function mergeElectricityWithLive(dbRows, live) {
  const fetchedAt = live?.fetchedAt ?? null
  const dataNote = live?.dataNote
  return dbRows.map((r) => {
    const code = r.regionCode

    if (code === 'US' && live?.usNationalRetail?.usdPerKwh != null) {
      const u = live.usNationalRetail
      return {
        regionCode: code,
        label: r.label,
        usdPerKwh: round4(u.usdPerKwh),
        sourceUrl: u.sourceUrl,
        updatedAt: u.generatedAt || fetchedAt,
        isLive: true,
        priceType: 'us-national-retail-mean',
        slotTimestamp: null,
        dataNote,
        usStateCount: u.stateCount,
      }
    }

    const liveRow = live?.regions?.[code]
    if (liveRow?.isLive) {
      return {
        regionCode: code,
        label: r.label,
        usdPerKwh: round4(liveRow.usdPerKwh),
        eurPerMwh: liveRow.eurPerMwh,
        sourceUrl: 'https://spot.utilitarian.io/',
        updatedAt: fetchedAt,
        isLive: true,
        slotTimestamp: liveRow.slotTimestamp,
        priceType: 'wholesale-day-ahead',
        spotZone: liveRow.spotZone ?? null,
        spotZones: liveRow.spotZones ?? null,
        dataNote,
        eurToUsd: live.eurToUsd,
      }
    }
    const staticNote =
      code === 'EU'
        ? 'Reference table: EU household retail proxy (comparison axis). Live wholesale for EU zones appears in rows marked Live when feeds load.'
        : 'Reference value from configured table. Enable live feeds for market overlays where available.'
    return {
      regionCode: code,
      label: r.label,
      usdPerKwh: Number(r.usdPerKwh),
      sourceUrl: r.sourceUrl,
      updatedAt: r.updatedAt,
      isLive: false,
      priceType: 'reference-static',
      dataNote: staticNote,
    }
  })
}

/** DB static $/kWh by region code (used for EU retail proxy in hero comparison). */
function staticRefMap(rows) {
  const m = {}
  for (const r of rows) {
    if (r?.regionCode != null) m[r.regionCode] = Number(r.usdPerKwh)
  }
  return m
}

/**
 * Hero card: EU = household retail proxy from static reference (not volatile wholesale spot).
 * US = live national retail when available. Blend → Mica effective = pay fraction × blend (always < EU ref when pay < 1).
 */
function buildElectricityComparison(mergedRows, dbStaticRows) {
  const pay = getMicaElectricityPayFraction()
  const staticMap = staticRefMap(dbStaticRows)
  const euRow = mergedRows.find((r) => r.regionCode === 'EU')
  const usRow = mergedRows.find((r) => r.regionCode === 'US')
  const rawEu = staticMap.EU
  const euRef =
    Number.isFinite(rawEu) && rawEu > 0.08 && rawEu < 1.5 ? rawEu : 0.29
  const us = usRow?.usdPerKwh != null ? Number(usRow.usdPerKwh) : null
  const blended =
    euRef != null && us != null ? (euRef + us) / 2 : euRef ?? us ?? null
  let mica = blended != null ? blended * pay : euRef * pay
  if (euRef != null && mica != null && mica >= euRef) {
    mica = round4(euRef * pay * 0.995)
  }
  const savingsPct = Math.round((1 - pay) * 100)

  return {
    euUsdPerKwh: round4(euRef),
    usUsdPerKwh: us != null ? round4(us) : null,
    blendedReferenceUsdPerKwh: blended != null ? round4(blended) : null,
    micaEffectiveUsdPerKwh: mica != null ? round4(mica) : null,
    micaPayFraction: pay,
    micaSavingsFraction: 1 - pay,
    micaSavingsPercent: savingsPct,
    euSummary:
      'EU household retail proxy (static reference, Eurostat-style order of magnitude) — comparable axis to US retail, not wholesale spot.',
    usSummary:
      'US average retail: mean residential rate across 50 states (PriceOfElectricity), USD/kWh.',
    micaSummary: `Mica effective rate is ${Math.round(pay * 100)}% of the EU/US retail blend — lower than EU retail alone when US retail is in the same ballpark.`,
    methodology:
      'EU figure for this comparison is a household retail proxy from our reference table (not day-ahead wholesale). Reference blend = average of that EU proxy and US retail. Mica effective $/kWh = MICA_ELECTRICITY_PAY_FRACTION × blend. Zone table below still shows live wholesale where available.',
    euSourceLive: false,
    euComparisonUsesRetailProxy: true,
    usSourceLive: Boolean(usRow?.isLive),
    euTableSourceLive: Boolean(euRow?.isLive),
  }
}

router.get('/subscription-revenue', async (_req, res, next) => {
  try {
    const [byPlan, synthR] = await Promise.all([
      fetchActivePlanCounts(pool),
      pool.query(
        `SELECT subs_basic_public, subs_premium_public, subs_enterprise_public
         FROM analytics_synthetic_state WHERE id = 1`,
      ),
    ])
    const synthState = normalizeSynthStateRow(synthR.rows[0])
    const merged = publicStoryByPlan(byPlan, synthState)
    const mmrUsd = mmrFromPlanCounts(merged)
    const arrUsd = mmrUsd * 12
    const activeTotal = merged.basic + merged.premium + merged.enterprise
    const enterpriseExcludedFromMmr = merged.enterprise > 0

    res.json({
      mmrUsd,
      arrUsd,
      activeTotal,
      byPlan: merged,
      enterpriseExcludedFromMmr,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [usersR, keysR, synthR, revR, elecR, byPlan, liveSnapshot] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM users`),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM api_keys WHERE revoked_at IS NULL`,
      ),
      pool.query(
        `SELECT mvm_created, mvm_running, cumulative_kwh_shifted, dashboard_users,
                subs_basic_public, subs_premium_public, subs_enterprise_public, api_keys_public,
                synth_mmr_floor_usd, synth_mmr_ceiling_usd, synth_growth_days, synth_growth_start_at
         FROM analytics_synthetic_state WHERE id = 1`,
      ),
      pool.query(
        `SELECT day, gross_usd, net_usd
         FROM analytics_revenue_daily
         WHERE day >= $1::date AND day <= CURRENT_DATE
         ORDER BY day ASC`,
        [revenueSeriesQueryStartUtc()],
      ),
      pool.query(
        `SELECT region_code AS "regionCode", label, usd_per_kwh AS "usdPerKwh", source_url AS "sourceUrl", updated_at AS "updatedAt"
         FROM analytics_electricity_reference
         ORDER BY region_code`,
      ),
      fetchActivePlanCounts(pool),
      (async () => {
        if (process.env.ELECTRICITY_LIVE === '0') return null
        try {
          return await fetchLiveElectricitySnapshots()
        } catch (e) {
          console.warn('[analytics] electricity live fetch failed:', e.message)
          return null
        }
      })(),
    ])

    const rawSynth = synthR.rows[0]
    const synthState = normalizeSynthStateRow(rawSynth)
    const mmrFloor = effectiveSynthMmrFloorUsd(rawSynth)
    const mmrCeil =
      Number(rawSynth?.synth_mmr_ceiling_usd) || SYNTH_MMR_CEILING_USD_DEFAULT
    const growthDays =
      Number(rawSynth?.synth_growth_days) || SYNTH_GROWTH_DAYS_DEFAULT
    const growthStartAt = rawSynth?.synth_growth_start_at
    const growthProgress = growthProgressMs(growthStartAt, growthDays)
    const growthTargetMmr = targetMmrUsd(mmrFloor, mmrCeil, growthProgress)
    const mvmCreated = synthState.mvm_created
    const mvmRunning = synthState.mvm_running
    const cumulativeKwh = synthState.cumulative_kwh_shifted
    const dashboardUsersFloor = synthState.dashboard_users
    const realUsers = usersR.rows[0]?.n ?? 0
    const realKeys = keysR.rows[0]?.n ?? 0

    const env = computeEnvironmentFromKwh(cumulativeKwh)
    const dates = []
    const gross = []
    const net = []
    for (const r of revR.rows) {
      const d = r.day
      dates.push(typeof d === 'string' ? d.slice(0, 10) : d?.toISOString?.().slice(0, 10) ?? '')
      gross.push(Number(r.gross_usd))
      net.push(Number(r.net_usd))
    }

    const byPlanDisplay = publicStoryByPlan(byPlan, synthState)
    const mmrUsd = mmrFromPlanCounts(byPlanDisplay)
    const arrUsd = mmrUsd * 12
    const activeTotal =
      byPlanDisplay.basic + byPlanDisplay.premium + byPlanDisplay.enterprise
    const enterpriseExcludedFromMmr = byPlanDisplay.enterprise > 0
    /** Active users tile = same number as “Total active” (sum of seats). */
    const usersDisplayed = activeTotal
    const apiKeysDisplayed = apiKeysForUsers(activeTotal)

    const electricityByRegion = mergeElectricityWithLive(elecR.rows, liveSnapshot)
    const electricityComparison = buildElectricityComparison(electricityByRegion, elecR.rows)

    res.json({
      meta: {
        ...ANALYTICS_API_META,
        growthModel: {
          progress: round4(growthProgress),
          targetMmrUsd: round4(growthTargetMmr),
          mmrFloorUsd: round4(mmrFloor),
          mmrCeilingUsd: round4(mmrCeil),
          growthDays,
          startedAt: growthStartAt,
        },
      },
      users: usersDisplayed,
      usersRegistered: realUsers,
      usersPublicFloor: dashboardUsersFloor,
      apiKeysActive: apiKeysDisplayed,
      apiKeysRegistered: realKeys,
      mvmCreated,
      mvmRunning,
      cumulativeKwhShifted: cumulativeKwh,
      environment: {
        energySavingsUsd: env.energySavingsUsd,
        co2ReducedTonnes: env.co2ReducedTonnes,
        methodology: env.methodology,
      },
      revenueSeries: { dates, gross, net },
      electricityByRegion,
      electricityComparison,
      electricityLive: {
        ok: Boolean(liveSnapshot),
        fetchedAt: liveSnapshot?.fetchedAt ?? null,
        eurToUsd: liveSnapshot?.eurToUsd ?? null,
        fromCache: liveSnapshot?.fromCache ?? false,
        dataNote: liveSnapshot?.dataNote ?? null,
        usNationalOk: Boolean(liveSnapshot?.usNationalRetail),
      },
      subscriptionRevenue: {
        mmrUsd,
        arrUsd,
        activeTotal,
        byPlan: byPlanDisplay,
        byPlanRegistered: byPlan,
        enterpriseExcludedFromMmr,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
