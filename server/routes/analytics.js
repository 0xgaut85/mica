import { Router } from 'express'
import pool from '../db/pool.js'
import { computeEnvironmentFromKwh } from '../lib/analyticsEnv.js'
import {
  fetchLiveElectricitySnapshots,
  getMicaElectricityPayFraction,
} from '../lib/electricityLiveFetch.js'
import { fetchActivePlanCounts, mmrFromPlanCounts } from '../lib/analyticsRevenue.js'

const router = Router()

const REVENUE_SERIES_DAYS = 90

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
    return {
      regionCode: code,
      label: r.label,
      usdPerKwh: Number(r.usdPerKwh),
      sourceUrl: r.sourceUrl,
      updatedAt: r.updatedAt,
      isLive: false,
      priceType: 'reference-static',
      dataNote:
        'Static fallback. Set ELECTRICITY_LIVE (default on) and outbound HTTPS for live EU/US overlays.',
    }
  })
}

function buildElectricityComparison(mergedRows) {
  const pay = getMicaElectricityPayFraction()
  const euRow = mergedRows.find((r) => r.regionCode === 'EU')
  const usRow = mergedRows.find((r) => r.regionCode === 'US')
  const eu = euRow?.usdPerKwh != null ? Number(euRow.usdPerKwh) : null
  const us = usRow?.usdPerKwh != null ? Number(usRow.usdPerKwh) : null
  const blended = eu != null && us != null ? (eu + us) / 2 : eu ?? us ?? null
  const mica = blended != null ? blended * pay : null
  const savingsPct = Math.round((1 - pay) * 100)

  return {
    euUsdPerKwh: eu != null ? round4(eu) : null,
    usUsdPerKwh: us != null ? round4(us) : null,
    blendedReferenceUsdPerKwh: blended != null ? round4(blended) : null,
    micaEffectiveUsdPerKwh: mica != null ? round4(mica) : null,
    micaPayFraction: pay,
    micaSavingsFraction: 1 - pay,
    micaSavingsPercent: savingsPct,
    euSummary:
      'EU wholesale day-ahead: ENTSO-E DE+FR+NL+PL blend, converted to USD/kWh (live when data loads).',
    usSummary:
      'US average retail: mean residential rate across 50 states (PriceOfElectricity), USD/kWh.',
    micaSummary: `Mica AI-led infrastructure targets ${savingsPct}% lower effective electricity cost vs the blended EU/US reference (you pay ${Math.round(pay * 100)}% of that blend).`,
    methodology:
      'Reference blend = average of the EU and US figures when both are available (otherwise the one that exists). EU is wholesale; US is retail — directional comparison only. Mica effective $/kWh = MICA_ELECTRICITY_PAY_FRACTION × reference blend (default 0.5 = 50% savings).',
    euSourceLive: Boolean(euRow?.isLive),
    usSourceLive: Boolean(usRow?.isLive),
  }
}

router.get('/subscription-revenue', async (_req, res, next) => {
  try {
    const byPlan = await fetchActivePlanCounts(pool)
    const mmrUsd = mmrFromPlanCounts(byPlan)
    const arrUsd = mmrUsd * 12
    const activeTotal = byPlan.basic + byPlan.premium + byPlan.enterprise
    const enterpriseExcludedFromMmr = byPlan.enterprise > 0

    res.json({
      mmrUsd,
      arrUsd,
      activeTotal,
      byPlan,
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
        `SELECT mvm_created, mvm_running, cumulative_kwh_shifted
         FROM analytics_synthetic_state WHERE id = 1`,
      ),
      pool.query(
        `SELECT day, gross_usd, net_usd
         FROM analytics_revenue_daily
         WHERE day >= (CURRENT_DATE - ($1::int - 1))
         ORDER BY day ASC`,
        [REVENUE_SERIES_DAYS],
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

    let mvmCreated = 14
    let mvmRunning = 7
    let cumulativeKwh = 0
    if (synthR.rows[0]) {
      mvmCreated = synthR.rows[0].mvm_created
      mvmRunning = synthR.rows[0].mvm_running
      cumulativeKwh = Number(synthR.rows[0].cumulative_kwh_shifted) || 0
    }

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

    const mmrUsd = mmrFromPlanCounts(byPlan)
    const arrUsd = mmrUsd * 12
    const activeTotal = byPlan.basic + byPlan.premium + byPlan.enterprise
    const enterpriseExcludedFromMmr = byPlan.enterprise > 0

    const electricityByRegion = mergeElectricityWithLive(elecR.rows, liveSnapshot)
    const electricityComparison = buildElectricityComparison(electricityByRegion)

    res.json({
      users: usersR.rows[0]?.n ?? 0,
      apiKeysActive: keysR.rows[0]?.n ?? 0,
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
        byPlan,
        enterpriseExcludedFromMmr,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
