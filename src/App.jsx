import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import VerticalNav from './components/VerticalNav'
import MobileDock from './components/MobileDock'
import ConsentGate from './components/ConsentGate'
import Landing from './pages/Landing'
import Careers from './pages/Careers'
import { LegalDocsProvider } from './context/LegalDocsContext'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LegalDocsProvider>
        <ConsentGate>
          <div className="relative min-h-screen">
            <VerticalNav />
            <MobileDock />
            <main className="ml-0 md:ml-[80px] pb-[4.25rem] md:pb-0 min-w-0">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/careers" element={<Careers />} />
              </Routes>
            </main>
          </div>
        </ConsentGate>
      </LegalDocsProvider>
    </BrowserRouter>
  )
}
