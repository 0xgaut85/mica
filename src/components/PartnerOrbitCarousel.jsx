import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { gsap } from 'gsap'
import { PARTNERS } from '../content/partnerOrbitPlaceholders'

const SLOTS = PARTNERS.length
const RADIUS_PX = 182
const SQUARE_PX = 72

const PartnerOrbitCarousel = forwardRef(function PartnerOrbitCarousel(
  { variant = 'light', className = '' },
  ref,
) {
  const wrapperRef = useRef(null)
  const spinnerRef = useRef(null)
  const slotRefs = useRef([])

  useImperativeHandle(ref, () => wrapperRef.current)

  const isDark = variant === 'dark'
  const squareBorder = isDark
    ? 'border border-white/40 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
    : 'border border-gray-300/90 bg-white/90 shadow-sm'

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

  const ringSize = RADIUS_PX * 2 + SQUARE_PX + 80

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
                    className={`flex ${squareBorder} items-center justify-center overflow-hidden rounded-lg p-2`}
                    style={{ width: SQUARE_PX, height: SQUARE_PX }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="block h-full w-full object-contain"
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
