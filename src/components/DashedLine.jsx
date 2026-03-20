import { useRef } from 'react'
import { useDashedLineAnimation } from '../hooks/useDashedLineAnimation'

/**
 * Dashed line that animates in on scroll via GSAP ScrollTrigger.
 * @param {Object} props
 * @param {'h'|'v'|'diagonal'} props.orientation - h=horizontal, v=vertical, diagonal=SVG line
 * @param {string} props.className - Tailwind classes for position (e.g. "absolute top-1/2 left-0 w-full")
 * @param {React.RefObject} [props.triggerRef] - ref to trigger element; if omitted, line triggers itself
 * @param {number} [props.delay] - animation delay in seconds
 * @param {string} [props.start] - ScrollTrigger start, e.g. "top 85%"
 * @param {string} [props.borderClass] - for h: "border-dashed-b" or "border-dashed-t"; for v: "border-dashed-l" or "border-dashed-r"
 * @param {boolean} [props.scrub] - scroll-linked animation
 * @param {string} [props.strokeColor] - for diagonal: stroke color (e.g. "rgba(255,0,50,0.4)")
 */
export default function DashedLine({
  orientation = 'h',
  className = '',
  triggerRef,
  delay = 0,
  start = 'top 85%',
  borderClass,
  scrub = false,
  strokeColor = 'rgba(255,0,50,0.35)',
}) {
  const lineRef = useRef(null)
  const effectiveTrigger = triggerRef ?? lineRef

  useDashedLineAnimation({
    orientation,
    lineRef,
    triggerRef: effectiveTrigger,
    delay,
    start,
    scrub,
  })

  const defaultBorder =
    orientation === 'h'
      ? 'border-dashed-b'
      : orientation === 'v'
        ? 'border-dashed-l'
        : null

  const border = borderClass ?? defaultBorder

  if (orientation === 'diagonal') {
    return (
      <div
        ref={lineRef}
        className={`absolute inset-0 pointer-events-none overflow-hidden opacity-0 ${className}`}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke={strokeColor}
            strokeWidth="0.4"
            strokeDasharray="3 5"
            opacity="0.85"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      ref={lineRef}
      className={`absolute ${border} ${className}`}
      style={{
        transformOrigin: orientation === 'h' ? 'left' : 'top',
        [orientation === 'h' ? 'scaleX' : 'scaleY']: 0,
      }}
    />
  )
}
