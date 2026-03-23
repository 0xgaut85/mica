import { useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function scrollToTopImmediate() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    scrollToTopImmediate()
  }, [pathname])

  useEffect(() => {
    scrollToTopImmediate()
    const raf = requestAnimationFrame(() => {
      scrollToTopImmediate()
      ScrollTrigger.refresh()
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return null
}
