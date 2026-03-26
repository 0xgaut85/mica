import { Router } from 'express'
import crypto from 'node:crypto'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function hashKey(plaintext) {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, LEFT(key_hash, 12) AS key_preview, created_at, revoked_at
       FROM api_keys
       WHERE wallet_address = $1
       ORDER BY created_at DESC`,
      [req.wallet],
    )
    res.json(rows)
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

    const plainKey = `mica_${crypto.randomUUID().replace(/-/g, '')}`
    const hash = hashKey(plainKey)

    const { rows } = await pool.query(
      `INSERT INTO api_keys (wallet_address, key_hash) VALUES ($1, $2) RETURNING id, created_at`,
      [req.wallet, hash],
    )

    res.json({ id: rows[0].id, key: plainKey, createdAt: rows[0].created_at })
  } catch (err) {
    next(err)
  }
})

router.post('/validate', async (req, res, next) => {
  try {
    const { key } = req.body
    if (!key || !key.startsWith('mica_')) {
      return res.status(400).json({ valid: false, error: 'Invalid key format' })
    }
    const hash = hashKey(key)
    const { rows } = await pool.query(
      `SELECT ak.id, u.wallet_address, s.plan, s.valid_until
       FROM api_keys ak
       JOIN users u ON u.wallet_address = ak.wallet_address
       LEFT JOIN subscriptions s ON s.wallet_address = ak.wallet_address AND s.valid_until > now()
       WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL
       LIMIT 1`,
      [hash],
    )
    if (!rows.length) {
      return res.json({ valid: false, error: 'Key not found or revoked' })
    }
    const row = rows[0]
    res.json({
      valid: true,
      plan: row.plan || 'none',
      active: !!row.plan,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND wallet_address = $2 AND revoked_at IS NULL`,
      [req.params.id, req.wallet],
    )
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
