/**
 * One-shot analytics tick (cron-friendly).
 * For a long-running loop use: node scripts/analytics-worker.mjs
 *
 * Env: DATABASE_URL
 */

import 'dotenv/config'
import pool from '../db/pool.js'
import { runAnalyticsTickOnce } from '../lib/analyticsTickRun.js'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('analytics-tick: DATABASE_URL is not set')
    process.exit(1)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const out = await runAnalyticsTickOnce(client)
    await client.query('COMMIT')
    console.log(
      `analytics-tick: ok users~${out.dashboardUsers} keys~${out.apiKeysPublic} mvm ${out.mvmRunning}/${out.mvmCreated} kwh~${out.kwh} mmr=${out.gross} subs ${out.subsBasicPublic}/${out.subsPremiumPublic} prog=${(out.progress * 100).toFixed(2)}% tgt~${Math.round(out.targetMmr)}`,
    )
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('analytics-tick:', e)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()
