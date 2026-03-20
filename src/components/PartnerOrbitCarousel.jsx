import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { gsap } from 'gsap'
import { PARTNERS } from '../content/partnerOrbitPlaceholders'

const SLOTS = PARTNERS.length
/** Orbit radius: larger = more space between logos on the ring */
const RADIUS_PX = 258
/** Circular logo diameter */
const LOGO_PX = 70

const PartnerOrbitCarousel = forwardRef(function PartnerOrbitCarousel(
  { variant = 'light', className = '' },
  ref,
) {
  const wrapperRef = useRef(null)
  const spinnerRef = useRef(null)
  const slotRefs = useRef([])

  useImperativeHandle(ref, () => wrapperRef.current)

  const isDark = variant === 'dark'

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
        const r = this.progress() * 360
        slotRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { xPercent: -50, yPercent: -50, rotation: -(angles[i] + r) })
        })
      },
    })

    return () => {
      tween.kill()
    }
  }, [])

  const ringSize = RADIUS_PX * 2 + LOGO_PX + 96

  return (
    <div
      ref={wrapperRef}
      className={`transition-transform duration-500 ease-out hover:scale-110 ${className}`}
    >
      <div
        className="relative mx-auto"
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
                  transform: `rotate(${deg}deg) translateY(-${RADIUS_PX}px)`,
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
                    style={{ width: LOGO_PX, height: LOGO_PX }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="block h-full w-full rounded-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <span
                    className={`mt-2 whitespace-nowrap text-center font-sans text-[9px] font-medium tracking-wide leading-none ${isDark ? 'text-white' : 'text-black'}`}
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
