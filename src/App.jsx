import VerticalNav from './components/VerticalNav'
import MobileDock from './components/MobileDock'
import ConsentGate from './components/ConsentGate'
import Hero from './components/Hero'
import About from './components/About'
import SolarPanels from './components/SolarPanels'
import Features from './components/Features'
import NuclearPanels from './components/NuclearPanels'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'
import { LegalDocsProvider } from './context/LegalDocsContext'

export default function App() {
  return (
    <LegalDocsProvider>
      <ConsentGate>
        <div className="relative min-h-screen">
          <VerticalNav />
          <MobileDock />
          <main className="ml-0 md:ml-[80px] pb-[4.25rem] md:pb-0 min-w-0">
            <Hero />
            <About />
            <SolarPanels />
            <Features />
            <NuclearPanels />
            <CallToAction />
            <Footer />
          </main>
        </div>
      </ConsentGate>
    </LegalDocsProvider>
  )
}
