import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { springSnappy, tapSm, hoverLift } from '../constants/motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import IntersectionStar from './IntersectionStar'

const sentences = [
  'Deploy AI agents on the most efficient energy grid.',
  'One API call is all it takes.',
]

export default function CallToAction() {
  const sectionRef = useRef(null)
  const darkBlockRef = useRef(null)
  const labelRowRef = useRef(null)
  const labelLineRef = useRef(null)
  const labelTextRef = useRef(null)
  const headingRef = useRef(null)
  const sentenceRefs = useRef([])
  const descRef = useRef(null)
  const btn1Ref = useRef(null)
  const btn2Ref = useRef(null)

  const hLineRef = useRef(null)
  const vLineRef = useRef(null)
  const starRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 5, pxPerStep: 800 })

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current
    const LINE_GAP = 16
    const sRect = sectionRef.current.getBoundingClientRect()

    const labelBottom = labelRowRef.current.getBoundingClientRect().bottom
    const headingTop = headingRef.current.getBoundingClientRect().top
    const hY = ((labelBottom + headingTop) / 2) - sRect.top

    const headingRight = headingRef.current.getBoundingClientRect().right
    const vX = headingRight - sRect.left + LINE_GAP
    // Run full section height so the line meets the bottom background image
    const vLineHeight = Math.max(1, sRect.height)

    const applyLayoutOnly = () => {
      const el = sectionRef.current
      if (!el || !hLineRef.current || !vLineRef.current || !starRef.current) return
      const sr = el.getBoundingClientRect()
      const lb = labelRowRef.current.getBoundingClientRect().bottom
      const ht = headingRef.current.getBoundingClientRect().top
      const hy = ((lb + ht) / 2) - sr.top
      const hr = headingRef.current.getBoundingClientRect().right
      const vx = hr - sr.left + LINE_GAP
      const vh = Math.max(1, sr.height)
      gsap.set(hLineRef.current, { top: hy, transformOrigin: 'left center' })
      gsap.set(vLineRef.current, { left: vx, top: 0, height: vh, transformOrigin: 'top center' })
      gsap.set(starRef.current, { top: hy - 8, left: vx - 8 })
      ScrollTrigger.refresh()
    }

    gsap.set(hLineRef.current, { top: hY, scaleX: 0, transformOrigin: 'left center' })
    gsap.set(vLineRef.current, {
      left: vX,
      top: 0,
      height: vLineHeight,
      scaleY: 0,
      transformOrigin: 'top center',
    })
    gsap.set(starRef.current, { top: hY - 8, left: vX - 8, scale: 0, opacity: 0 })

    const onResize = () => applyLayoutOnly()
    window.addEventListener('resize', onResize)

    gsap.set(darkBlockRef.current, { clipPath: 'inset(100% 0 0 0)' })
    gsap.set(labelLineRef.current, { scale: 0, transformOrigin: 'center center' })
    gsap.set(labelTextRef.current, { opacity: 0 })
    sentenceRefs.current.forEach(el => {
      if (el) gsap.set(el, { y: '100%', opacity: 0 })
    })
    gsap.set(descRef.current, { opacity: 0, y: 15 })
    gsap.set(btn1Ref.current, { opacity: 0, scale: 0.8 })
    gsap.set(btn2Ref.current, { opacity: 0, scale: 0.8 })

    // Step 1: curtain reveal + H-line draws
    tl.addLabel('reveal')
      .to(darkBlockRef.current, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'expo.inOut' })
      .to(hLineRef.current, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, '<0.5')

    // Step 2: V-line draws + star pops
    tl.addLabel('lines')
      .to(vLineRef.current, { scaleY: 1, duration: 0.7, ease: 'expo.out' })
      .to(starRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)' }, '<0.3')

    // Step 3: heading
    tl.addLabel('heading')
      .to(labelLineRef.current, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
      .to(labelTextRef.current, { opacity: 1, duration: 0.3 }, '<0.15')

    sentenceRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { y: '0%', opacity: 1, duration: 0.5, ease: 'expo.out' }, i === 0 ? '<0.2' : '<0.1')
    })

    // Step 4: description
    tl.addLabel('desc')
      .to(descRef.current, { opacity: 1, y: 0, duration: 0.4 })

    // Step 5: buttons
    tl.addLabel('buttons')
      .to(btn1Ref.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' })
      .to(btn2Ref.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, '<0.15')

    tl.addLabel('end')

    return () => window.removeEventListener('resize', onResize)
  }, [ready, timeline])

  return (
    <section id="cta" ref={sectionRef} className="section-snap">
      <div ref={darkBlockRef} className="absolute inset-0 overflow-hidden noise-overlay-dark" style={{ backgroundColor: '#060606', clipPath: 'inset(100% 0 0 0)' }}>
        {/* White dashed lines: H between label and heading, V at heading right edge */}
        <div ref={hLineRef} className="absolute left-0 w-full border-dashed-t-white z-[15] pointer-events-none" />
        <div ref={vLineRef} className="absolute top-0 w-0 border-dashed-l-white z-[15] pointer-events-none" />
        <IntersectionStar ref={starRef} dark className="absolute z-[16] pointer-events-none" />
        <img
          src="/cta-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md pointer-events-none"
          onError={(e) => { e.target.src = '/datacenter.jpeg' }}
        />
      </div>

      <div className="relative z-10 px-8 md:px-16 lg:px-24 py-20 sm:py-28 md:py-36 min-h-0 h-full flex items-center">
        <div>
          <div ref={labelRowRef} className="flex items-center gap-4 mb-8">
            <span ref={labelLineRef} className="w-2.5 h-2.5 bg-white/40" />
            <p ref={labelTextRef} className="font-mono text-[10px] tracking-[0.3em] text-white/55">
              Start building with mica
            </p>
          </div>

          <h2 ref={headingRef} className="font-display font-extralight text-[clamp(1.75rem,6.5vw,6rem)] sm:text-5xl md:text-7xl lg:text-[6rem] text-white leading-[1.08] max-w-5xl mb-8 sm:mb-12">
            {sentences.map((sentence, i) => (
              <span key={i} className="block overflow-hidden">
                <span ref={(el) => { sentenceRefs.current[i] = el }} className="block">
                  {sentence}
                </span>
              </span>
            ))}
          </h2>

          <p ref={descRef} className="font-mono text-[12px] text-white/65 leading-[1.8] max-w-xl mb-12">
            mica replaces expensive, centralized compute with a blockchain-coordinated network that routes AI agent workloads to the cheapest energy, verified on-chain, settled in seconds.
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.a
              ref={btn1Ref}
              href="#"
              className="inline-block bg-white text-[#060606] font-display font-light text-sm tracking-[0.15em] px-8 py-4 sm:px-10 sm:py-5 clip-corner-tr-sm cursor-pointer touch-manipulation"
              whileHover={hoverLift}
              whileTap={tapSm}
              transition={springSnappy}
            >
              Request access
            </motion.a>
            <motion.a
              ref={btn2Ref}
              href="#"
              className="inline-block text-white font-display font-light text-sm tracking-[0.15em] px-8 py-4 sm:px-10 sm:py-5 cursor-pointer relative touch-manipulation"
              whileHover={hoverLift}
              whileTap={tapSm}
              transition={springSnappy}
              style={{ border: '1px dashed rgba(255,255,255,0.4)' }}
            >
              Read the documentation
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
