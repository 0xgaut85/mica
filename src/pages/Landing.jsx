import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import Hero from '../components/Hero'
import About from '../components/About'
import SolarPanels from '../components/SolarPanels'
import Features from '../components/Features'
import NuclearPanels from '../components/NuclearPanels'
import CallToAction from '../components/CallToAction'
import Footer from '../components/Footer'

export default function Landing() {
  const location = useLocation()

  useEffect(() => {
    const raw = location.hash?.replace(/^#/, '') ?? ''
    if (!raw) return
    const el = document.getElementById(raw)
    if (!el) return
    requestAnimationFrame(() => {
      gsap.to(window, {
        duration: 0.95,
        ease: 'power3.inOut',
        scrollTo: { y: el, offsetY: -4, autoKill: true },
      })
    })
  }, [location.pathname, location.hash])

  return (
    <>
      <Hero />
      <About />
      <SolarPanels />
      <Features />
      <NuclearPanels />
      <CallToAction />
      <Footer />
    </>
  )
}
