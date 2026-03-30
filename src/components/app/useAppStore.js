import { useState, useCallback } from 'react'

const PLANS = {
  basic: { name: 'Basic', price: 40, features: ['1,000 API calls / month', 'Standard routing', 'Email support'] },
  premium: { name: 'Premium', price: 150, features: ['25,000 API calls / month', 'Priority routing', 'Dedicated support', 'Webhook events', 'Analytics dashboard'] },
  enterprise: { name: 'Enterprise', price: null, features: ['Unlimited API calls', 'Custom routing rules', 'SLA guarantee', 'Dedicated infra', 'On-chain audit trail', '24/7 support'] },
}

const ASSETS = [
  { id: 'usdc_base', label: 'USDC', network: 'Base', icon: '◈' },
  { id: 'eth', label: 'ETH', network: 'Ethereum', icon: 'Ξ' },
  { id: 'sol', label: 'SOL', network: 'Solana', icon: '◎' },
]

export { PLANS, ASSETS }

export function useAppStore() {
  const [wallet, setWallet] = useState(null)
  const [profile, setProfile] = useState({ name: '', avatarUrl: '', xHandle: '', linkedinUrl: '' })
  const [subscription, setSubscription] = useState(null)
  const [apiKeys, setApiKeys] = useState([])
  const [view, setView] = useState('dashboard')

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const createApiKey = useCallback(() => {
    const key = `mica_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    const entry = {
      id: crypto.randomUUID(),
      keyPreview: `${key.slice(0, 12)}...${key.slice(-4)}`,
      fullKey: key,
      createdAt: new Date().toISOString(),
      showFull: true,
    }
    setApiKeys((prev) => [entry, ...prev])
    return key
  }, [])

  const revokeApiKey = useCallback((id) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id))
  }, [])

  const dismissFullKey = useCallback((id) => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, showFull: false } : k)))
  }, [])

  return {
    wallet, setWallet,
    profile, setProfile, updateProfile,
    subscription, setSubscription,
    apiKeys, setApiKeys, createApiKey, revokeApiKey, dismissFullKey,
    view, setView,
  }
}
