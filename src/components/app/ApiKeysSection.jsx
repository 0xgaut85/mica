import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ApiKeysSection({ apiKeys, onCreate, onRevoke, onDismissFullKey, hasActivePlan }) {
  const [justCreated, setJustCreated] = useState(null)

  const handleCreate = () => {
    const key = onCreate()
    setJustCreated(key)
    setTimeout(() => setJustCreated(null), 20000)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-red-mica shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">API Keys</p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!hasActivePlan}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          + Create key
        </button>
      </div>

      {!hasActivePlan && (
        <p className="font-mono text-[11px] text-gray-400 mb-4">
          Subscribe to a plan to generate API keys.
        </p>
      )}

      <AnimatePresence>
        {justCreated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 border border-red-mica/30 bg-red-mica/[0.03]"
          >
            <p className="font-mono text-[10px] tracking-[0.15em] text-red-mica uppercase mb-2">
              Key created — copy it now, it won&apos;t be shown again
            </p>
            <code className="block font-mono text-[12px] text-gray-800 break-all select-all bg-white/60 px-3 py-2 border border-dashed border-[var(--gray-border)]">
              {justCreated}
            </code>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {apiKeys.length === 0 && hasActivePlan && (
          <p className="font-mono text-[11px] text-gray-400 py-4">No API keys yet. Create one above.</p>
        )}

        {apiKeys.map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed border-[var(--gray-border)] bg-white/40"
          >
            <div className="min-w-0">
              <code className="font-mono text-[12px] text-gray-700 truncate block">
                {k.keyPreview}
              </code>
              <span className="font-mono text-[9px] text-gray-400">
                {new Date(k.createdAt).toLocaleDateString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onRevoke(k.id)}
              className="shrink-0 font-mono text-[10px] tracking-[0.15em] text-gray-400 hover:text-red-mica transition-colors"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
