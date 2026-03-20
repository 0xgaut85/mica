import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { springSnappy, tapSm, hoverLift } from '../constants/motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import IntersectionStar from './IntersectionStar'

const statsData = [
  { val: '50%', label: 'Average reduction in compute energy costs' },
  { val: '1', label: 'Single API call to deploy' },
  { val: '100%', label: 'On-chain verified workloads' },
]

export default function Hero() {
  const sectionRef = useRef(null)
  const mediaRef = useRef(null)
  const labelRowRef = useRef(null)
  const redLineRef = useRef(null)
  const labelTextRef = useRef(null)
  const titleWrapperRef = useRef(null)
  const titleRef = useRef(null)
  const taglineRef = useRef(null)
  const btn1Ref = useRef(null)
  const btn2Ref = useRef(null)
  const statsRef = useRef(null)
  const statItemsRef = useRef([])
  const scrollLabelRef = useRef(null)
  const cornerRef = useRef(null)
  const videoRef = useRef(null)

  const hLineRef = useRef(null)
  const vLineRef = useRef(null)
  const starRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 6, pxPerStep: 800 })

  const setStatRef = useCallback((el, i) => {
    statItemsRef.current[i] = el
  }, [])

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current

    const LINE_GAP = 16

    const measureLineLayout = () => {
      const el = sectionRef.current
      if (!el) return null
      const sRect = el.getBoundingClientRect()
      const labelBottom = labelRowRef.current.getBoundingClientRect().bottom
      const titleTop = titleWrapperRef.current.getBoundingClientRect().top
      const hY = ((labelBottom + titleTop) / 2) - sRect.top
      const sectionW = sRect.width
      const targetW = Math.max(320, window.innerWidth * 0.5)
      const mediaW = Math.min(Math.max(0, sectionW - 24), targetW)
      const imageLeft = sectionW - mediaW - 24
      // Vertical guide sits in the gutter — image stays LINE_GAP to the right of the line
      const vLineX = imageLeft - LINE_GAP
      // V-line ends at the stats row top border (dashed line above “Open standard REST endpoints”)
      const statsTop = statsRef.current.getBoundingClientRect().top - sRect.top
      const vLineHeight = Math.max(1, statsTop)
      // Media lower + clear gap under the red H-line
      const mediaTop = Math.max(104, hY + LINE_GAP + 12)
      return { hY, vLineX, vLineHeight, mediaTop }
    }

    const layout = measureLineLayout()
    if (layout) {
      const { hY, vLineX, vLineHeight, mediaTop } = layout
      gsap.set(hLineRef.current, { top: hY, scaleX: 0, transformOrigin: 'left center' })
      gsap.set(vLineRef.current, {
        left: vLineX,
        top: 0,
        height: vLineHeight,
        scaleY: 0,
        transformOrigin: 'top center',
      })
      gsap.set(starRef.current, { top: hY - 8, left: vLineX - 8, scale: 0, opacity: 0 })
      gsap.set(mediaRef.current, { top: mediaTop })
    }

    const onResize = () => {
      const next = measureLineLayout()
      if (!next) return
      const { hY, vLineX, vLineHeight, mediaTop } = next
      gsap.set(hLineRef.current, { top: hY, transformOrigin: 'left center' })
      gsap.set(vLineRef.current, {
        left: vLineX,
        top: 0,
        height: vLineHeight,
        transformOrigin: 'top center',
      })
      gsap.set(starRef.current, { top: hY - 8, left: vLineX - 8 })
      gsap.set(mediaRef.current, { top: mediaTop })
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    gsap.set(mediaRef.current, { x: '110%', scale: 1.08, opacity: 1 })
    gsap.set(redLineRef.current, { scale: 0, transformOrigin: 'center center' })
    gsap.set(labelTextRef.current, { opacity: 0, x: -15 })
    // Title stays visible — only label row animates in after blueprint (avoids "missing title")
    gsap.set(taglineRef.current, { opacity: 0, filter: 'blur(6px)' })
    gsap.set(btn1Ref.current, { opacity: 0, y: 25, scale: 0.85 })
    gsap.set(btn2Ref.current, { opacity: 0, y: 25, scale: 0.85 })
    gsap.set(statsRef.current, { opacity: 0 })
    statItemsRef.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: 0, y: 20 + i * 8 })
    })
    gsap.set(scrollLabelRef.current, { opacity: 0 })
    gsap.set(cornerRef.current, { opacity: 0, scale: 0.4 })

    // Step 1: H-line draws left → right
    tl.addLabel('hline')
      .to(hLineRef.current, { scaleX: 1, duration: 1, ease: 'expo.out' })

    // Step 2: V-line draws top → bottom
    tl.addLabel('vline')
      .to(vLineRef.current, { scaleY: 1, duration: 0.8, ease: 'expo.out' })

    // Step 3: star pops at intersection + media slides in
    tl.addLabel('star')
      .to(starRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)' })
      .to(mediaRef.current, { x: '0%', scale: 1, duration: 1, ease: 'expo.out' }, '<0.2')
      .to(cornerRef.current, { opacity: 1, scale: 1, duration: 0.4 }, '<0.5')

    // Step 4: label row reveal (title "mica" already visible)
    tl.addLabel('title')
      .to(redLineRef.current, { scale: 1, duration: 0.5, ease: 'back.out(2)' })
      .to(labelTextRef.current, { opacity: 1, x: 0, duration: 0.4 }, '<0.2')

    // Step 5: tagline + buttons
    tl.addLabel('content')
      .to(taglineRef.current, { opacity: 1, filter: 'blur(0px)', duration: 0.5 })
      .to(btn1Ref.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '<0.1')
      .to(btn2Ref.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '<0.15')

    // Step 6: stats
    tl.addLabel('stats')
      .to(statsRef.current, { opacity: 1, duration: 0.2 })

    statItemsRef.current.forEach((el) => {
      if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }, '<0.08')
    })

    tl.to(scrollLabelRef.current, { opacity: 1, duration: 0.3 }, '<')
    tl.addLabel('end')

    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => window.removeEventListener('resize', onResize)
  }, [ready, timeline])

  return (
    <section ref={sectionRef} className="section-snap flex items-center noise-overlay">
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Blueprint lines sit under text/media (z-14/11) — only show in empty whitespace */}
      <div ref={hLineRef} className="absolute left-0 w-full border-dashed-red-t z-[8] pointer-events-none" />
      <div ref={vLineRef} className="absolute top-0 w-0 border-dashed-red-l z-[8] pointer-events-none" />
      <IntersectionStar ref={starRef} className="absolute z-[9] pointer-events-none" />

      <div
        ref={mediaRef}
        className="absolute right-6 z-[11] hidden lg:block w-[50vw] min-w-[320px] h-[46vh] min-h-[280px] clip-corner-bl overflow-hidden noise-overlay-dark"
      >
        <video
          ref={videoRef}
          src="/videobarrage.mp4"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-0 dot-grid-fine opacity-10 pointer-events-none" />
      </div>

      <div className="relative z-[14] w-full px-8 md:px-16 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8 items-end">
          <div>
            <div ref={labelRowRef} className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span ref={redLineRef} className="w-2.5 h-2.5 bg-red-mica" />
              <p ref={labelTextRef} className="font-mono text-[10px] tracking-[0.3em] text-gray-500">
                Decentralized energy protocol for AI compute
              </p>
            </div>

            <div ref={titleWrapperRef} className="overflow-hidden">
              <h1 ref={titleRef} className="font-display font-thin text-massive leading-none select-none">
                mica
              </h1>
            </div>

            <p ref={taglineRef} className="font-mono text-sm md:text-base mt-10 max-w-xl text-gray-700 leading-relaxed">
              A blockchain-coordinated network that routes AI agent workloads to the cheapest, cleanest energy — cutting compute costs by half with full on-chain transparency.
            </p>

            <div className="flex flex-wrap gap-4 sm:gap-5 mt-12 sm:mt-14">
              <motion.a
                ref={btn1Ref}
                href="#cta"
                className="inline-block text-white font-display font-light text-sm tracking-[0.15em] px-7 py-3.5 sm:px-8 sm:py-4 clip-corner-tr-sm cursor-pointer depth-shadow touch-manipulation"
                style={{ backgroundColor: '#060606' }}
                whileHover={hoverLift}
                whileTap={tapSm}
                transition={springSnappy}
              >
                Get started
              </motion.a>
              <motion.a
                ref={btn2Ref}
                href="#contact"
                className="inline-block border border-black/80 text-black font-display font-light text-sm tracking-[0.15em] px-7 py-3.5 sm:px-8 sm:py-4 clip-corner-bl cursor-pointer touch-manipulation"
                whileHover={{ ...hoverLift, borderColor: 'var(--red)', color: 'var(--red)' }}
                whileTap={tapSm}
                transition={springSnappy}
              >
                Get in touch
              </motion.a>
            </div>

            <div ref={statsRef} className="flex flex-wrap gap-x-8 gap-y-6 sm:gap-x-10 mt-12 sm:mt-16 border-dashed-t-dark pt-6">
              {statsData.map((s, i) => (
                <div key={s.label} ref={(el) => setStatRef(el, i)}>
                  <p className="font-display font-extralight text-lg text-red-mica">{s.val}</p>
                  <p className="font-mono text-[9px] tracking-[0.15em] text-gray-600 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div ref={scrollLabelRef} className="hidden lg:flex flex-col items-end justify-end pb-4">
            <p className="writing-vertical font-mono text-[10px] tracking-[0.25em] text-gray-500">
              Scroll to explore
            </p>
          </div>
        </div>
      </div>

      <div ref={cornerRef} className="hidden sm:block absolute bottom-6 sm:bottom-8 left-4 sm:left-8 md:left-[96px] corner-mark w-12 h-12 sm:w-16 sm:h-16" />
    </section>
  )
}
