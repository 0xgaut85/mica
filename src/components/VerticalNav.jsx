import { useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

const SECTIONS = [
  { label: 'About', hash: 'about' },
  { label: 'Stack', hash: 'features' },
  { label: 'Start', hash: 'cta' },
]

function SectionLink({ label, hash, index }) {
  const location = useLocation()

  const handleClick = useCallback(
    (e) => {
      if (location.pathname !== '/') return
      e.preventDefault()
      const target = document.getElementById(hash)
      if (target) {
        gsap.to(window, {
          duration: 0.95,
          ease: 'power3.inOut',
          scrollTo: { y: target, offsetY: -4, autoKill: true },
        })
      }
    },
    [hash, location.pathname],
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.12, duration: 0.5 }}
    >
      <Link
        to={`/#${hash}`}
        onClick={handleClick}
        className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2 text-black hover:text-red-mica transition-colors duration-200 block"
      >
        {label}
        <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
      </Link>
    </motion.div>
  )
}

export default function VerticalNav() {
  const location = useLocation()

  return (
    <motion.nav
      className="hidden md:flex fixed left-0 top-0 h-screen w-[80px] z-50 flex-col items-center justify-between py-10 red-line"
      initial={{ x: -80 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to="/"
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-mica rounded-sm"
        onClick={(e) => {
          if (location.pathname === '/') {
            e.preventDefault()
            gsap.to(window, { duration: 0.75, ease: 'power2.inOut', scrollTo: { y: 0, autoKill: true } })
          }
        }}
      >
        <motion.img
          src="/ourlogo.png"
          alt="mica"
          className="h-20 w-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ opacity: 0.85 }}
        />
      </Link>

      <div className="flex flex-col items-center gap-6">
        {SECTIONS.map((link, i) => (
          <SectionLink key={link.hash} {...link} index={i} />
        ))}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + SECTIONS.length * 0.12, duration: 0.5 }}
        >
          <Link
            to="/careers"
            className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2 text-black hover:text-red-mica transition-colors duration-200 block"
          >
            Careers
            <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + (SECTIONS.length + 1) * 0.12, duration: 0.5 }}
        >
          <Link
            to="/whitepaper"
            className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2 text-black hover:text-red-mica transition-colors duration-200 block"
          >
            Paper
            <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + (SECTIONS.length + 2) * 0.12, duration: 0.5 }}
        >
          <Link
            to="/analytics"
            className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2 text-black hover:text-red-mica transition-colors duration-200 block"
          >
            Analytics
            <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + (SECTIONS.length + 3) * 0.12, duration: 0.5 }}
        >
          <Link
            to="/app"
            className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2 text-red-mica hover:text-black transition-colors duration-200 block font-bold"
          >
            Use Mica
            <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
          </Link>
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <motion.a
          href="https://github.com/nhevers/mica-plugin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black/60 hover:text-red-mica transition-colors duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35 }}
          whileHover={{ scale: 1.15 }}
          aria-label="View on GitHub"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </motion.a>
        <motion.a
          href="https://x.com/micadotenergy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black/60 hover:text-red-mica transition-colors duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.15 }}
          aria-label="Follow us on X"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </motion.a>
      </div>
    </motion.nav>
  )
}
