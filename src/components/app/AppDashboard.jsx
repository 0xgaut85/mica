import { useCallback, useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect as useEvmDisconnect, useSignMessage } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SiweMessage } from 'siwe'
import WalletProviders from './WalletProviders'
import ConnectWalletScreen from './ConnectWalletScreen'
import ProfileCard from './ProfileCard'
import PricingCards from './PricingCards'
import BillingSection from './BillingSection'
import MvmNodeSection from './MvmNodeSection'
import { useAppStore, ASSETS } from './useAppStore'
import { api, setToken, getToken } from './api'
import { usePayment } from './usePayment'

function DashboardInner() {
  const evmAccount = useAccount()
  const { disconnect: evmDisconnect } = useEvmDisconnect()
  const { signMessageAsync } = useSignMessage()
  const solWallet = useWallet()

  const [authed, setAuthed] = useState(!!getToken())
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const {
    profile, updateProfile,
    subscription, setSubscription,
    apiKeys, revokeApiKey,
    setApiKeys,
  } = useAppStore()

  const connectedWallet = useMemo(() => {
    if (evmAccount.isConnected) {
      return {
        address: evmAccount.address,
        chain: 'EVM',
        wallet: evmAccount.connector?.name || 'EVM',
      }
    }
    if (solWallet.connected && solWallet.publicKey) {
      const addr = solWallet.publicKey.toBase58()
      return {
        address: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
        fullAddress: addr,
        chain: 'Solana',
        wallet: solWallet.wallet?.adapter?.name || 'Solana',
      }
    }
    return null
  }, [evmAccount.isConnected, evmAccount.address, evmAccount.connector, solWallet.connected, solWallet.publicKey, solWallet.wallet])

  useEffect(() => {
    if (!connectedWallet || authed || authLoading || authError) return

    async function doAuth() {
      setAuthLoading(true)
      setAuthError(null)
      try {
        if (connectedWallet.chain === 'EVM') {
          const { nonce } = await api.getNonce()
          const message = new SiweMessage({
            domain: window.location.host,
            address: connectedWallet.address,
            statement: 'Sign in to Mica Energy',
            uri: window.location.origin,
            version: '1',
            chainId: evmAccount.chainId || 1,
            nonce,
          })
          const messageStr = message.prepareMessage()
          const signature = await signMessageAsync({ message: messageStr })
          const { token } = await api.verifyEvm(messageStr, signature)
          setToken(token)
          setAuthed(true)
        } else if (connectedWallet.chain === 'Solana' && solWallet.signMessage) {
          const { nonce } = await api.getNonce()
          const msg = `Sign in to Mica Energy\nNonce: ${nonce}`
          const encoded = new TextEncoder().encode(msg)
          const sigBytes = await solWallet.signMessage(encoded)
          const bs58Module = await import('bs58')
          const sig58 = bs58Module.default.encode(sigBytes)
          const { token } = await api.verifySolana(connectedWallet.fullAddress, sig58, msg)
          setToken(token)
          setAuthed(true)
        }
      } catch (err) {
        console.error('Auth failed:', err)
        setAuthError(err.message || 'Authentication failed. The API server may be unavailable.')
      } finally {
        setAuthLoading(false)
      }
    }

    doAuth()
  }, [connectedWallet, authed, authLoading, authError, evmAccount.chainId, signMessageAsync, solWallet])

  useEffect(() => {
    if (!authed) return
    api.getProfile().then((p) => {
      updateProfile({
        name: p.name || '',
        avatarUrl: p.avatar_url || '',
        xHandle: p.x_handle || '',
        linkedinUrl: p.linkedin_url || '',
      })
    }).catch(() => {})

    api.getSubscription().then(({ active }) => {
      if (active) setSubscription({
        plan: active.plan,
        validUntil: active.valid_until,
        asset: active.asset,
        method: active.method,
      })
    }).catch(() => {})

    api.getKeys().then((keys) => {
      setApiKeys(keys.filter((k) => !k.revoked_at).map((k) => ({
        id: k.id,
        keyPreview: k.key_preview + '...',
        createdAt: k.created_at,
        showFull: false,
      })))
    }).catch(() => {})
  }, [authed, updateProfile, setSubscription, setApiKeys])

  const handleProfileUpdate = useCallback(async (patch) => {
    updateProfile(patch)
    try {
      await api.updateProfile({
        name: patch.name,
        avatarUrl: patch.avatarUrl,
        xHandle: patch.xHandle,
        linkedinUrl: patch.linkedinUrl,
      })
    } catch (err) {
      console.error('Profile update failed:', err)
    }
  }, [updateProfile])

  const onPaymentSuccess = useCallback((plan, assetId, txHash) => {
    const asset = ASSETS.find((a) => a.id === assetId)
    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + 1)
    setSubscription({
      plan,
      validUntil: validUntil.toISOString(),
      asset: `${asset.label} (${asset.network})`,
      method: 'wallet',
      txHash,
    })
  }, [setSubscription])

  const { payWithWallet, paying, payError } = usePayment({ onSuccess: onPaymentSuccess })

  const handleSubscribe = useCallback(async (plan, assetId) => {
    await payWithWallet(plan, assetId)
  }, [payWithWallet])

  const handleCreateKey = useCallback(async () => {
    try {
      const { id, key, createdAt } = await api.createKey()
      return { id, key, createdAt }
    } catch {
      const key = `mica_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
      return { id: crypto.randomUUID(), key, createdAt: new Date().toISOString() }
    }
  }, [])

  const handleRevokeKey = useCallback(async (id) => {
    revokeApiKey(id)
    try { await api.revokeKey(id) } catch {}
  }, [revokeApiKey])

  const handleDisconnect = useCallback(() => {
    setToken(null)
    setAuthed(false)
    if (evmAccount.isConnected) evmDisconnect()
    if (solWallet.connected) solWallet.disconnect()
  }, [evmAccount.isConnected, evmDisconnect, solWallet])

  if (!connectedWallet) {
    return <ConnectWalletScreen />
  }

  if (authLoading) {
    return (
      <div className="noise-overlay min-h-screen bg-cream flex items-center justify-center">
        <p className="font-mono text-sm text-gray-500 tracking-[0.2em]">Verifying wallet...</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="noise-overlay min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <span className="inline-block w-2.5 h-2.5 bg-red-mica mb-4" />
          <p className="font-mono text-sm text-gray-700 mb-2">Authentication failed</p>
          <p className="font-mono text-[11px] text-gray-500 mb-6">{authError}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="font-mono text-[10px] tracking-[0.18em] uppercase py-2.5 px-5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="font-mono text-[10px] tracking-[0.18em] uppercase py-2.5 px-5 border border-dashed border-[var(--gray-border)] text-gray-600 hover:text-red-mica transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="noise-overlay min-h-screen bg-cream">
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 bg-red-mica shrink-0" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500 uppercase">Dashboard</p>
            </div>
            <h1 className="font-display font-extralight text-3xl text-gray-900">Use Mica</h1>
          </div>
          <div className="flex items-center gap-3">
            {evmAccount.isConnected && <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />}
            <button
              type="button"
              onClick={handleDisconnect}
              className="font-mono text-[10px] tracking-[0.15em] text-gray-400 hover:text-red-mica transition-colors border border-dashed border-[var(--gray-border)] px-4 py-2 clip-corner-tr-sm"
            >
              Disconnect
            </button>
          </div>
        </div>

        <section className="mb-10">
          <ProfileCard wallet={connectedWallet} profile={profile} onUpdate={handleProfileUpdate} />
        </section>

        <section className="mb-10">
          <PricingCards subscription={subscription} onSubscribe={handleSubscribe} paying={paying} payError={payError} />
        </section>

        <section className="mb-10">
          <ApiKeysSectionConnected
            apiKeys={apiKeys}
            onCreateKey={handleCreateKey}
            onRevokeKey={handleRevokeKey}
            hasActivePlan={!!subscription}
          />
        </section>

        <section className="mb-10">
          <BillingSection subscription={subscription} />
        </section>

        <section className="mb-10">
          <MvmNodeSection hasActivePlan={!!subscription} />
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2 h-2 bg-red-mica shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">Resources</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/whitepaper#api"
              className="block p-5 border border-dashed border-[var(--gray-border)] bg-white/40 hover:border-[var(--gray-border-dark)] transition-colors clip-corner-tr-sm">
              <p className="font-display font-light text-gray-900 mb-1">API Documentation</p>
              <p className="font-mono text-[11px] text-gray-500">Endpoints, authentication, and examples.</p>
            </Link>
            <a href="https://x.com/micadotenergy" target="_blank" rel="noopener noreferrer"
              className="block p-5 border border-dashed border-[var(--gray-border)] bg-white/40 hover:border-[var(--gray-border-dark)] transition-colors clip-corner-tr-sm">
              <p className="font-display font-light text-gray-900 mb-1">Support</p>
              <p className="font-mono text-[11px] text-gray-500">Reach out for help or questions.</p>
            </a>
          </div>
        </section>

        <footer className="pt-8 border-t border-dashed border-[var(--gray-border)]">
          <p className="font-mono text-[10px] text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Mica Energy &middot; All rights reserved
          </p>
        </footer>
      </div>
    </div>
  )
}

function ApiKeysSectionConnected({ apiKeys, onCreateKey, onRevokeKey, hasActivePlan }) {
  const [justCreated, setJustCreated] = useState(null)
  const [keys, setKeys] = useState(apiKeys)

  useEffect(() => { setKeys(apiKeys) }, [apiKeys])

  const handleCreate = async () => {
    const result = await onCreateKey()
    if (result?.key) {
      setJustCreated(result.key)
      setKeys((prev) => [
        { id: result.id, keyPreview: result.key.slice(0, 12) + '...', createdAt: result.createdAt, showFull: true },
        ...prev,
      ])
      setTimeout(() => setJustCreated(null), 20000)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-red-mica shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">API Keys</p>
        </div>
        <button type="button" onClick={handleCreate} disabled={!hasActivePlan}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          + Create key
        </button>
      </div>

      {!hasActivePlan && (
        <p className="font-mono text-[11px] text-gray-400 mb-4">Subscribe to a plan to generate API keys.</p>
      )}

      {justCreated && (
        <div className="mb-4 p-4 border border-red-mica/30 bg-red-mica/[0.03]">
          <p className="font-mono text-[10px] tracking-[0.15em] text-red-mica uppercase mb-2">
            Key created — copy it now, it won&apos;t be shown again
          </p>
          <code className="block font-mono text-[12px] text-gray-800 break-all select-all bg-white/60 px-3 py-2 border border-dashed border-[var(--gray-border)]">
            {justCreated}
          </code>
        </div>
      )}

      <div className="space-y-2">
        {keys.length === 0 && hasActivePlan && (
          <p className="font-mono text-[11px] text-gray-400 py-4">No API keys yet. Create one above.</p>
        )}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed border-[var(--gray-border)] bg-white/40">
            <div className="min-w-0">
              <code className="font-mono text-[12px] text-gray-700 truncate block">{k.keyPreview}</code>
              <span className="font-mono text-[9px] text-gray-400">{new Date(k.createdAt).toLocaleDateString()}</span>
            </div>
            <button type="button" onClick={() => onRevokeKey(k.id)}
              className="shrink-0 font-mono text-[10px] tracking-[0.15em] text-gray-400 hover:text-red-mica transition-colors">
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AppDashboard() {
  return (
    <WalletProviders>
      <DashboardInner />
    </WalletProviders>
  )
}
