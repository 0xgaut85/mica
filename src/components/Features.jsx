import { useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { springSnappy } from '../constants/motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTextScramble } from '../hooks/useTextScramble'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import IntersectionStar from './IntersectionStar'
import PartnerOrbitCarousel from './PartnerOrbitCarousel'

const features = [
  {
    title: 'Energy-aware training',
    desc: 'Jobs run under explicit kWh budgets. Nodes are ranked by improvement-per-watt. Sparse gradient updates minimize network and memory load.',
    corner: 'clip-corner-tr',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3L6 16h7l-1 9 10-13h-7l1-9z" />
      </svg>
    ),
  },
  {
    title: 'Distributed coordination',
    desc: 'Training tasks split across heterogeneous nodes, including GPU clouds, edge devices, and on-prem clusters, with deterministic evaluation and reproducible validation.',
    corner: 'clip-corner-bl',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="14" cy="6" r="3" /><circle cx="6" cy="22" r="3" /><circle cx="22" cy="22" r="3" />
        <line x1="14" y1="9" x2="6" y2="19" /><line x1="14" y1="9" x2="22" y2="19" /><line x1="9" y1="22" x2="19" y2="22" />
      </svg>
    ),
  },
  {
    title: 'Data attribution',
    desc: 'Every dataset contribution is tracked and measured. Loss improvement, accuracy gains, and transparent valuation that incentivizes high-quality training data.',
    corner: 'clip-corner-both',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="20" height="20" rx="2" />
        <path d="M4 11h20M4 18h20M11 4v20M18 4v20" opacity="0.4" />
        <circle cx="14" cy="14" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Standard REST APIs',
    desc: 'POST /train with your model, dataset, and energy budget. Get back a checkpoint, energy report, and contribution metrics. Simple integration, no complexity.',
    corner: 'clip-corner-tl',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 8l-4 6 4 6M20 8l4 6-4 6" /><line x1="16" y1="5" x2="12" y2="23" />
      </svg>
    ),
  },
]

function FeatureCard({ feature, index, cardRef }) {
  const { display, scramble } = useTextScramble(feature.title, {
    autoStart: false,
    duration: 800,
  })

  return (
    <motion.div
      ref={cardRef}
      className={`relative bg-cream p-6 sm:p-8 md:p-9 ${feature.corner} group cursor-default border-dashed-gray depth-shadow touch-manipulation`}
      onMouseEnter={scramble}
      whileHover={{
        y: -5,
        boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 10px 28px rgba(0,0,0,0.05), 0 26px 52px rgba(0,0,0,0.03)',
      }}
      transition={springSnappy}
    >
      <div className="absolute top-0 right-0 w-24 h-24 dot-grid-fine opacity-30 pointer-events-none" />
      <span className="font-display font-thin text-5xl text-gray-100 absolute top-3 right-5 select-none group-hover:text-red-mica/10 transition-colors duration-300">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="relative z-10">
        <div className="text-gray-400 group-hover:text-red-mica transition-colors duration-300 mb-5">
          {feature.icon}
        </div>
        <h3 className="font-display font-light text-base mb-3 group-hover:text-red-mica transition-colors duration-300">
          {display}
        </h3>
        <p className="font-mono text-[11px] text-gray-600 leading-[1.8]">
          {feature.desc}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-200 group-hover:bg-red-mica transition-colors duration-300" />
    </motion.div>
  )
}

