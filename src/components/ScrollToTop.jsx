import { useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Reset scroll on client-side navigation. Runs after the routed view is in the DOM.
 * useLayoutEffect: before paint, so users do not see a flash of wrong scroll position.
 */
function scrollToTopImmediate() {
  window.scrollTo(0, 0)
  if (typeof document !== 'undefined') {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
}

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    scrollToTopImmediate()
  }, [pathname])

  useEffect(() => {
    scrollToTopImmediate()
    const t = window.setTimeout(() => {
      scrollToTopImmediate()
      ScrollTrigger.refresh()
    }, 0)
    return () => window.clearTimeout(t)
  }, [pathname])

  return null
}
