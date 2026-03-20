import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useSectionTimeline } from '../hooks/useSectionTimeline'

const bgBlurbs = [
  {
    heading: 'Agent swarms',
    body: 'Enterprises deploy thousands of autonomous AI agents around the clock. Each agent reasons, acts, and consumes compute. mica distributes those workloads across energy-efficient nodes, cutting fleet-wide costs by half.',
  },
  {
    heading: 'Local inference',
    body: 'Developers and builders run open-weight LLMs on their own hardware — fine-tuning, testing, iterating. mica routes the heavy passes to renewable-powered clusters so your local GPU stays cool and your electricity bill stays low.',
  },
  {
    heading: 'Scale without the bill',
    body: 'Every token generated has an energy cost. As agent swarms scale from dozens to millions of daily calls, infrastructure spend explodes. mica locks in flat energy rates and eliminates idle-node waste — predictable pricing at any scale.',
  },
]

export default function SolarPanels() {
  const sectionRef = useRef(null)
  const containerRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, {
    steps: 3,
    pxPerStep: 800,
    scrub: 0.75,
  })

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current

    gsap.set(containerRef.current, { opacity: 0 })
    if (leftRef.current) gsap.set(leftRef.current, { y: '-100%' })
    if (rightRef.current) gsap.set(rightRef.current, { y: '-100%' })

    // Step 1: container fades in (mid panel already visible)
    tl.addLabel('solarMid')
      .to(containerRef.current, { opacity: 1, duration: 1.05, ease: 'sine.out' })

    // Step 2: left panel drops in
    tl.addLabel('solarLeft')
    if (leftRef.current) {
      tl.to(leftRef.current, { y: '0%', duration: 1.25, ease: 'power2.out' })
    }

    // Step 3: right panel drops in
    tl.addLabel('solarRight')
    if (rightRef.current) {
      tl.to(rightRef.current, { y: '0%', duration: 1.25, ease: 'power2.out' })
    }

    tl.addLabel('end')
  }, [ready, timeline])

  return (
    <section ref={sectionRef} className="section-snap">
      <div className="relative flex items-center justify-center min-h-screen px-8 md:px-16 lg:px-24">
        {/* Background text — visible before panels appear, then covered */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center px-6 sm:px-12 md:px-20 lg:px-28">
          <div className="grid w-full max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 md:gap-14">
            {bgBlurbs.map((blurb) => (
              <div key={blurb.heading} className="flex flex-col">
                <span className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-mica sm:text-[11px]">
                  {blurb.heading}
                </span>
                <p className="font-mono text-[13px] leading-[1.9] text-gray-700 sm:text-[14px] md:text-[15px]">
                  {blurb.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative z-[5] w-full max-w-6xl aspect-[16/9] min-h-[280px] flex gap-3 md:gap-5 overflow-visible border-dashed-gray bg-cream p-0"
        >
          <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-cream clip-solar-left">
            <div ref={leftRef} className="absolute inset-0 w-full h-full will-change-transform">
              <img
                src="/solarpanel.jpeg"
                alt=""
                className="absolute top-0 left-0 h-full w-[300%] max-w-none object-cover object-left"
                onError={(e) => { e.target.src = '/datacenter.jpeg' }}
              />
            </div>
          </div>
          <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-cream">
            <div className="absolute inset-0 w-full h-full">
              <img
                src="/solarpanel.jpeg"
                alt="Solar panel array, renewable energy infrastructure"
                className="absolute top-0 left-0 h-full w-[300%] max-w-none object-cover"
                style={{ transform: 'translateX(calc(-100% / 3))' }}
                onError={(e) => { e.target.src = '/datacenter.jpeg' }}
              />
            </div>
          </div>
          <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-cream clip-solar-right">
            <div ref={rightRef} className="absolute inset-0 w-full h-full will-change-transform">
              <img
                src="/solarpanel.jpeg"
                alt=""
                className="absolute top-0 left-0 h-full w-[300%] max-w-none object-cover"
                style={{ transform: 'translateX(calc(-200% / 3))' }}
                onError={(e) => { e.target.src = '/datacenter.jpeg' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