export default function Features() {
  const sectionRef = useRef(null)
  const labelRowRef = useRef(null)
  const labelLineRef = useRef(null)
  const labelTextRef = useRef(null)
  const headingRowRef = useRef(null)
  const featuresOrbitRef = useRef(null)
  const featuresDockRef = useRef(null)
  const headingWrapperRef = useRef(null)
  const heading1Ref = useRef(null)
  const heading2Ref = useRef(null)
  const cardsGridRef = useRef(null)
  const cardRefs = useRef([])
  const apiBlockRef = useRef(null)

  const hLineRef = useRef(null)
  const vLineRef = useRef(null)
  const starRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 5, pxPerStep: 800, scrub: 0.75 })

  const setCardRef = useCallback((el, i) => { cardRefs.current[i] = el }, [])

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current
    const sRect = sectionRef.current.getBoundingClientRect()
    const sectionW = sRect.width

    const headingBottom = headingRowRef.current.getBoundingClientRect().bottom
    const cardsTop = cardsGridRef.current.getBoundingClientRect().top
    const hY = ((headingBottom + cardsTop) / 2) - sRect.top

    const mdUp = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
    const c0 = cardRefs.current[0]
    const c1 = cardRefs.current[1]
    let vX
    if (mdUp && c0 && c1) {
      const r0 = c0.getBoundingClientRect()
      const r1 = c1.getBoundingClientRect()
      vX = (r0.right + r1.left) / 2 - sRect.left
    } else {
      vX = Math.max(24, sectionW - 32)
    }
    const apiBottom = apiBlockRef.current.getBoundingClientRect().bottom - sRect.top
    const vLineHeight = Math.max(1, apiBottom)

    const applyLayoutOnly = () => {
      const el = sectionRef.current
      if (!el || !hLineRef.current || !vLineRef.current || !starRef.current) return
      const sr = el.getBoundingClientRect()
      const sw = sr.width
      const hb = headingRowRef.current.getBoundingClientRect().bottom
      const ct = cardsGridRef.current.getBoundingClientRect().top
      const hy = ((hb + ct) / 2) - sr.top
      const md = window.matchMedia('(min-width: 768px)').matches
      const a = cardRefs.current[0]
      const b = cardRefs.current[1]
      let vx
      if (md && a && b) {
        const r0 = a.getBoundingClientRect()
        const r1 = b.getBoundingClientRect()
        vx = (r0.right + r1.left) / 2 - sr.left
      } else {
        vx = Math.max(24, sw - 32)
      }
      const ab = apiBlockRef.current.getBoundingClientRect().bottom - sr.top
      const vh = Math.max(1, ab)
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

    gsap.set(labelLineRef.current, { scale: 0, transformOrigin: 'center center' })
    gsap.set(labelTextRef.current, { opacity: 0, x: -30 })
    gsap.set(heading1Ref.current, { opacity: 0, y: 30 })
    gsap.set(heading2Ref.current, { clipPath: 'inset(0 100% 0 0)' })
    const mediaEls = [featuresOrbitRef.current, featuresDockRef.current].filter(Boolean)
    if (mediaEls.length) {
      gsap.set(mediaEls, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        filter: 'blur(14px)',
        transformOrigin: '50% 60%',
        force3D: true,
      })
    }
    cardRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { opacity: 0, x: i % 2 === 0 ? -50 : 50 })
    })
    gsap.set(apiBlockRef.current, { opacity: 0, filter: 'blur(10px)' })

    tl.addLabel('hline')
      .to(hLineRef.current, { scaleX: 1, duration: 1, ease: 'expo.out' })

    tl.addLabel('vline')
      .to(vLineRef.current, { scaleY: 1, duration: 0.8, ease: 'expo.out' })
      .to(starRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)' }, '<0.3')
      .to(labelLineRef.current, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, '<0.2')
      .to(labelTextRef.current, { opacity: 1, x: 0, duration: 0.4 }, '<0.15')
      .to(heading1Ref.current, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '<0.2')
      .to(heading2Ref.current, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'expo.out' }, '<0.25')

    if (mediaEls.length) {
      tl.to(
        mediaEls,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.12,
        },
        '<0.2',
      )
    }

    tl.addLabel('cards')
    cardRefs.current.forEach((el, i) => {
      if (el) tl.to(el, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, i < 2 ? '<0.12' : '<0.08')
    })

    tl.addLabel('api')
      .to(apiBlockRef.current, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' })

    tl.addLabel('end')

    return () => window.removeEventListener('resize', onResize)
  }, [ready, timeline])

  return (
    <section id="features" ref={sectionRef} className="section-snap">
      <div ref={hLineRef} className="absolute left-0 w-full border-dashed-red-t z-[8] pointer-events-none" />
      <div ref={vLineRef} className="absolute top-0 w-0 border-dashed-red-l z-[8] pointer-events-none" />
      <IntersectionStar ref={starRef} className="absolute z-[9] pointer-events-none" />

      <div className="px-8 md:px-16 lg:px-24 pt-32 relative z-10">
        <div ref={headingRowRef} className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(260px,40vw)] gap-10 lg:gap-14 items-end mb-12">
          <div>
            <div ref={featuresOrbitRef} className="mb-10 lg:mb-14">
              <p className="mb-8 font-display font-extralight text-2xl md:text-3xl lg:text-4xl text-gray-700 text-center lg:text-left">
                Collaborating with energy leaders
              </p>
              <div className="flex justify-center">
                <PartnerOrbitCarousel variant="light" />
              </div>
            </div>
            <div ref={labelRowRef} className="flex flex-wrap items-center gap-4 sm:gap-5 mb-6">
              <span ref={labelLineRef} className="w-2.5 h-2.5 bg-red-mica" />
              <span ref={labelTextRef} className="font-mono text-[10px] tracking-[0.3em] text-gray-500">
                The core mechanisms
              </span>
            </div>
            <h2 ref={headingWrapperRef} className="font-display font-extralight text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.08] max-w-4xl">
              <span className="block overflow-hidden">
                <span ref={heading1Ref} className="block">
                  Four mechanisms that eliminate
                </span>
              </span>
              <span className="block overflow-hidden">
                <span ref={heading2Ref} className="block text-red-mica">
                  complexity from distributed AI training
                </span>
              </span>
            </h2>
          </div>
          <div
            ref={featuresDockRef}
            className="relative w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none aspect-[4/5] min-h-[200px] clip-corner-bl overflow-hidden noise-overlay-dark border-dashed-gray mt-4 lg:mt-0"
          >
            <img
              src="/dock.jpeg"
              alt="Container port at dawn—distributed coordination at industrial scale"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            <div className="absolute inset-0 dot-grid-fine opacity-10 pointer-events-none" />
          </div>
        </div>

        <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={i}
              cardRef={(el) => setCardRef(el, i)}
            />
          ))}
        </div>

        <div ref={apiBlockRef} className="mt-16 border-dashed-gray bg-cream p-8 md:p-10 clip-corner-tr relative noise-overlay">
          <div className="absolute top-0 right-0 w-full h-full dot-grid-fine opacity-15 pointer-events-none" />
          <div className="relative z-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-gray-500 mb-5">
              API preview
            </p>
            <pre className="font-mono text-[12px] text-gray-600 leading-[1.9] overflow-x-auto">
              <code>{`POST /train
{
  "model": "llama-7b",
  "dataset": "customer_support_logs",
  "objective": "reduce_hallucinations",
  "energy_budget_kwh": 500
}`}</code>
            </pre>
            <div className="flex items-center gap-3 mt-6 border-dashed-t-dark pt-5">
              <span className="w-2 h-2 rounded-full bg-red-mica" />
              <p className="font-mono text-[10px] text-gray-600">
                Returns trained checkpoint, energy report, and dataset contribution metrics
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
