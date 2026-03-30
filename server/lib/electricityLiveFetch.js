/**
 * EU: wholesale day-ahead ENTSO-E via Utilitarian Spot (€/MWh → USD/kWh).
 * US: national average residential retail proxy from PriceOfElectricity v1 API (cents/kWh → USD/kWh).
 * EUR→USD: Frankfurter (ECB reference), no API key.
 *
 * Comparisons are illustrative: EU wholesale vs US average retail is not a perfect like-for-like,
 * but the dashboard uses their mean as a simple “reference blend,” then applies the Mica pay fraction.
 */

const SPOT_BASE = 'https://spot.utilitarian.io'
const FX_URL = 'https://api.frankfurter.app/latest?from=EUR&to=USD'
const US_STATES_URL = 'https://www.priceofelectricity.com/api/v1/states'
const FETCH_TIMEOUT_MS = 12_000

/** @type {{ payload: Record<string, unknown> | null, expires: number }} */
let cache = { payload: null, expires: 0 }
const DEFAULT_TTL_MS = 5 * 60 * 1000

function getTtlMs() {
  const n = Number(process.env.ELECTRICITY_LIVE_CACHE_MS)
  return Number.isFinite(n) && n >= 30_000 ? n : DEFAULT_TTL_MS
}

/**
 * Fraction of the blended reference $/kWh you still pay on Mica AI-led infra (0.5 = 50% savings).
 * Override with MICA_ELECTRICITY_PAY_FRACTION=0.5
 */
export function getMicaElectricityPayFraction() {
  const raw = process.env.MICA_ELECTRICITY_PAY_FRACTION
  if (raw === undefined || raw === '') return 0.5
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0 && n <= 1) return n
  return 0.5
}

async function fetchJson(url) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

export async function fetchEurToUsd() {
  const data = await fetchJson(FX_URL)
  const rate = data?.rates?.USD
  if (typeof rate !== 'number' || rate <= 0) throw new Error('Invalid EUR/USD rate')
  return rate
}

/**
 * 50-state average residential rate; avgResidentialRate is cents/kWh.
 * @returns {{ usdPerKwh: number, generatedAt: string | null, sourceUrl: string, stateCount: number }}
 */
export async function fetchUsNationalRetailAvgUsdPerKwh() {
  const data = await fetchJson(US_STATES_URL)
  const states = data?.states
  if (!Array.isArray(states) || states.length === 0) throw new Error('No US states in response')
  let sum = 0
  let n = 0
  for (const st of states) {
    const c = Number(st.avgResidentialRate)
    if (Number.isFinite(c)) {
      sum += c
      n += 1
    }
  }
  if (n === 0) throw new Error('No residential rates in US response')
  const centsPerKwh = sum / n
  return {
    usdPerKwh: centsPerKwh / 100,
    generatedAt: data.generatedAt ?? null,
    sourceUrl: US_STATES_URL,
    stateCount: n,
  }
}

/**
 * @param {Array<{ timestamp: string, value: string }>} records
 * @param {number} nowMs
 * @returns {{ eurPerMwh: number, slotTimestamp: string } | null}
 */
export function currentSlotFromLatest(records, nowMs = Date.now()) {
  if (!Array.isArray(records) || records.length === 0) return null
  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  let pick = sorted[0]
  for (const r of sorted) {
    if (new Date(r.timestamp).getTime() <= nowMs) pick = r
    else break
  }
  const eurPerMwh = Number(pick.value)
  if (!Number.isFinite(eurPerMwh)) return null
  return { eurPerMwh, slotTimestamp: pick.timestamp }
}

export function eurMwhToUsdKwh(eurPerMwh, eurToUsd) {
  const eurPerKwh = eurPerMwh / 1000
  return eurPerKwh * eurToUsd
}

export async function fetchZoneLatest(zone) {
  const url = `${SPOT_BASE}/electricity/${encodeURIComponent(zone)}/latest/`
  const data = await fetchJson(url)
  return Array.isArray(data) ? data : []
}

/**
 * @param {string[]} zones
 * @param {number} eurToUsd
 */
