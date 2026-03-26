import { Router } from 'express'
import { SiweMessage } from 'siwe'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import pool from '../db/pool.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

router.post('/nonce', (_req, res) => {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36)
  res.json({ nonce })
})

router.post('/verify/evm', async (req, res, next) => {
  try {
    const { message, signature } = req.body
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })
    const wallet = data.address.toLowerCase()

    await pool.query(
      `INSERT INTO users (wallet_address, chain) VALUES ($1, 'EVM')
       ON CONFLICT (wallet_address) DO NOTHING`,
      [wallet],
    )

    const token = signToken(wallet, 'EVM')
    res.json({ token, wallet })
  } catch (err) {
    next(err)
  }
})

router.post('/verify/solana', async (req, res, next) => {
  try {
    const { publicKey, signature, message } = req.body
    const pubKeyBytes = bs58.decode(publicKey)
    const sigBytes = bs58.decode(signature)
    const msgBytes = new TextEncoder().encode(message)

    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes)
    if (!valid) return res.status(401).json({ error: 'Invalid signature' })

    const wallet = publicKey

    await pool.query(
      `INSERT INTO users (wallet_address, chain) VALUES ($1, 'Solana')
       ON CONFLICT (wallet_address) DO NOTHING`,
      [wallet],
    )

    const token = signToken(wallet, 'Solana')
    res.json({ token, wallet })
  } catch (err) {
    next(err)
  }
})

export default router
