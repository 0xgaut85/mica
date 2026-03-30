import { useCallback, useState } from 'react'
import { useSendTransaction } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { api } from './api'

const USDC_BASE_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const PLAN_PRICES = { basic: 40, premium: 150 }

const TREASURY = {
  usdc_base: import.meta.env.VITE_TREASURY_USDC_BASE_ADDRESS || '',
  eth: import.meta.env.VITE_TREASURY_ETH_ADDRESS || '',
  sol: import.meta.env.VITE_TREASURY_SOL_ADDRESS || '',
}

export function usePayment({ onSuccess }) {
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState(null)
  const { sendTransactionAsync } = useSendTransaction()
  const solWallet = useWallet()
  const { connection } = useConnection()

  const payWithWallet = useCallback(async (plan, assetId) => {
    setPaying(true)
    setPayError(null)
    try {
      const price = PLAN_PRICES[plan]
      if (!price) throw new Error('Invalid plan')

      let txHash

      if (assetId === 'eth') {
        const ethAmount = price / 3500
        txHash = await sendTransactionAsync({
          to: TREASURY.eth,
          value: parseEther(ethAmount.toFixed(18)),
        })
      } else if (assetId === 'usdc_base') {
        const data = encodeErc20Transfer(TREASURY.usdc_base, price)
        txHash = await sendTransactionAsync({
          to: USDC_BASE_CONTRACT,
          data,
          chainId: 8453,
        })
      } else if (assetId === 'sol') {
        if (!solWallet.publicKey || !solWallet.sendTransaction) throw new Error('Solana wallet not connected')
        const { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
        const solAmount = price / 150
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: solWallet.publicKey,
            toPubkey: new PublicKey(TREASURY.sol),
            lamports: Math.round(solAmount * LAMPORTS_PER_SOL),
          }),
        )
        const sig = await solWallet.sendTransaction(tx, connection)
        txHash = sig
      }

      if (txHash) {
        try { await api.verifyTx(plan, assetId, txHash) } catch {}
        onSuccess(plan, assetId, txHash)
      }
    } catch (err) {
      setPayError(err.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }, [sendTransactionAsync, solWallet, connection, onSuccess])

  return { payWithWallet, paying, payError }
}

function encodeErc20Transfer(to, amountUsd) {
  const selector = '0xa9059cbb'
  const recipient = to.slice(2).padStart(64, '0')
  const amount = parseUnits(amountUsd.toString(), 6).toString(16).padStart(64, '0')
  return `${selector}${recipient}${amount}`
}
