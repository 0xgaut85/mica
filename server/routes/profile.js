import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT wallet_address, chain, name, avatar_url, x_handle, linkedin_url, created_at FROM users WHERE wallet_address = $1',
      [req.wallet],
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

router.patch('/', requireAuth, async (req, res, next) => {
  try {
    const { name, avatarUrl, xHandle, linkedinUrl } = req.body
    const { rows } = await pool.query(
      `UPDATE users SET
        name = COALESCE($2, name),
        avatar_url = COALESCE($3, avatar_url),
        x_handle = COALESCE($4, x_handle),
        linkedin_url = COALESCE($5, linkedin_url)
       WHERE wallet_address = $1
       RETURNING wallet_address, chain, name, avatar_url, x_handle, linkedin_url, created_at`,
      [req.wallet, name, avatarUrl, xHandle, linkedinUrl],
    )
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

export default router
