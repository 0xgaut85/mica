import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProfileCard({ wallet, profile, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  const save = () => {
    onUpdate(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(profile)
    setEditing(false)
  }

  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/50 p-6 clip-corner-tr relative">
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-gray-200 border border-dashed border-[var(--gray-border)] flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="font-display text-xl text-gray-400">
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display font-light text-lg text-gray-900 truncate">
            {profile.name || 'Anonymous'}
          </p>
          <p className="font-mono text-[11px] text-gray-500 truncate mt-0.5">
            {wallet.address}
          </p>
          <p className="font-mono text-[9px] tracking-[0.15em] text-gray-400 mt-1">
            {wallet.chain} &middot; {wallet.wallet}
          </p>

          {(profile.xHandle || profile.linkedinUrl) && (
            <div className="flex gap-4 mt-2">
              {profile.xHandle && (
                <a
                  href={`https://x.com/${profile.xHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-gray-500 hover:text-red-mica transition-colors"
                >
                  @{profile.xHandle.replace('@', '')}
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-gray-500 hover:text-red-mica transition-colors"
                >
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setDraft(profile); setEditing(true) }}
          className="shrink-0 font-mono text-[10px] tracking-[0.15em] text-gray-500 hover:text-red-mica transition-colors border border-dashed border-[var(--gray-border)] px-3 py-1.5 clip-corner-tr-sm"
        >
          Edit
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-5 border-t border-dashed border-[var(--gray-border)] space-y-4">
              <Field label="Display name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
              <Field label="Avatar URL" value={draft.avatarUrl} onChange={(v) => setDraft({ ...draft, avatarUrl: v })} placeholder="https://..." />
              <Field label="X handle" value={draft.xHandle} onChange={(v) => setDraft({ ...draft, xHandle: v })} placeholder="@handle" />
              <Field label="LinkedIn URL" value={draft.linkedinUrl} onChange={(v) => setDraft({ ...draft, linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={save}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-gray-300 text-gray-600 hover:text-red-mica hover:border-red-mica/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] text-gray-500 uppercase">{label}</span>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 font-mono text-sm bg-cream border border-dashed border-[var(--gray-border)] focus:border-red-mica/50 focus:outline-none transition-colors"
      />
    </label>
  )
}
