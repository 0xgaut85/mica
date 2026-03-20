import { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSectionTimeline } from '../hooks/useSectionTimeline'
import { useLegalDocs } from '../context/LegalDocsContext'
import IntersectionStar from './IntersectionStar'

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'API docs', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Terms of Service', legal: 'terms' },
      { label: 'Privacy Policy', legal: 'privacy' },
      { label: 'Acceptable use & conditions', legal: 'conditions' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
]

const linkBtnClass =
  'font-mono text-lg md:text-xl text-gray-600 hover:text-red-mica transition-colors duration-200 text-left w-full touch-manipulation'

/**
 * X position (relative to footer section) for the vertical line: center of the grid gutter
 * between column 2 (Company) and column 3 (Resources). Uses the links grid box + computed
 * gap + 3 equal tracks — not column DOM rects (those can disagree with visible text).
 */
function footerVLineXFromGrid(sectionRect, gridEl, smUp) {
  const sw = sectionRect.width
  if (!smUp || !gridEl) {
    const base = Math.min(sw - 32, sw * 0.88)
    return Math.max(48, base - 0.12 * sw)
  }
  const gr = gridEl.getBoundingClientRect()
  const W = gr.width
  const cs = getComputedStyle(gridEl)
  const gapRaw = cs.columnGap || cs.gap || '0'
  const gap = parseFloat(gapRaw) || 0
  const track = (W - 2 * gap) / 3
  if (track <= 0 || !Number.isFinite(track)) {
    return gr.left + (W * 2) / 3 - sectionRect.left
  }
  // Track2 ends at 2*track + gap; track3 starts at 2*track + 2*gap → gutter center = 2*track + 1.5*gap
  const xViewport = gr.left + 2 * track + 1.5 * gap
  return xViewport - sectionRect.left
}