async function aggregateZones(zones, eurToUsd) {
  const parts = await Promise.all(
    zones.map(async (z) => {
      const rec = await fetchZoneLatest(z)
      const slot = currentSlotFromLatest(rec)
      if (!slot) return null
      return {
        zone: z,
        usdPerKwh: eurMwhToUsdKwh(slot.eurPerMwh, eurToUsd),
        eurPerMwh: slot.eurPerMwh,
        slotTimestamp: slot.slotTimestamp,
      }
    }),
  )
  const ok = parts.filter(Boolean)
  if (ok.length === 0) return null
  const sumUsd = ok.reduce((s, p) => s + p.usdPerKwh, 0)
  const sumEur = ok.reduce((s, p) => s + p.eurPerMwh, 0)
  const latestTs = ok.reduce((max, p) => {
    const t = new Date(p.slotTimestamp).getTime()
    return t > max ? t : max
  }, 0)
  return {
    usdPerKwh: sumUsd / ok.length,
    eurPerMwh: sumEur / ok.length,
    slotTimestamp: new Date(latestTs).toISOString(),
    zones: ok.map((p) => p.zone),
  }
}

/**
 * Returns live snapshots per logical region key + US national retail proxy.
 */
export async function fetchLiveElectricitySnapshots() {
  const now = Date.now()
  if (cache.payload && cache.expires > now) {
    return { ...cache.payload, fromCache: true }
  }

  const [eurToUsd, usRetailResult] = await Promise.all([
    fetchEurToUsd(),
    fetchUsNationalRetailAvgUsdPerKwh().catch(() => null),
  ])

  const slot = (zone, records) => {
    const s = currentSlotFromLatest(records)
    return s ? { zone, ...s } : null
  }

  const [de, fr, nl, es, pl, at, euBlend, nordicBlend] = await Promise.all([
    fetchZoneLatest('DE_LU').then((rec) => slot('DE_LU', rec)),
    fetchZoneLatest('FR').then((rec) => slot('FR', rec)),
    fetchZoneLatest('NL').then((rec) => slot('NL', rec)),
    fetchZoneLatest('ES').then((rec) => slot('ES', rec)),
    fetchZoneLatest('PL').then((rec) => slot('PL', rec)),
    fetchZoneLatest('AT').then((rec) => slot('AT', rec)),
    aggregateZones(['DE_LU', 'FR', 'NL', 'PL'], eurToUsd),
    aggregateZones(['SE3', 'NO2', 'FI'], eurToUsd),
  ])

  const out = {
    fetchedAt: new Date().toISOString(),
    eurToUsd,
    sourceUrl: SPOT_BASE,
    dataNote:
      'EU: wholesale day-ahead (ENTSO-E) in USD/kWh via ECB EUR/USD. US: 50-state mean residential retail (cents/kWh) from PriceOfElectricity — not wholesale; illustrative only.',
    regions: {},
    usNationalRetail: usRetailResult,
  }

  function addFromSlot(key, row) {
    if (!row || row.eurPerMwh == null) return
    out.regions[key] = {
      usdPerKwh: eurMwhToUsdKwh(row.eurPerMwh, eurToUsd),
      eurPerMwh: row.eurPerMwh,
      slotTimestamp: row.slotTimestamp,
      spotZone: row.zone,
      isLive: true,
    }
  }

  addFromSlot('DE', de)
  addFromSlot('FR', fr)
  addFromSlot('NL', nl)
  addFromSlot('ES', es)
  addFromSlot('PL', pl)
  addFromSlot('AT', at)

  if (euBlend) {
    out.regions.EU = {
      usdPerKwh: euBlend.usdPerKwh,
      eurPerMwh: euBlend.eurPerMwh,
      slotTimestamp: euBlend.slotTimestamp,
      spotZones: euBlend.zones,
      isLive: true,
    }
  }
  if (nordicBlend) {
    out.regions.NORDIC = {
      usdPerKwh: nordicBlend.usdPerKwh,
      eurPerMwh: nordicBlend.eurPerMwh,
      slotTimestamp: nordicBlend.slotTimestamp,
      spotZones: nordicBlend.zones,
      isLive: true,
    }
  }

  cache = { payload: out, expires: now + getTtlMs() }
  return { ...out, fromCache: false }
}

export function clearElectricityLiveCache() {
  cache = { payload: null, expires: 0 }
}
