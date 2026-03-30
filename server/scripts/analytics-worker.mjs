/**
 * Runs analytics tick on an interval (24/7 worker). Deploy as a separate Railway service
 * with the same DATABASE_URL as mica-api, start command:
 *   node scripts/analytics-worker.mjs
 *
 * Env:
 *   DATABASE_URL (required)
 *   ANALYTICS_TICK_INTERVAL_MS (default 60000 = 1 minute)
 */

import 'dotenv/config'
import pool from '../db/pool.js'
import { runAnalyticsTickOnce } from '../lib/analyticsTickRun.js'

const INTERVAL_MS = Math.max(
  15_000,
  Number(process.env.ANALYTICS_TICK_INTERVAL_MS) || 60_000,
)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function tickLoop() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const out = await runAnalyticsTickOnce(client)
    await client.query('COMMIT')
    console.log(
      new Date().toISOString(),
      `analytics-worker: users~${out.dashboardUsers} keys~${out.apiKeysPublic} mvm ${out.mvmRunning}/${out.mvmCreated} subs ${out.subsBasicPublic}/${out.subsPremiumPublic}/e${out.subsEnterprisePublic} mmr=${out.gross} prog=${(out.progress * 100).toFixed(1)}%`,
    )
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('analytics-worker tick failed:', e)
  } finally {
    client.release()
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('analytics-worker: DATABASE_URL is not set')
    process.exit(1)
  }
  console.log(`analytics-worker: interval ${INTERVAL_MS}ms, MVM cap from lib`)

  let shuttingDown = false
  const shutdown = async () => {
    if (shuttingDown) return
    shuttingDown = true
    console.log('analytics-worker: shutting down')
    await pool.end()
    process.exit(0)
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  while (!shuttingDown) {
    await tickLoop()
    await sleep(INTERVAL_MS)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
