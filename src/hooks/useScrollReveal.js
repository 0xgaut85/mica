import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Scroll-triggered reveal with y offset and opacity. More dramatic than basic fade.
 * @param {Object} options
 * @param {React.RefObject} options.ref - element ref
 * @param {number} options.y - y offset from (e.g. 60 = slide up 60px)
 * @param {string} options.start - ScrollTrigger start
 * @param {number} options.duration - animation duration
 * @param {number} options.delay - delay
 */
export function useScrollReveal({
  ref,
  y = 50,
  start = 'top 88%',
  duration = 0.9,
  delay = 0,
}) {
  useEffect(() => {
    const el = ref?.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: 'play none none none',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [ref, y, start, duration, delay])
}
