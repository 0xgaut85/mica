import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Animates a dashed line (scaleX, scaleY, or opacity) from 0 to 1 on scroll-in.
 * @param {Object} options
 * @param {'h'|'v'|'diagonal'} options.orientation - 'h'=scaleX, 'v'=scaleY, 'diagonal'=opacity
 * @param {React.RefObject} options.lineRef - ref to the line element
 * @param {React.RefObject} options.triggerRef - ref to trigger element (or line ref for self)
 * @param {number} options.delay - delay in seconds
 * @param {string} options.start - ScrollTrigger start, e.g. "top 85%"
 * @param {boolean} options.scrub - if true, line draws in as user scrolls (scroll-linked)
 */
export function useDashedLineAnimation({
  orientation = 'h',
  lineRef,
  triggerRef,
  delay = 0,
  start = 'top 85%',
  scrub = false,
}) {
  useEffect(() => {
    const el = lineRef?.current
    const trigger = triggerRef?.current ?? el
    if (!el || !trigger) return

    const ctx = gsap.context(() => {
      const scrollVars = { trigger, start }
      if (scrub) scrollVars.scrub = 1.2
      else scrollVars.toggleActions = 'play none none none'

      if (orientation === 'diagonal') {
        gsap.fromTo(el, { opacity: 0 }, {
          opacity: 1,
          duration: scrub ? 1 : 0.6,
          ease: scrub ? 'none' : 'power2.out',
          delay: scrub ? 0 : delay,
          scrollTrigger: scrollVars,
        })
      } else {
        const scaleProp = orientation === 'h' ? 'scaleX' : 'scaleY'
        gsap.fromTo(el, { [scaleProp]: 0 }, {
          [scaleProp]: 1,
          duration: scrub ? 1 : 0.8,
          ease: scrub ? 'none' : 'power2.out',
          delay: scrub ? 0 : delay,
          scrollTrigger: scrollVars,
        })
      }
    })

    return () => ctx.revert()
  }, [orientation, lineRef, triggerRef, delay, start, scrub])
}
