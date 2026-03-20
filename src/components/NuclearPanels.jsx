import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import {
  NUCLEAR_LEFT_LABEL,
  NUCLEAR_LEFT_TEASER,
  NUCLEAR_RIGHT_LABEL,
  NUCLEAR_RIGHT_TEASER,
} from '../content/nuclearTeasers'

const IMG = '/nuclear.jpeg'
const IMG_FALLBACK = '/datacenter.jpeg'

const CLIP_TL = 'polygon(0% 0%, 66% 0%, 0% 66%)'
const CLIP_BR = 'polygon(100% 100%, 34% 100%, 100% 34%)'
const CLIP_CENTER =
  'polygon(66% 0%, 100% 0%, 100% 34%, 34% 100%, 0% 100%, 0% 66%)'

const imgClass =
  'pointer-events-none absolute inset-0 h-full w-full object-cover select-none'

export default function NuclearPanels() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const containerRef = useRef(null)
  const tlPieceRef = useRef(null)
  const centerPieceRef = useRef(null)
  const brPieceRef = useRef(null)
  const leftTextRef = useRef(null)
  const rightTextRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, {
    steps: 5,
    pxPerStep: 800,
    scrub: 0.75,
  })

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tlEl = tlPieceRef.current
    const brEl = brPieceRef.current
    const leftEl = leftTextRef.current
    const rightEl = rightTextRef.current

    gsap.set(containerRef.current, { opacity: 0 })
    if (tlEl) gsap.set(tlEl, { x: 0, y: 0, transformOrigin: '0% 0%', force3D: true })
    if (brEl) gsap.set(brEl, { x: 0, y: 0, transformOrigin: '100% 100%', force3D: true })
    gsap.set([leftEl, rightEl].filter(Boolean), { opacity: 0 })

    if (reduce) {
      gsap.set(containerRef.current, { opacity: 1 })
      if (tlEl) gsap.set(tlEl, { xPercent: -55, yPercent: -50 })
      if (brEl) gsap.set(brEl, { xPercent: 55, yPercent: 50 })
      if (leftEl) gsap.set(leftEl, { opacity: 1 })
      if (rightEl) gsap.set(rightEl, { opacity: 1 })
      return
    }

    tl.addLabel('intro').to(containerRef.current, {
      opacity: 1,
      duration: 1,
      ease: 'sine.out',
    })

    tl.addLabel('tlDetach')
    if (tlEl) {
      tl.to(tlEl, {
        xPercent: -55,
        yPercent: -50,
        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        duration: 1.2,
        ease: 'power2.inOut',
      }, 'tlDetach')
    }

    tl.addLabel('tlText')
    if (leftEl) {
      tl.to(leftEl, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 'tlText+=0.15')
    }

    tl.addLabel('brDetach')
    if (brEl) {
      tl.to(brEl, {
        xPercent: 55,
        yPercent: 50,
        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
        duration: 1.2,
        ease: 'power2.inOut',
      }, 'brDetach')
    }

    tl.addLabel('brText')
    if (rightEl) {
      tl.to(rightEl, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 'brText+=0.15')
    }

    tl.addLabel('end')
  }, [ready, timeline])

  const onErr = (e) => { e.target.src = IMG_FALLBACK }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-hidden overflow-y-visible bg-cream"
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-8 md:px-12">
        <div
          ref={containerRef}
          className="relative z-[5] w-full max-w-[min(880px,96vw)]"
        >
          <div
            ref={stageRef}
            className="relative mx-auto aspect-video w-full"
          >
            <div className="pointer-events-none absolute inset-0 noise-overlay" aria-hidden />

            <div
              ref={tlPieceRef}
              className="absolute inset-0 z-[20] will-change-transform"
              style={{ clipPath: CLIP_TL, WebkitClipPath: CLIP_TL }}
            >
              <img src={IMG} alt="" className={imgClass} onError={onErr} draggable={false} />
            </div>

            <div
              ref={brPieceRef}
              className="absolute inset-0 z-[21] will-change-transform"
              style={{ clipPath: CLIP_BR, WebkitClipPath: CLIP_BR }}
            >
              <img src={IMG} alt="" className={imgClass} onError={onErr} draggable={false} />
            </div>

            <div
              ref={centerPieceRef}
              className="absolute inset-0 z-[10] will-change-transform"
              style={{ clipPath: CLIP_CENTER, WebkitClipPath: CLIP_CENTER }}
            >
              <img
                src={IMG}
                alt="Baseload energy infrastructure, always-on compute backbone"
                className={imgClass}
                onError={onErr}
                draggable={false}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/[0.05] via-transparent to-black/[0.08]"
                aria-hidden
              />
            </div>

            <div
              ref={leftTextRef}
              className="absolute z-[30] left-[1%] top-[4%] w-[min(31%,13rem)] sm:left-[2%] sm:top-[6%] sm:w-[min(29%,14rem)]"
            >
              <p className="mb-2 font-mono text-[7px] tracking-[0.26em] text-red-mica sm:text-[8px]">
                {NUCLEAR_LEFT_LABEL}
              </p>
              <p className="font-mono text-[9px] leading-[1.75] text-gray-800 sm:text-[10px] md:text-[11px]">
                {NUCLEAR_LEFT_TEASER}
              </p>
            </div>

            <div
              ref={rightTextRef}
              className="absolute z-[30] right-[1%] bottom-[4%] w-[min(31%,13rem)] text-right sm:right-[2%] sm:bottom-[6%] sm:w-[min(29%,14rem)]"
            >
              <p className="mb-2 font-mono text-[7px] tracking-[0.26em] text-red-mica sm:text-[8px]">
                {NUCLEAR_RIGHT_LABEL}
              </p>
              <p className="font-mono text-[9px] leading-[1.75] text-gray-800 sm:text-[10px] md:text-[11px]">
                {NUCLEAR_RIGHT_TEASER}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
