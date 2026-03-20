import React from 'react'
import ReactDOM from 'react-dom/client'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import App from './App'
import './index.css'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => ScrollTrigger.refresh())
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
