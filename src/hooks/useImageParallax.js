import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Ken Burns inner zoom: image scales down inside its container on scroll.
 * Container stays static, image inside slowly zooms out.
 * @param {Object} options
 * @param {React.RefObject} options.containerRef - ref to the overflow-hidden container
 * @param {number} options.fromScale - starting scale (e.g. 1.2)
 * @param {number} options.toScale - ending scale (e.g. 1)
 * @param {string} options.start - ScrollTrigger start
 * @param {string} options.end - ScrollTrigger end
 */
export function useImageParallax({
  containerRef,
  fromScale = 1.15,
  toScale = 1,
  start = 'top 85%',
  end = 'bottom 20%',
}) {
  useEffect(() => {
    const container = containerRef?.current
    if (!container) return

    const img = container.querySelector('img, video')
    if (!img) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { scale: fromScale },
        {
          scale: toScale,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start,
            end,
            scrub: 1.5,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [containerRef, fromScale, toScale, start, end])
}
