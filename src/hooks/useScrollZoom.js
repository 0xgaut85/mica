import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Scroll-triggered scale/zoom animation. Element scales up as it enters viewport.
 * Use toScale slightly > 1 (e.g. 1.03) for a subtle "gasp" overshoot effect.
 * @param {Object} options
 * @param {React.RefObject} options.ref - element ref
 * @param {number} options.fromScale - starting scale (e.g. 0.9 for zoom-in)
 * @param {number} options.toScale - end scale (1 or 1.03 for gasp)
 * @param {string} options.start - ScrollTrigger start
 * @param {boolean} options.scrub - if true, animation is tied to scroll position
 * @param {number} options.duration - duration when not scrubbing
 */
export function useScrollZoom({
  ref,
  fromScale = 0.92,
  toScale = 1,
  start = 'top 90%',
  scrub = false,
  duration = 1,
}) {
  useEffect(() => {
    const el = ref?.current
    if (!el) return

    const ctx = gsap.context(() => {
      const vars = {
        scale: toScale,
        ease: scrub ? 'none' : 'power2.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: scrub ? undefined : 'play none none none',
        },
      }
      if (scrub) {
        vars.scrollTrigger.scrub = 1.5
      } else {
        vars.duration = duration
      }

      gsap.fromTo(el, { scale: fromScale }, vars)
    })

    return () => ctx.revert()
  }, [ref, fromScale, toScale, start, scrub, duration])
}
