import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import VerticalNav from './components/VerticalNav'
import MobileDock from './components/MobileDock'
import ConsentGate from './components/ConsentGate'
import Landing from './pages/Landing'
import Careers from './pages/Careers'
import UseMicaApp from './pages/UseMicaApp'
import Whitepaper from './pages/Whitepaper'
import { LegalDocsProvider } from './context/LegalDocsContext'

export default function App() {
  return (
    <BrowserRouter>
      <LegalDocsProvider>
        <ConsentGate>
          <div className="relative min-h-screen">
            <VerticalNav />
            <MobileDock />
            <main className="ml-0 md:ml-[80px] pb-[4.25rem] md:pb-0 min-w-0">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/whitepaper" element={<Whitepaper />} />
                <Route path="/app/*" element={<UseMicaApp />} />
              </Routes>
              {/*
                Must render after Routes so layout runs after the new page is in the DOM.
                Previously as the first child of BrowserRouter, scroll ran too early and /careers looked blank until refresh.
              */}
              <ScrollToTop />
            </main>
          </div>
        </ConsentGate>
      </LegalDocsProvider>
    </BrowserRouter>
  )
}
