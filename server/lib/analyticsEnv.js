/**
 * Environment KPIs: illustrative model for workload shifted from high-cost / higher-carbon
 * grids (US commercial proxy, island retail proxy) to Nordic-class clean grids.
 *
 * USD/kWh proxies (order-of-magnitude; refresh periodically — see EIA Electric Power Monthly,
 * Eurostat household electricity prices, typical island tariffs):
 * - US commercial average ~$0.13/kWh (EIA)
 * - Nordic industrial / wholesale-adjacent ~$0.08/kWh (blended proxy)
 * - Spread used for savings: avoid claiming island peak; use conservative delta.
 */
export const ENV_USD_PER_KWH_HIGH = 0.145
export const ENV_USD_PER_KWH_LOW = 0.082
/** kg CO2e per kWh — US grid average ballpark vs Nordic hydro/wind-heavy mix (order-of-magnitude). */
export const ENV_KG_CO2_PER_KWH_US = 0.385
export const ENV_KG_CO2_PER_KWH_NORDIC = 0.035

export function computeEnvironmentFromKwh(cumulativeKwh) {
  const kwh = Math.max(0, Number(cumulativeKwh) || 0)
  const deltaPrice = Math.max(0, ENV_USD_PER_KWH_HIGH - ENV_USD_PER_KWH_LOW)
  const energySavingsUsd = kwh * deltaPrice
  const deltaCo2Kg = Math.max(0, ENV_KG_CO2_PER_KWH_US - ENV_KG_CO2_PER_KWH_NORDIC)
  const co2ReducedTonnes = (kwh * deltaCo2Kg) / 1000
  const methodology =
    `Modeled cumulative savings vs US grid-average proxy ($${ENV_USD_PER_KWH_HIGH.toFixed(3)}/kWh, ~${ENV_KG_CO2_PER_KWH_US} kg CO₂e/kWh) ` +
    `vs Nordic low-carbon proxy ($${ENV_USD_PER_KWH_LOW.toFixed(3)}/kWh, ~${ENV_KG_CO2_PER_KWH_NORDIC} kg CO₂e/kWh). ` +
    'Indicative; see EIA Electric Power Monthly and national emission factors.'
  return { energySavingsUsd, co2ReducedTonnes, methodology }
}
