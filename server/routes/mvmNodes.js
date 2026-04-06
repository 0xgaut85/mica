import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const PROVISION_MS = 86400000

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, hardware, region, specs, status, registered_at
       FROM mvm_nodes
       WHERE wallet_address = $1 AND disconnected_at IS NULL
       ORDER BY registered_at DESC
       LIMIT 1`,
      [req.wallet],
    )
    if (!rows.length) return res.json({ node: null })

    const node = rows[0]
    const elapsed = Date.now() - new Date(node.registered_at).getTime()
    if (node.status === 'provisioning' && elapsed >= PROVISION_MS) {
      await pool.query(
        `UPDATE mvm_nodes SET status = 'active' WHERE id = $1`,
        [node.id],
      )
      node.status = 'active'
    }

    res.json({
      node: {
        nodeId: node.id,
        name: node.name,
        hardware: node.hardware,
        region: node.region,
        specs: node.specs,
        status: node.status,
        registeredAt: new Date(node.registered_at).getTime(),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { rows: subRows } = await pool.query(
      `SELECT id FROM subscriptions WHERE wallet_address = $1 AND valid_until > now() LIMIT 1`,
      [req.wallet],
    )
    if (!subRows.length) return res.status(403).json({ error: 'Active subscription required' })

    const { rows: existing } = await pool.query(
      `SELECT id FROM mvm_nodes WHERE wallet_address = $1 AND disconnected_at IS NULL LIMIT 1`,
      [req.wallet],
    )
    if (existing.length) return res.status(409).json({ error: 'Node already registered' })

    const { name, hardware, region, specs } = req.body
    if (!name || !hardware || !region) {
      return res.status(400).json({ error: 'name, hardware, and region are required' })
    }

    const { rows } = await pool.query(
      `INSERT INTO mvm_nodes (wallet_address, name, hardware, region, specs)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, registered_at`,
      [req.wallet, name, hardware, region, specs || null],
    )

    res.json({
      node: {
        nodeId: rows[0].id,
        name,
        hardware,
        region,
        specs: specs || null,
        status: 'provisioning',
        registeredAt: new Date(rows[0].registered_at).getTime(),
      },
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE mvm_nodes SET status = 'disconnected', disconnected_at = now()
       WHERE id = $1 AND wallet_address = $2 AND disconnected_at IS NULL`,
      [req.params.id, req.wallet],
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
