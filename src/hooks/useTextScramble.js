import { useState, useCallback, useRef, useEffect } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const TICK = 50

export function useTextScramble(targetText, { autoStart = true, duration = 1200, delay = 0 } = {}) {
  const [display, setDisplay] = useState(targetText)
  const intervalRef = useRef(null)
  const mountedRef = useRef(true)
  const isStoppedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const scramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    isStoppedRef.current = false

    const chars = targetText.split('')
    const len = chars.length
    const totalTicks = Math.max(8, Math.floor(duration / TICK))
    const scramblePhase = 3
    let tick = 0

    intervalRef.current = setInterval(() => {
      if (isStoppedRef.current || !mountedRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        return
      }

      tick++

      const progress = Math.min(1, Math.max(0, (tick - scramblePhase) / (totalTicks - scramblePhase)))
      const resolvedUpTo = Math.floor(progress * len)

      const result = chars.map((char, i) => {
        if (char === ' ' || char === '.' || char === ',') return char
        if (i < resolvedUpTo) return char
        if (tick <= scramblePhase) {
          return tick <= 1 ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      })

      setDisplay(result.join(''))

      if (resolvedUpTo >= len) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setDisplay(targetText)
      }
    }, TICK)
  }, [targetText, duration])

  useEffect(() => {
    if (!autoStart || !targetText) return

    setDisplay(targetText.replace(/[^ .,]/g, ' '))

    const timer = setTimeout(() => {
      if (mountedRef.current) scramble()
    }, delay)

    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    isStoppedRef.current = true
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setDisplay(targetText)
  }, [targetText])

  return { display, scramble, stop }
}
