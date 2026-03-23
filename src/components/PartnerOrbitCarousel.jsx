import { forwardRef, useRef, useEffect, useImperativeHandle, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PARTNERS } from '../content/partnerOrbitPlaceholders'

const SLOTS = PARTNERS.length

function orbitDimsForWidth(w) {
  if (w < 360) return { r: 72, logo: 36, pad: 36 }
  if (w < 400) return { r: 84, logo: 40, pad: 40 }
  if (w < 640) return { r: 172, logo: 58, pad: 64 }
  if (w < 1024) return { r: 218, logo: 64, pad: 80 }
  return { r: 258, logo: 70, pad: 96 }
}

const PartnerOrbitCarousel = forwardRef(function PartnerOrbitCarousel(
  { variant = 'light', className = '' },
  ref,
) {
  const wrapperRef = useRef(null)
  const spinnerRef = useRef(null)
  const slotRefs = useRef([])

  const [dims, setDims] = useState(() =>
    typeof window !== 'undefined'
      ? orbitDimsForWidth(window.innerWidth)
      : { r: 258, logo: 70, pad: 96 },
  )

  const onResize = useCallback(() => {
    setDims(orbitDimsForWidth(window.innerWidth))
  }, [])

  useEffect(() => {
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [onResize])

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [dims])

  useImperativeHandle(ref, () => wrapperRef.current)

  const isDark = variant === 'dark'
  const { r: radiusPx, logo: logoPx, pad: ringPadding } = dims
  const ringSize = radiusPx * 2 + logoPx + ringPadding

  useEffect(() => {
    const spinner = spinnerRef.current
    if (!spinner) return

    const angles = PARTNERS.map((_, i) => i * (360 / SLOTS))

    slotRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { xPercent: -50, yPercent: -50, rotation: -angles[i] })
    })

    gsap.set(spinner, { rotation: 0, x: '-50%', y: '-50%' })

    const tween = gsap.to(spinner, {
      rotation: 360,
      duration: 60,
      ease: 'none',
      repeat: -1,
      onUpdate() {
        const rot = this.progress() * 360
        slotRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { xPercent: -50, yPercent: -50, rotation: -(angles[i] + rot) })
        })
      },
    })

    return () => {
      tween.kill()
    }
  }, [radiusPx, logoPx])

  return (
    <div
      ref={wrapperRef}
      className={`mx-auto max-w-full min-w-0 transition-transform duration-500 ease-out hover:scale-105 sm:hover:scale-110 ${className}`}
    >
      <div
        className="relative mx-auto max-w-full"
        style={{ width: ringSize, height: ringSize }}
      >
        <div
          ref={spinnerRef}
          className="pointer-events-none absolute left-1/2 top-1/2"
          aria-hidden
        >
          {PARTNERS.map((partner, i) => {
            const deg = i * (360 / SLOTS)
            return (
              <div
                key={partner.name}
                className="absolute left-0 top-0"
                style={{
                  transform: `rotate(${deg}deg) translateY(-${radiusPx}px)`,
                  transformOrigin: '0 0',
                }}
              >
                <div
                  ref={(el) => { slotRefs.current[i] = el }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-black/[0.05] ${
                      isDark ? 'bg-white/[0.12] ring-white/12' : 'bg-white/90'
                    }`}
                    style={{ width: logoPx, height: logoPx }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="block h-full w-full rounded-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <span
                    className={`mt-1.5 sm:mt-2 max-w-[5.5rem] sm:max-w-none whitespace-normal sm:whitespace-nowrap text-center font-sans text-[8px] sm:text-[9px] font-medium tracking-wide leading-tight ${isDark ? 'text-white' : 'text-black'}`}
                  >
                    {partner.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default PartnerOrbitCarousel
