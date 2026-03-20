import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnappy } from '../constants/motion'
import { LEGAL_DOCUMENTS } from '../content/legal'
import LegalDocumentPane from './LegalDocumentPane'

export default function LegalModal({ doc, onClose }) {
  const open = Boolean(doc && LEGAL_DOCUMENTS[doc])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const meta = doc ? LEGAL_DOCUMENTS[doc] : null

  return (
    <AnimatePresence>
      {open && meta && (
        <motion.div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-2xl max-h-[min(92vh,880px)] flex flex-col border border-gray-400/50 bg-cream noise-overlay depth-shadow clip-corner-both shadow-[0_24px_80px_rgba(0,0,0,0.18)] z-10"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={springSnappy}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 dot-grid-fine opacity-[0.12] pointer-events-none" />
            <div className="relative z-10 p-7 sm:p-9 md:p-10 flex flex-col min-h-0 flex-1">
              <LegalDocumentPane
                titleId="legal-modal-title"
                title={meta.title}
                body={meta.body}
                showClose
                onClose={onClose}
                className="flex-1 min-h-0"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
