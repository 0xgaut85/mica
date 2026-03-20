import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Pins a section and returns a GSAP timeline wired to scroll.
 * Animations are scrubbed continuously; no snap between steps.
 *
 * Usage:
 *   const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 4 })
 *   useEffect(() => { if (!ready) return; timeline.current.addLabel('step1').to(...) }, [ready])
 *
 * @param {React.RefObject} sectionRef
 * @param {Object} opts
 * @param {number} opts.steps - number of animation steps (labels)
 * @param {number} opts.pxPerStep - scroll distance per step (default 800)
 * @param {string} opts.start - ScrollTrigger start position
 * @param {boolean|number} opts.scrub - ScrollTrigger scrub (true, or seconds of smoothing lag)
 */
export function useSectionTimeline(sectionRef, {
  steps = 3,
  pxPerStep = 800,
  start = 'top top',
  scrub = true,
} = {}) {
  const timeline = useRef(null)
  const ctx = useRef(null)
  const readyRef = useRef(false)

  useEffect(() => {
    const el = sectionRef?.current
    if (!el) return

    ctx.current = gsap.context(() => {
      timeline.current = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          pin: true,
          anticipatePin: 1,
          start,
          end: `+=${steps * pxPerStep}`,
          scrub,
          invalidateOnRefresh: true,
        },
      })

      timeline.current.addLabel('start')
      readyRef.current = true
    })

    return () => {
      ctx.current?.revert()
      readyRef.current = false
    }
  }, [sectionRef, steps, pxPerStep, start, scrub])

  return { timeline, ready: readyRef }
}
