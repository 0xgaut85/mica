import { useState } from 'react'
import { motion } from 'framer-motion'
import { springSnappy } from '../../constants/motion'
import { PLANS, ASSETS } from './useAppStore'

export default function PricingCards({ subscription, onSubscribe, paying, payError }) {
  const [selectedAsset, setSelectedAsset] = useState('usdc_base')

  const plans = [
    { key: 'basic', ...PLANS.basic },
    { key: 'premium', ...PLANS.premium },
    { key: 'enterprise', ...PLANS.enterprise },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="w-2 h-2 bg-red-mica shrink-0" />
        <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">Choose your plan</p>
      </div>

      {!subscription && (
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 mb-2">Settlement asset</p>
          <div className="flex gap-2">
            {ASSETS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAsset(a.id)}
                className={`font-mono text-[11px] px-3 py-1.5 border border-dashed transition-colors ${
                  selectedAsset === a.id
                    ? 'border-red-mica text-red-mica bg-red-mica/5'
                    : 'border-[var(--gray-border)] text-gray-500 hover:border-gray-400'
                }`}
              >
                {a.icon} {a.label} <span className="text-[9px] text-gray-400">({a.network})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isActive = subscription?.plan === plan.key
          const isEnterprise = plan.key === 'enterprise'

          return (
            <div
              key={plan.key}
              className={`relative border border-dashed p-6 flex flex-col ${
                isActive
                  ? 'border-red-mica bg-red-mica/[0.03]'
                  : 'border-[var(--gray-border)] bg-white/40'
              } ${plan.key === 'premium' ? 'clip-corner-tr' : plan.key === 'basic' ? 'clip-corner-bl' : ''}`}
            >
              {isActive && (
                <span className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.2em] text-red-mica uppercase">
                  Active
                </span>
              )}

              <p className="font-display font-light text-xl text-gray-900 mb-1">{plan.name}</p>
              <p className="font-display font-extralight text-3xl text-gray-900 mb-4">
                {plan.price ? `$${plan.price}` : 'Custom'}
                {plan.price && <span className="text-base text-gray-500 font-mono"> / mo</span>}
              </p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="font-mono text-[12px] text-gray-600 flex items-start gap-2">
                    <span className="text-red-mica mt-0.5 shrink-0">+</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isEnterprise ? (
                <a
                  href="mailto:contact@mica.energy?subject=Enterprise%20%E2%80%94%20mica%20API"
                  className="block text-center font-mono text-[10px] tracking-[0.18em] uppercase py-3 border border-dashed border-[var(--gray-border)] text-gray-600 hover:text-red-mica hover:border-red-mica/40 transition-colors"
                >
                  Contact us
                </a>
              ) : isActive ? (
                <p className="text-center font-mono text-[10px] tracking-[0.18em] text-gray-400 py-3">
                  Current plan
                </p>
              ) : (
                <div className="space-y-2">
                  <motion.button
                    type="button"
                    onClick={() => onSubscribe(plan.key, selectedAsset)}
                    disabled={paying}
                    className="w-full font-mono text-[10px] tracking-[0.18em] uppercase py-3 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-40"
                    whileTap={{ scale: 0.98 }}
                    transition={springSnappy}
                  >
                    {paying ? 'Processing...' : 'Pay with wallet'}
                  </motion.button>
                  {payError && (
                    <p className="font-mono text-[10px] text-red-mica mt-1">{payError}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
