import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import LegalModal from '../components/LegalModal'

const LegalDocsContext = createContext(null)

export function LegalDocsProvider({ children }) {
  const [doc, setDoc] = useState(null)

  const openLegal = useCallback((key) => {
    setDoc(key)
  }, [])

  const closeLegal = useCallback(() => setDoc(null), [])

  const value = useMemo(() => ({ openLegal, closeLegal }), [openLegal, closeLegal])

  return (
    <LegalDocsContext.Provider value={value}>
      {children}
      <LegalModal doc={doc} onClose={closeLegal} />
    </LegalDocsContext.Provider>
  )
}

export function useLegalDocs() {
  const ctx = useContext(LegalDocsContext)
  if (!ctx) {
    throw new Error('useLegalDocs must be used within LegalDocsProvider')
  }
  return ctx
}
