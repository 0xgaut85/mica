import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Reset scroll on client-side navigation. Without this, going from the long
 * pinned landing page to /careers keeps the old scrollY so the viewport can
 * show empty space below short pages until a full refresh.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}
