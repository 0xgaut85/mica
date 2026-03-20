import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import IntersectionStar from './IntersectionStar'

const stats = [
  { value: '47%', numeric: 47, prefix: '', suffix: '%', label: 'Reduction in compute cost per cycle' },
  { value: '100%', numeric: 100, prefix: '', suffix: '%', label: 'On-chain attribution and job verification' },
  { value: '12ms', numeric: 12, prefix: '', suffix: 'ms', label: 'Median API response latency' },
]

const archLayers = [
  { name: 'API layer', desc: 'REST endpoints, job submission, agent orchestration' },
  { name: 'Protocol layer', desc: 'Smart-contract scheduling, energy-price oracles, node staking' },
  { name: 'Execution', desc: 'GPU, edge, and cloud nodes with verifiable compute proofs' },
  { name: 'Verification', desc: 'On-chain settlement, data attribution, tokenized credits' },
]

export default function About() {
  const sectionRef = useRef(null)
  const labelRowRef = useRef(null)
  const labelLineRef = useRef(null)
  const labelTextRef = useRef(null)
  const gridRef = useRef(null)
  const headingColRef = useRef(null)
  const headingLinesRef = useRef([])
  const paragraphRef = useRef(null)
  const cardRef = useRef(null)
  const layersSectionRef = useRef(null)
  const layersLabelRef = useRef(null)
  const layerItemsRef = useRef([])
  const statsContainerRef = useRef(null)
  const statItemsRef = useRef([])

  const hLineRef = useRef(null)
  const vLineRef = useRef(null)
  const starRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 7, pxPerStep: 800, scrub: 0.75 })

  const setHeadingRef = useCallback((el, i) => { headingLinesRef.current[i] = el }, [])
  const setLayerRef = useCallback((el, i) => { layerItemsRef.current[i] = el }, [])
  const setStatRef = useCallback((el, i) => { statItemsRef.current[i] = el }, [])

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current
    const sRect = sectionRef.current.getBoundingClientRect()
    const sectionW = sRect.width

    const labelBottom = labelRowRef.current.getBoundingClientRect().bottom
    const gridTop = gridRef.current.getBoundingClientRect().top
    const lbRel = labelBottom - sRect.top
    const gtRel = gridTop - sRect.top
    const gAbout = gtRel - lbRel
    const hY = Math.min(
      lbRel + Math.max(14, gAbout * 0.42),
      gtRel - 10,
    )

    const lgUp = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    const colRight = headingColRef.current.getBoundingClientRect().right
    const cardLeft = cardRef.current.getBoundingClientRect().left
    const gutter = cardLeft - colRight
    const vX = lgUp && gutter > 8
      ? colRight - sRect.left + gutter * 0.32
      : Math.max(24, sectionW - 32)
    const layersTop = layersSectionRef.current.getBoundingClientRect().top - sRect.top
    const vLineHeight = Math.max(1, layersTop)

    const applyLayoutOnly = () => {
      const el = sectionRef.current
      if (!el || !hLineRef.current || !vLineRef.current || !starRef.current) return
      const sr = el.getBoundingClientRect()
      const sw = sr.width
      const lb = labelRowRef.current.getBoundingClientRect().bottom
      const gt = gridRef.current.getBoundingClientRect().top
      const lbR = lb - sr.top
      const gtR = gt - sr.top
      const ga = gtR - lbR
      const hy = Math.min(lbR + Math.max(14, ga * 0.42), gtR - 10)
      const lg = window.matchMedia('(min-width: 1024px)').matches
      const cr = headingColRef.current.getBoundingClientRect().right
      const cl = cardRef.current.getBoundingClientRect().left
      const g = cl - cr
      const vx = lg && g > 8 ? cr - sr.left + g * 0.32 : Math.max(24, sw - 32)
      const lt = layersSectionRef.current.getBoundingClientRect().top - sr.top
      const vh = Math.max(1, lt)
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
    gsap.set(labelTextRef.current, { opacity: 0, x: -40 })
    headingLinesRef.current.forEach(el => {
      if (el) gsap.set(el, { clipPath: 'inset(100% 0 0 0)' })
    })
    gsap.set(paragraphRef.current, { opacity: 0, y: 25 })
    gsap.set(cardRef.current, { opacity: 0, x: 80, rotation: 3 })
    gsap.set(layersLabelRef.current, { opacity: 0, x: -30 })
    layerItemsRef.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, x: -40 })
    })
    gsap.set(statsContainerRef.current, { opacity: 0 })
    statItemsRef.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, y: 25 })
    })

    // Step 1: H-line
    tl.addLabel('hline')
      .to(hLineRef.current, { scaleX: 1, duration: 1, ease: 'expo.out' })

    // Step 2: V-line + star
    tl.addLabel('vline')
      .to(vLineRef.current, { scaleY: 1, duration: 0.8, ease: 'expo.out' })
      .to(starRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)' }, '<0.3')

    // Step 3: heading
    tl.addLabel('heading')
      .to(labelLineRef.current, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
      .to(labelTextRef.current, { opacity: 1, x: 0, duration: 0.4 }, '<0.15')

    headingLinesRef.current.forEach((el, i) => {
      if (el) tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 0.5, ease: 'expo.out' }, i === 0 ? '<0.2' : '<0.12')
    })

    // Step 4: paragraph + card
    tl.addLabel('grid')
      .to(paragraphRef.current, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' })
      .to(cardRef.current, { opacity: 1, x: 0, rotation: 0, duration: 0.6, ease: 'expo.out' }, '<0.1')

    // Step 5: empty (content sits, user reads)

    // Step 6: layers
    tl.addLabel('layers')
      .to(layersLabelRef.current, { opacity: 1, x: 0, duration: 0.3 })

    layerItemsRef.current.forEach((el) => {
      if (el) tl.to(el, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, '<0.08')
    })

    // Step 7: stats
    tl.addLabel('stats')
      .to(statsContainerRef.current, { opacity: 1, duration: 0.3 })

    statItemsRef.current.forEach((el) => {
      if (el) {
        tl.to(el, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, '<0.1')
        const numEl = el.querySelector('[data-counter]')
        if (numEl) {
          const target = parseInt(numEl.dataset.counter, 10)
          const prefix = numEl.dataset.prefix || ''
          const suffix = numEl.dataset.suffix || ''
          tl.to(numEl, {
            innerText: target,
            duration: 0.8,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() {
              numEl.textContent = `${prefix}${Math.round(parseFloat(numEl.innerText || 0))}${suffix}`
            },
          }, '<')
        }
      }
    })

    tl.addLabel('end')

    return () => window.removeEventListener('resize', onResize)
  }, [ready, timeline])

  const headingLines = [
    { text: 'Run AI agents across a', className: '' },
    { text: 'decentralized compute network,', className: 'text-red-mica' },
    { text: 'at half the cost.', className: '' },
  ]

  return (
    <section id="about" ref={sectionRef} className="section-snap noise-overlay">
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div ref={hLineRef} className="absolute left-0 w-full border-dashed-red-t z-[8] pointer-events-none" />
      <div ref={vLineRef} className="absolute top-0 w-0 border-dashed-red-l z-[8] pointer-events-none" />
      <IntersectionStar ref={starRef} className="absolute z-[9] pointer-events-none" />

      <div className="px-8 md:px-16 lg:px-24 pt-32 relative z-10">
        <div ref={labelRowRef} className="flex flex-wrap items-center gap-4 sm:gap-5 mb-12 md:mb-20">
          <span ref={labelLineRef} className="w-2.5 h-2.5 bg-red-mica" />
          <span ref={labelTextRef} className="font-mono text-[10px] tracking-[0.3em] text-gray-500">
            How the architecture works
          </span>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-16 lg:gap-20">
          <div ref={headingColRef}>
            <h2 className="font-display font-extralight text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.1] mb-8 break-words">
              {headingLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <span
                    ref={(el) => setHeadingRef(el, i)}
                    className={`block ${line.className}`}
                  >
                    {line.text}
                  </span>
                </span>
              ))}
            </h2>
            <p ref={paragraphRef} className="font-mono text-[13px] text-gray-700 leading-[1.8] max-w-lg">
              mica is a decentralized protocol that coordinates AI workloads (agent
              swarms, inference, fine-tuning) across a global mesh of
              compute nodes. Smart contracts handle scheduling, energy-price
              oracles find the cheapest power, and every job is settled on-chain.
              Pure infrastructure, zero trust assumptions.
            </p>
          </div>

          <div ref={cardRef} className="relative">
            <div className="clip-corner-tl aspect-[4/5] min-h-[320px] text-white depth-shadow noise-overlay-dark relative overflow-hidden border-dashed-gray" style={{ backgroundColor: '#060606' }}>
              <img
                src="/electrictower.jpeg"
                alt="Energy infrastructure powering decentralized compute"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.target.src = '/about-energy.jpg'; e.target.className = 'absolute inset-0 w-full h-full object-cover opacity-20' }}
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-end">
                <p className="font-display font-light text-base mb-4">Protocol-first design</p>
                <p className="font-mono text-[11px] leading-[1.8] opacity-90">
                  Every job is verified on-chain. Nodes stake tokens and earn
                  rewards for compute delivered. Energy-price oracles route work
                  to the cheapest available power. No middlemen, no opaque
                  billing. Just verifiable, cost-optimized execution.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-8 h-8 corner-mark" />
          </div>
        </div>

        <div ref={layersSectionRef} className="mt-28 border-dashed-t-dark pt-14">
          <p ref={layersLabelRef} className="font-mono text-[10px] tracking-[0.3em] text-gray-500 mb-8">
            System layers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
            {archLayers.map((layer, i) => (
              <motion.div
                key={layer.name}
                ref={(el) => setLayerRef(el, i)}
                className={`p-6 border-dashed-gray ${i > 0 ? 'md:border-l-0' : ''} relative group`}
                whileHover={{ backgroundColor: 'rgba(255,0,50,0.02)' }}
              >
                <span className="font-mono text-[9px] text-gray-500 tracking-[0.15em]">
                  0{i + 1}
                </span>
                <p className="font-display font-light text-sm mt-2 group-hover:text-red-mica transition-colors duration-200">
                  {layer.name}
                </p>
                <p className="font-mono text-[10px] text-gray-600 leading-[1.7] mt-2">
                  {layer.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div ref={statsContainerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 border-dashed-t-dark pt-10">
          {stats.map((stat, i) => (
            <div key={stat.label} ref={(el) => setStatRef(el, i)}>
              <p className="font-display font-extralight text-3xl md:text-4xl text-red-mica">
                {stat.numeric != null ? (
                  <span data-counter={stat.numeric} data-prefix={stat.prefix || ''} data-suffix={stat.suffix || ''}>
                    {stat.prefix}0{stat.suffix}
                  </span>
                ) : stat.value}
              </p>
              <p className="font-mono text-[9px] tracking-[0.15em] text-gray-600 mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
