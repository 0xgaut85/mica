import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

function NavLink({ label, href, index }) {
  const [hovered, setHovered] = useState(false)

  const handleClick = useCallback((e) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      gsap.to(window, {
        duration: 0.95,
        ease: 'power3.inOut',
        scrollTo: { y: target, offsetY: -4, autoKill: true },
      })
    }
  }, [href])

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className="writing-vertical font-mono text-[10px] tracking-[0.2em] cursor-pointer relative group py-2"
      style={{ color: hovered ? 'var(--red)' : 'var(--black)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.12, duration: 0.5 }}
      whileHover={{ x: 3 }}
    >
      {label}
      <span className="absolute left-0 bottom-0 h-0 w-[1px] bg-red-mica transition-all duration-300 ease-out group-hover:h-full" />
    </motion.a>
  )
}

export default function VerticalNav() {
  const links = [
    { label: 'About', href: '#about' },
    { label: 'Stack', href: '#features' },
    { label: 'Start', href: '#cta' },
  ]

  return (
    <motion.nav
      className="hidden md:flex fixed left-0 top-0 h-screen w-[80px] z-50 flex-col items-center justify-between py-10 red-line"
      initial={{ x: -80 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.a
        href="#"
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-mica rounded-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ opacity: 0.85 }}
        onClick={(e) => {
          e.preventDefault()
          gsap.to(window, { duration: 0.75, ease: 'power2.inOut', scrollTo: { y: 0, autoKill: true } })
        }}
      >
        <img src="/ourlogo.png" alt="mica" className="h-20 w-auto" />
      </motion.a>

      <div className="flex flex-col items-center gap-6">
        {links.map((link, i) => (
          <NavLink key={link.label} {...link} index={i} />
        ))}
      </div>

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
    </motion.nav>
  )
}
