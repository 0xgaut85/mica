import { Router } from 'express'
import { ethers } from 'ethers'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const PLAN_PRICES = { basic: 20, premium: 75 }

const TREASURY = {
  usdc_base: process.env.TREASURY_USDC_BASE_ADDRESS,
  eth: process.env.TREASURY_ETH_ADDRESS,
  sol: process.env.TREASURY_SOL_ADDRESS,
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, plan, valid_until, asset, method, created_at
       FROM subscriptions
       WHERE wallet_address = $1
       ORDER BY created_at DESC LIMIT 10`,
      [req.wallet],
    )
    const active = rows.find((r) => new Date(r.valid_until) > new Date()) || null
    res.json({ active, history: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/verify-tx', requireAuth, async (req, res, next) => {
  try {
    const { plan, asset, txHash } = req.body
    if (!PLAN_PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' })
    if (!TREASURY[asset]) return res.status(400).json({ error: 'Invalid asset' })

    let verified = false

    if (asset === 'eth') {
      const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth.llamarpc.com')
      const receipt = await provider.getTransactionReceipt(txHash)
      if (receipt && receipt.status === 1) {
        const tx = await provider.getTransaction(txHash)
        if (tx.to?.toLowerCase() === TREASURY.eth?.toLowerCase()) {
          verified = true
        }
      }
    } else if (asset === 'usdc_base') {
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org')
      const receipt = await provider.getTransactionReceipt(txHash)
      if (receipt && receipt.status === 1) {
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        const treasuryPadded = '0x' + TREASURY.usdc_base.slice(2).toLowerCase().padStart(64, '0')
        const hasTransferToTreasury = receipt.logs.some(
          (log) => log.topics[0] === transferTopic && log.topics[2]?.toLowerCase() === treasuryPadded,
        )
        if (hasTransferToTreasury) verified = true
      }
    } else if (asset === 'sol') {
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTransaction',
          params: [txHash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      })
      const { result } = await resp.json()
      if (result?.meta?.err === null) {
        verified = true
      }
    }

    if (!verified) return res.status(400).json({ error: 'Transaction not verified' })

    const { rowCount: existing } = await pool.query(
      `SELECT 1 FROM subscriptions WHERE payment_tx = $1 LIMIT 1`,
      [txHash],
    )
    if (existing) return res.status(409).json({ error: 'Transaction already used' })

    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + 1)

    await pool.query(
      `INSERT INTO subscriptions (wallet_address, plan, valid_until, payment_tx, asset, method)
       VALUES ($1, $2, $3, $4, $5, 'wallet')`,
      [req.wallet, plan, validUntil.toISOString(), txHash, asset],
    )

    res.json({ ok: true, validUntil: validUntil.toISOString() })
  } catch (err) {
    next(err)
  }
})

export default router
