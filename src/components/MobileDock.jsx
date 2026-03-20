import { useCallback } from 'react'
import { gsap } from 'gsap'

const links = [
  { label: 'About', href: '#about' },
  { label: 'Stack', href: '#features' },
  { label: 'Start', href: '#cta' },
]

export default function MobileDock() {
  const scrollTo = useCallback((href) => (e) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    gsap.to(window, {
      duration: 0.95,
      ease: 'power3.inOut',
      scrollTo: { y: target, offsetY: -8, autoKill: true },
    })
  }, [])

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-dashed border-[var(--gray-border)] bg-cream/95 backdrop-blur-md supports-[backdrop-filter]:bg-cream/80 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
      aria-label="Section navigation"
    >
      <div className="flex justify-around items-stretch max-w-md mx-auto pt-2.5 px-1">
        {links.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            onClick={scrollTo(href)}
            className="flex-1 text-center font-mono text-[9px] tracking-[0.18em] uppercase py-2.5 text-black/70 hover:text-red-mica active:text-red-mica transition-colors duration-200"
          >
            {label}
          </a>
        ))}
        <a
          href="https://x.com/micadotenergy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center py-2.5 text-black/70 hover:text-red-mica active:text-red-mica transition-colors duration-200"
          aria-label="Follow us on X"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>
    </nav>
  )
}
