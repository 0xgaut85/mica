import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnappy, tapSm, hoverLift } from '../constants/motion'
import LegalDocumentPane from './LegalDocumentPane'
import { TERMS_TITLE, PRIVACY_TITLE, CONDITIONS_TITLE, TERMS_BODY, PRIVACY_BODY, CONDITIONS_BODY } from '../content/legal'

const STORAGE_KEY = 'mica-consent-v1'

function readAccepted() {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const PANEL_MAP = {
  terms: { title: TERMS_TITLE, body: TERMS_BODY },
  privacy: { title: PRIVACY_TITLE, body: PRIVACY_BODY },
  conditions: { title: CONDITIONS_TITLE, body: CONDITIONS_BODY },
}

export default function ConsentGate({ children }) {
  const [accepted, setAccepted] = useState(readAccepted)
  const [checked, setChecked] = useState(false)
  const [panel, setPanel] = useState(null)

  const confirm = () => {
    if (!checked) return
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
    setAccepted(true)
  }

  const panelMeta = panel ? PANEL_MAP[panel] : null

  return (
    <>
      <div
        className={`transition-[filter] duration-500 ease-out ${accepted ? '' : 'blur-md pointer-events-none select-none'}`}
        aria-hidden={!accepted}
      >
        {children}
      </div>

      <AnimatePresence>
        {!accepted && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
          >
            <motion.div
              className="w-full max-w-xl border border-gray-400/60 bg-cream noise-overlay depth-shadow clip-corner-tr relative overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={springSnappy}
            >
              <div className="absolute inset-0 dot-grid-fine opacity-[0.14] pointer-events-none" />
              <div className="relative z-10 p-8 md:p-10">
                {!panel && (
                  <>
                    <p className="font-mono text-[10px] tracking-[0.28em] text-gray-600 mb-4">
                      Before you continue
                    </p>
                    <h2 id="consent-title" className="font-display font-extralight text-2xl md:text-3xl text-gray-950 leading-tight mb-5">
                      Terms &amp; privacy
                    </h2>
                    <p className="font-mono text-[13px] text-gray-800 leading-[1.85] mb-7">
                      mica provides distributed, energy-aware infrastructure for AI training. By using this site you agree to our{' '}
                      <button
                        type="button"
                        className="text-red-mica font-medium underline underline-offset-[3px] decoration-red-mica/50 hover:decoration-red-mica touch-manipulation"
                        onClick={() => setPanel('terms')}
                      >
                        Terms of Service
                      </button>
                      ,{' '}
                      <button
                        type="button"
                        className="text-red-mica font-medium underline underline-offset-[3px] decoration-red-mica/50 hover:decoration-red-mica touch-manipulation"
                        onClick={() => setPanel('privacy')}
                      >
                        Privacy Policy
                      </button>
                      , and{' '}
                      <button
                        type="button"
                        className="text-red-mica font-medium underline underline-offset-[3px] decoration-red-mica/50 hover:decoration-red-mica touch-manipulation"
                        onClick={() => setPanel('conditions')}
                      >
                        Acceptable use
                      </button>
                      . Open any link to read the full text before you confirm.
                    </p>
                    <label className="flex items-start gap-3.5 cursor-pointer group mb-8 touch-manipulation">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        className="mt-1 w-4 h-4 shrink-0 accent-red-mica border-gray-400 rounded-sm"
                      />
                      <span className="font-mono text-[12px] sm:text-[13px] text-gray-900 leading-[1.75]">
                        I have read and agree to the Terms of Service, Privacy Policy, and acceptable use conditions.
                      </span>
                    </label>
                    <motion.button
                      type="button"
                      disabled={!checked}
                      onClick={confirm}
                      whileTap={checked ? tapSm : undefined}
                      whileHover={checked ? hoverLift : undefined}
                      transition={springSnappy}
                      className={`w-full py-3.5 font-mono text-[11px] tracking-[0.22em] uppercase clip-corner-bl border transition-colors duration-200 ${
                        checked
                          ? 'bg-red-mica text-white border-red-mica hover:bg-red-mica/90'
                          : 'bg-gray-200/80 text-gray-500 border-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Confirm &amp; enter site
                    </motion.button>
                  </>
                )}
                {panel && panelMeta && (
                  <LegalDocumentPane
                    title={panelMeta.title}
                    body={panelMeta.body}
                    onBack={() => setPanel(null)}
                    scrollClassName="!max-h-[min(72vh,540px)] sm:!max-h-[min(76vh,580px)]"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
