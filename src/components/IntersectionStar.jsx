import { forwardRef } from 'react'

const IntersectionStar = forwardRef(({ className = '', dark = false, ...props }, ref) => (
  <div
    ref={ref}
    className={`w-4 h-4 pointer-events-none ${dark ? 'text-white/90' : 'text-[var(--black)]'} ${className}`}
    {...props}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
      <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" />
    </svg>
  </div>
))

IntersectionStar.displayName = 'IntersectionStar'

export default IntersectionStar