export default function Footer() {
  const { openLegal } = useLegalDocs()
  const sectionRef = useRef(null)
  const hLineRef = useRef(null)
  const vLineRef = useRef(null)
  const starRef = useRef(null)
  const brandRef = useRef(null)
  const logoImgRef = useRef(null)
  const linksGridRef = useRef(null)
  const colRefs = useRef([])
  const bottomRef = useRef(null)

  const { timeline, ready } = useSectionTimeline(sectionRef, { steps: 3, pxPerStep: 600 })

  const setColRef = useCallback((el, i) => { colRefs.current[i] = el }, [])

  useEffect(() => {
    if (!ready.current || !timeline.current) return
    const tl = timeline.current
    const sRect = sectionRef.current.getBoundingClientRect()

    const linksTop = linksGridRef.current.getBoundingClientRect().top
    const H_LINE_LIFT = 36
    const hY = linksTop - sRect.top - H_LINE_LIFT
    const sectionW = sRect.width
    const smUp = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
    const vX = footerVLineXFromGrid(sRect, linksGridRef.current, smUp)

    const logoTop = logoImgRef.current
      ? logoImgRef.current.getBoundingClientRect().top - sRect.top
      : brandRef.current.getBoundingClientRect().top - sRect.top
    const bottomTop = bottomRef.current.getBoundingClientRect().top - sRect.top
    const vLineTop = logoTop
    const vLineHeight = Math.max(1, bottomTop - vLineTop)

    const applyLayoutOnly = () => {
      const el = sectionRef.current
      if (!el || !vLineRef.current || !starRef.current || !hLineRef.current) return
      const sr = el.getBoundingClientRect()
      const sw = sr.width
      const lt = linksGridRef.current.getBoundingClientRect().top
      const hy = lt - sr.top - H_LINE_LIFT
      const sm = window.matchMedia('(min-width: 640px)').matches
      const vx = footerVLineXFromGrid(sr, linksGridRef.current, sm)
      const ltLogo = logoImgRef.current
        ? logoImgRef.current.getBoundingClientRect().top - sr.top
        : brandRef.current.getBoundingClientRect().top - sr.top
      const bt = bottomRef.current.getBoundingClientRect().top - sr.top
      const vh = Math.max(1, bt - ltLogo)
      gsap.set(hLineRef.current, {
        top: hy,
        width: sw,
        transformOrigin: 'left center',
      })
      gsap.set(vLineRef.current, { left: vx, top: ltLogo, height: vh, transformOrigin: 'top center' })
      gsap.set(starRef.current, { top: hy - 8, left: vx - 8 })
      ScrollTrigger.refresh()
    }

    gsap.set(hLineRef.current, { top: hY, width: sectionW, scaleX: 0, transformOrigin: 'left center' })
    gsap.set(vLineRef.current, {
      left: vX,
      top: vLineTop,
      height: vLineHeight,
      scaleY: 0,
      transformOrigin: 'top center',
    })
    gsap.set(starRef.current, { top: hY - 8, left: vX - 8, scale: 0, opacity: 0 })

    const onResize = () => applyLayoutOnly()
    window.addEventListener('resize', onResize)

    gsap.set(brandRef.current, { opacity: 0 })
    colRefs.current.forEach(el => {
      if (el) gsap.set(el, { opacity: 0, x: 30 })
    })
    gsap.set(bottomRef.current, { opacity: 0, y: 15 })

    tl.addLabel('lines')
      .to(hLineRef.current, { scaleX: 1, duration: 0.5, ease: 'expo.out' })
      .to(vLineRef.current, { scaleY: 1, duration: 0.5, ease: 'expo.out' }, '<0.15')

    tl.addLabel('content')
      .to(starRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(3)' })
      .to(brandRef.current, { opacity: 1, duration: 0.5 }, '<0.1')

    colRefs.current.forEach((el, i) => {
      if (el) tl.to(el, {
        opacity: 1, x: 0,
        duration: 0.5,
        ease: 'expo.out',
      }, `<${0.05 + i * 0.08}`)
    })

    tl.addLabel('bottom')
      .to(bottomRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' })

    tl.addLabel('end')

    return () => window.removeEventListener('resize', onResize)
  }, [ready, timeline])

  return (
    <footer id="contact" ref={sectionRef} className="relative noise-overlay flex flex-col justify-center overflow-x-hidden overflow-y-visible">
      <div ref={hLineRef} className="absolute left-0 border-dashed-red-t z-[5]" />
      <div ref={vLineRef} className="absolute w-0 border-dashed-red-l z-[5]" />
      <IntersectionStar ref={starRef} className="absolute z-[6]" />

      <div className="px-8 md:px-16 lg:px-24 pt-14 sm:pt-16 pb-2">
        <div className="space-y-16 md:space-y-20">
          <div ref={brandRef}>
            <img ref={logoImgRef} src="/ourlogo.png" alt="mica" className="h-40 md:h-56 lg:h-72 w-auto mb-6" />
            <p className="font-display font-extralight text-3xl md:text-4xl lg:text-5xl text-gray-700 leading-[1.3] max-w-3xl">
              Decentralized energy protocol for AI compute — verified on-chain.
            </p>
            <a
              href="mailto:contact@mica.energy"
              className="inline-block mt-6 font-mono text-base md:text-lg tracking-[0.08em] text-gray-600 hover:text-red-mica transition-colors duration-200"
            >
              contact@mica.energy
            </a>
          </div>

          <div ref={linksGridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {footerLinks.map((col, i) => (
              <div key={col.heading} ref={(el) => setColRef(el, i)}>
                <p className="font-display font-light text-2xl md:text-3xl tracking-[0.08em] mb-6 text-gray-700">
                  {col.heading}
                </p>
                <ul className="space-y-4">
                  {col.links.map((item) => (
                    <li key={item.label}>
                      {'legal' in item && item.legal ? (
                        <button
                          type="button"
                          className={linkBtnClass}
                          onClick={() => openLegal(item.legal)}
                        >
                          {item.label}
                        </button>
                      ) : (
                        <a
                          href={item.href ?? '#'}
                          className="font-mono text-lg md:text-xl text-gray-600 hover:text-red-mica transition-colors duration-200 inline-block"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div ref={bottomRef} className="flex flex-col md:flex-row justify-between items-center gap-6 mt-20 pt-6 border-dashed-t-dark">
          <p className="font-mono text-sm md:text-base tracking-[0.12em] text-gray-500">
            2026 mica. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-4 md:mt-0">
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <a key={social} href="#" className="font-mono text-sm md:text-base tracking-[0.12em] text-gray-500 hover:text-red-mica transition-colors duration-200">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
