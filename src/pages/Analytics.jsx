import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const PANEL =
  'bg-[#060606] text-zinc-100 border border-dashed border-white/35 depth-shadow'

const STROKE_GRID = '#52525b'
const STROKE_AXIS = '#a1a1aa'

function formatUsd(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatTonnes(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} t`
}

function formatKwh(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Math.round(Number(n)).toLocaleString('en-US')} kWh`
}

function formatUsdPerKwh(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `$${Number(n).toFixed(3)}/kWh`
}

function computeSeriesBounds(series) {
  if (!series?.length) return null
  const nums = series.map(Number)
  let min = Math.min(...nums)
  let max = Math.max(...nums)
  const span = max - min || 1
  const pad = span * 0.06
  min -= pad
  max += pad
  const range = max - min || 1
  return { min, max, range, nums }
}

function formatUsdAxis(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 10_000) return `$${Math.round(v / 1000)}k`
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`
  return formatUsd(v)
}

/** Full-dollar Y-axis labels for revenue charts (easier to read than compact k). */
function formatUsdChartAxis(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  return formatUsd(v)
}

function clamp01(t) {
  return Math.min(1, Math.max(0, t))
}

function polylinePoints(series, x0, x1, y0, y1) {
  const b = computeSeriesBounds(series)
  if (!b) return ''
  const { min, max, range, nums } = b
  return nums
    .map((v, i) => {
      const t = nums.length <= 1 ? 0.5 : i / (nums.length - 1)
      const x = x0 + (x1 - x0) * t
      const y = y1 - ((v - min) / range) * (y1 - y0)
      return `${x},${y}`
    })
    .join(' ')
}

function seriesIndexFromSvgX(svg, clientX, x0, x1, len) {
  if (!svg || len < 2) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = 0
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const p = pt.matrixTransform(ctm.inverse())
  if (p.x < x0 || p.x > x1) return null
  const t = clamp01((p.x - x0) / (x1 - x0))
  return Math.round(t * (len - 1))
}

function CategoryHeading({ eyebrow, title, className = '' }) {
  return (
    <div className={`mb-5 md:mb-6 border-b border-dashed border-[var(--gray-border)] pb-4 md:pb-5 ${className}`}>
      <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-gray-500 uppercase mb-2">
        {eyebrow}
      </p>
      <h2 className="font-display font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--black)] leading-[1.05]">
        {title}
      </h2>
    </div>
  )
}

function ChartShell({
  title,
  subtitle,
  yLabel,
  xLabel,
  className = '',
  hero = false,
  /** Wide full-width panels with taller plot (subscription economics). */
  banner = false,
  series = null,
  stroke = '#fb7185',
  showUsdYTicks = false,
  dateLabels = null,
  scrubbable = false,
  footerNote = null,
}) {
  const svgRef = useRef(null)
  const [hoverIdx, setHoverIdx] = useState(null)
  const vbW = banner ? 1080 : hero ? 800 : 400
  const vbH = banner ? 440 : hero ? 320 : 200
  const gridLines = banner ? 6 : hero ? 7 : 4
  const y0 = banner ? 52 : 40
  const y1 = vbH - (banner ? 42 : 32)
  const x0 =
    banner && showUsdYTicks ? 128 : hero && showUsdYTicks ? 88 : showUsdYTicks ? 72 : 56
  const x1 = vbW - (banner ? 24 : 28)
  const step = (y1 - y0) / gridLines
  const isHeroTitle = hero || banner

  const lines = []
  for (let i = 1; i <= gridLines; i += 1) {
    const y = y0 + step * i
    lines.push(
      <line
        key={i}
        x1={x0}
        y1={y}
        x2={x1}
        y2={y}
        stroke={STROKE_GRID}
        strokeOpacity={0.9}
        strokeDasharray="5 5"
      />,
    )
  }

  const pts = useMemo(
    () => (series?.length >= 2 ? polylinePoints(series, x0, x1, y0, y1) : ''),
    [series, x0, x1, y0, y1],
  )
  const hasSeries = Boolean(pts)
  const bounds = useMemo(() => (series?.length >= 2 ? computeSeriesBounds(series) : null), [series])

  const canScrub =
    scrubbable &&
    hasSeries &&
    Array.isArray(dateLabels) &&
    dateLabels.length === series?.length

  const hoverCx =
    hoverIdx != null && series?.length >= 2
      ? x0 + (x1 - x0) * (hoverIdx / (series.length - 1))
      : null
  const hoverVal = hoverIdx != null && bounds ? Number(series[hoverIdx]) : null
  const hoverCy =
    hoverIdx != null && bounds && Number.isFinite(hoverVal)
      ? y1 - ((hoverVal - bounds.min) / bounds.range) * (y1 - y0)
      : null

  const onScrubPointer = (e) => {
    if (!canScrub || !svgRef.current) return
    const idx = seriesIndexFromSvgX(svgRef.current, e.clientX, x0, x1, series.length)
    setHoverIdx(idx)
  }

  const yTickLabels = useMemo(() => {
    if (!showUsdYTicks || !series?.length || series.length < 2) return []
    const b = computeSeriesBounds(series)
    if (!b) return []
    const n = banner || hero ? 6 : 5
    const out = []
    for (let j = 0; j < n; j += 1) {
      const t = n <= 1 ? 0 : j / (n - 1)
      const val = b.max - t * (b.max - b.min)
      const y = y0 + t * (y1 - y0)
      out.push({ val, y })
    }
    return out
  }, [showUsdYTicks, series, hero, banner, y0, y1])

  const fmtY = banner && showUsdYTicks ? formatUsdChartAxis : formatUsdAxis
  const tickFs = banner ? 12 : hero ? 10 : 9
  const axisStroke = banner ? 1.5 : 1
  const lineStroke = banner ? 3 : 2
  const labelFs = banner ? 12 : hero ? 11 : 10
  const hoverR = banner ? 6 : 5
  const hoverPad = banner ? 100 : 72

  return (
    <section
      className={`${PANEL} flex flex-col ${
        banner
          ? 'p-6 md:p-8 lg:p-10 min-h-[420px] md:min-h-[500px] w-full'
          : 'p-5 md:p-6 lg:p-7 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex-1'
      } ${className}`}
    >
      <header className="mb-3 md:mb-5 text-left shrink-0 border-l-[3px] border-red-mica pl-4 md:pl-5">
        {isHeroTitle ? (
          <h3
            className={`font-display font-light text-zinc-100 leading-tight ${
              banner ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl lg:text-3xl'
            }`}
          >
            {title}
          </h3>
        ) : (
          <h3 className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-red-mica uppercase leading-tight">
            {title}
          </h3>
        )}
        <p
          className={`font-mono text-zinc-400 mt-2 leading-relaxed ${
            banner ? 'text-xs md:text-sm max-w-4xl' : 'text-[10px] md:text-[11px] mt-1.5 max-w-xl'
          }`}
        >
          {subtitle}
        </p>
      </header>
      <div
        className={`flex-1 w-full ${
          banner ? 'min-h-[300px] md:min-h-[380px] lg:min-h-[420px]' : 'min-h-[180px] md:min-h-[200px]'
        }`}
      >
        <svg
          ref={svgRef}
          className={`w-full h-full block text-zinc-500 ${
            banner ? 'min-h-[300px] md:min-h-[380px]' : 'min-h-[180px]'
          } ${canScrub ? 'touch-none select-none' : ''}`}
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {lines}
          <line x1={x0} y1={y0} x2={x0} y2={y1} stroke={STROKE_AXIS} strokeWidth={axisStroke} />
          <line x1={x0} y1={y1} x2={x1} y2={y1} stroke={STROKE_AXIS} strokeWidth={axisStroke} />
          {yTickLabels.map(({ val, y }, idx) => (
            <text
              key={idx}
              x={x0 - (banner ? 10 : 8)}
              y={y + (banner ? 5 : 4)}
              textAnchor="end"
              fill={banner ? '#d4d4d8' : 'currentColor'}
              style={{ fontSize: tickFs, fontFamily: 'ui-monospace, monospace', fontWeight: banner ? 500 : 400 }}
            >
              {fmtY(val)}
            </text>
          ))}
          {hasSeries ? (
            <polyline
              fill="none"
              stroke={stroke}
              strokeWidth={lineStroke}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pts}
            />
          ) : null}
          {canScrub && hoverIdx != null && hoverCx != null && hoverCy != null ? (
            <g pointerEvents="none">
              <line
                x1={hoverCx}
                y1={y0}
                x2={hoverCx}
                y2={y1}
                stroke={stroke}
                strokeOpacity={0.45}
                strokeWidth={banner ? 1.5 : 1}
              />
              <circle cx={hoverCx} cy={hoverCy} r={hoverR} fill="#09090b" stroke={stroke} strokeWidth={2} />
              <text
                x={Math.min(Math.max(hoverCx, x0 + hoverPad), x1 - hoverPad)}
                y={banner ? y0 - 10 : y0 - 6}
                textAnchor="middle"
                fill="#fafafa"
                style={{ fontSize: labelFs, fontFamily: 'ui-monospace, monospace' }}
              >
                {formatUsd(hoverVal)} · {dateLabels[hoverIdx] ?? `d${hoverIdx}`}
              </text>
            </g>
          ) : null}
          {canScrub ? (
            <rect
              x={x0}
              y={y0}
              width={x1 - x0}
              height={y1 - y0}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onPointerMove={onScrubPointer}
              onPointerDown={onScrubPointer}
              onPointerEnter={onScrubPointer}
              onPointerLeave={() => setHoverIdx(null)}
            />
          ) : null}
          <text
            x={(x0 + x1) / 2}
            y={vbH - (banner ? 10 : 8)}
            textAnchor="middle"
            fill="currentColor"
            style={{ fontSize: labelFs, fontFamily: 'ui-monospace, monospace' }}
          >
            {xLabel}
          </text>
          <text
            x={banner ? 22 : 16}
            y={(y0 + y1) / 2}
            textAnchor="middle"
            fill="currentColor"
            transform={`rotate(-90 ${banner ? 22 : 16} ${(y0 + y1) / 2})`}
            style={{ fontSize: labelFs, fontFamily: 'ui-monospace, monospace' }}
          >
            {yLabel}
          </text>
        </svg>
      </div>
      <p
        className={`font-mono text-zinc-500 mt-3 md:mt-4 tracking-wide leading-snug ${
          banner ? 'text-[11px] md:text-xs max-w-5xl' : 'text-[9px] md:text-[10px]'
        }`}
      >
        {footerNote != null
          ? footerNote
          : hasSeries
            ? showUsdYTicks
              ? `Daily series (UTC). Tier-priced MMR from active seats.${scrubbable ? ' Hover or drag for date and USD.' : ''}`
              : 'Daily series (UTC).'
            : 'Awaiting series data.'}
      </p>
    </section>
  )
}

function KpiTile({ metricId, label, sublabel, value, valueLabel, large = false }) {
  const headingId = `metric-${metricId}`
  const showValue = value !== undefined && value !== null && value !== ''
  const pad = large ? 'px-5 py-8 md:px-6 md:py-10 min-h-[140px] md:min-h-[168px]' : 'px-3 py-2.5'
  return (
    <article
      className={`${PANEL} ${pad} flex flex-col justify-center items-center text-center`}
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className={`font-mono tracking-[0.15em] text-zinc-400 uppercase mb-2 leading-tight ${
          large ? 'text-[10px] md:text-xs' : 'text-[8px] mb-0.5'
        }`}
      >
        {label}
      </h3>
      <p
        className={`font-mono text-zinc-500 leading-snug line-clamp-2 mb-2 ${
          large ? 'text-xs md:text-sm' : 'text-[9px] mb-1'
        }`}
      >
        {sublabel}
      </p>
      <p
        className={`font-mono tracking-[0.12em] text-zinc-200 tabular-nums ${
          large ? 'text-sm md:text-base' : 'text-[10px] text-zinc-500'
        }`}
        aria-label={valueLabel || 'Value not yet published'}
      >
        {showValue ? value : 'Pending'}
      </p>
    </article>
  )
}

function RevenueStat({ id, label, sublabel, amount, status }) {
  const display =
    status === 'error' ? 'Unavailable' : status === 'loading' ? 'Pending' : formatUsd(amount ?? 0)
  return (
    <article
      className={`${PANEL} px-5 py-8 md:px-7 md:py-10 flex flex-col justify-center min-h-[160px] md:min-h-[200px]`}
      aria-labelledby={id}
    >
      <h3 id={id} className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-zinc-400 uppercase mb-2">
        {label}
      </h3>
      <p className="font-mono text-xs md:text-sm text-zinc-500 mb-3 line-clamp-3 leading-relaxed">{sublabel}</p>
      <p className="font-display font-extralight text-3xl sm:text-4xl md:text-5xl text-zinc-50 tabular-nums leading-none">
        {display}
      </p>
    </article>
  )
}

function PendingStrip({ children }) {
  return (
    <p className="font-mono text-xs md:text-sm text-gray-600 border border-dashed border-[var(--gray-border)] bg-cream/80 px-5 py-5 md:px-6 md:py-6 leading-relaxed">
      {children}
    </p>
  )
}

function ActivePlanPills({ revenue, revStatus }) {
  if (revStatus === 'loading') {
    return (
      <p className="mb-4 md:mb-5 font-mono text-xs md:text-sm text-gray-500">Active subscriptions by plan: Pending</p>
    )
  }
  if (revStatus === 'error' || !revenue?.ok) {
    return (
      <p className="mb-4 md:mb-5 font-mono text-xs md:text-sm text-gray-500">Active subscriptions by plan: Unavailable</p>
    )
  }
  const { basic = 0, premium = 0, enterprise = 0 } = revenue.byPlan || {}
  return (
    <div className="flex flex-wrap gap-3 mb-4 md:mb-6" aria-label="Active subscriptions by plan">
      <span className="font-mono text-xs md:text-sm tracking-wide text-gray-700 border border-dashed border-[var(--gray-border)] bg-white/50 px-4 py-2.5">
        Basic <span className="text-[var(--black)] tabular-nums font-medium">{basic}</span>
      </span>
      <span className="font-mono text-xs md:text-sm tracking-wide text-gray-700 border border-dashed border-[var(--gray-border)] bg-white/50 px-4 py-2.5">
        Premium <span className="text-[var(--black)] tabular-nums font-medium">{premium}</span>
      </span>
      <span className="font-mono text-xs md:text-sm tracking-wide text-gray-700 border border-dashed border-[var(--gray-border)] bg-white/50 px-4 py-2.5">
        Enterprise <span className="text-[var(--black)] tabular-nums font-medium">{enterprise}</span>
      </span>
      <span className="font-mono text-xs md:text-sm tracking-wide text-gray-700 border border-dashed border-[var(--gray-border)] bg-white/50 px-4 py-2.5">
        Total active <span className="text-[var(--black)] tabular-nums font-medium">{revenue.activeTotal ?? basic + premium + enterprise}</span>
      </span>
    </div>
  )
}

function ElectricityComparisonHero({ comp, status }) {
  if (status === 'loading') {
    return <p className="font-mono text-sm text-gray-500">Electricity comparison: loading…</p>
  }
  if (status === 'error' || !comp) {
    return <p className="font-mono text-sm text-gray-500">Electricity comparison unavailable.</p>
  }
  const { micaSavingsPercent, micaPayFraction } = comp
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <article
          className={`${PANEL} px-5 py-8 md:py-10 flex flex-col gap-2 border-l-[3px] border-zinc-500`}
        >
          <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-zinc-400 uppercase">EU reference</p>
          <p className="font-display font-light text-3xl md:text-4xl text-zinc-50 tabular-nums">
            {formatUsdPerKwh(comp.euUsdPerKwh)}
          </p>
          <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">{comp.euSummary}</p>
          {comp.euSourceLive ? (
            <span className="font-mono text-[9px] uppercase text-red-mica/90 w-fit">Live wholesale</span>
          ) : comp.euComparisonUsesRetailProxy ? (
            <span className="font-mono text-[9px] uppercase text-zinc-500 w-fit">Retail proxy</span>
          ) : (
            <span className="font-mono text-[9px] uppercase text-zinc-500 w-fit">Reference</span>
          )}
        </article>
        <article
          className={`${PANEL} px-5 py-8 md:py-10 flex flex-col gap-2 border-l-[3px] border-zinc-500`}
        >
          <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-zinc-400 uppercase">US reference</p>
          <p className="font-display font-light text-3xl md:text-4xl text-zinc-50 tabular-nums">
            {formatUsdPerKwh(comp.usUsdPerKwh)}
          </p>
          <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">{comp.usSummary}</p>
          {comp.usSourceLive ? (
            <span className="font-mono text-[9px] uppercase text-red-mica/90 w-fit">Live API (50 states)</span>
          ) : (
            <span className="font-mono text-[9px] uppercase text-zinc-500 w-fit">Configured reference</span>
          )}
        </article>
        <article
          className={`${PANEL} px-5 py-8 md:py-10 flex flex-col gap-2 border-l-[3px] border-red-mica`}
        >
          <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-red-mica uppercase">Mica</p>
          <p className="font-display font-light text-3xl md:text-4xl text-zinc-50 tabular-nums">
            {formatUsdPerKwh(comp.micaEffectiveUsdPerKwh)}
          </p>
          <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">{comp.micaSummary}</p>
          <p className="font-mono text-[10px] text-zinc-500">
            vs blend {formatUsdPerKwh(comp.blendedReferenceUsdPerKwh)} × {Math.round(micaPayFraction * 100)}% (
            {micaSavingsPercent}% savings target)
          </p>
        </article>
      </div>
      <p className="font-mono text-[10px] md:text-xs text-gray-600 leading-relaxed max-w-4xl border-l-2 border-dashed border-[var(--gray-border)] pl-4">
        {comp.methodology} Configure <code className="text-gray-800">MICA_ELECTRICITY_PAY_FRACTION</code> on the
        API (default 0.5).
      </p>
    </div>
  )
}

function ElectricityStrip({ regions, status, liveMeta }) {
  if (status === 'loading') {
    return <p className="font-mono text-xs text-gray-500">Zone detail: loading…</p>
  }
  if (status === 'error' || !regions?.length) {
    return <p className="font-mono text-xs text-gray-500">Zone detail unavailable.</p>
  }
  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] md:text-xs text-gray-600 leading-relaxed max-w-3xl space-y-1">
        {liveMeta?.ok && liveMeta?.dataNote ? <p>{liveMeta.dataNote}</p> : null}
        <p>
          {liveMeta?.ok
            ? `EU: ENTSO-E day-ahead (Utilitarian). EUR→USD ECB (≈${liveMeta.eurToUsd != null ? Number(liveMeta.eurToUsd).toFixed(4) : '—'}). US national row: mean residential across 50 states (PriceOfElectricity).`
            : 'Live feeds unavailable; zone rows use reference values until overlays load.'}
          {liveMeta?.fetchedAt ? (
            <>
              {' '}
              Fetched {new Date(liveMeta.fetchedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              {liveMeta.fromCache ? ' (cached)' : ''}.
            </>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {regions.map((r) => (
          <div
            key={r.regionCode}
            className="border border-dashed border-[var(--gray-border)] bg-white/40 px-4 py-3 flex flex-col gap-1.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">{r.regionCode}</span>
              {r.isLive ? (
                <span className="font-mono text-[9px] tracking-wide uppercase bg-red-mica/15 text-red-mica px-1.5 py-0.5">
                  Live
                </span>
              ) : (
                <span className="font-mono text-[9px] tracking-wide uppercase bg-gray-200/80 text-gray-600 px-1.5 py-0.5">
                  {r.regionCode === 'EU' ? 'Reference' : 'Static'}
                </span>
              )}
            </div>
            <span className="font-display font-light text-lg text-[var(--black)] tabular-nums">
              ${Number(r.usdPerKwh).toFixed(3)}
              <span className="font-mono text-xs text-gray-600 font-normal"> /kWh</span>
            </span>
            {r.eurPerMwh != null && r.isLive ? (
              <span className="font-mono text-[10px] text-gray-600 tabular-nums">
                ≈ {Number(r.eurPerMwh).toFixed(2)} €/MWh wholesale
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-gray-700 leading-snug">{r.label}</span>
            {r.isLive && r.slotTimestamp ? (
              <span className="font-mono text-[10px] text-gray-500">
                Interval from {new Date(r.slotTimestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}{' '}
                UTC
              </span>
            ) : null}
            {r.spotZones?.length ? (
              <span className="font-mono text-[9px] text-gray-500">Zones: {r.spotZones.join(', ')}</span>
            ) : r.spotZone ? (
              <span className="font-mono text-[9px] text-gray-500">Zone: {r.spotZone}</span>
            ) : null}
            {r.sourceUrl ? (
              <a
                href={r.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-red-mica hover:underline truncate"
              >
                Source
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [dash, setDash] = useState(null)
  const [dashError, setDashError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setDashError(null)
    fetch(`${API_BASE}/analytics/dashboard`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const msg = `HTTP ${r.status}`
          if (!cancelled) setDashError(msg)
          throw new Error(msg)
        }
        return r.json()
      })
      .then((data) => {
        if (!cancelled) {
          setDashError(null)
          setDash({ ok: true, ...data })
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDash({ ok: false })
          setDashError((prev) => prev || e?.message || 'Network error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const status = dash === null ? 'loading' : dash.ok ? 'ready' : 'error'
  const rev = dash?.ok ? dash.subscriptionRevenue : null
  const revStatus = status === 'loading' ? 'loading' : status === 'error' || !rev ? 'error' : 'ready'
  const revenuePayload =
    rev && status === 'ready'
      ? {
          ok: true,
          ...rev,
        }
      : null

  const mmr = rev?.mmrUsd ?? 0
  const arr = rev?.arrUsd ?? 0
  const enterpriseNote = rev?.enterpriseExcludedFromMmr

  const grossSeries = dash?.ok ? dash.revenueSeries?.gross ?? [] : []
  const netSeries = dash?.ok ? dash.revenueSeries?.net ?? [] : []
  const revenueDates = dash?.ok ? dash.revenueSeries?.dates ?? [] : []
  const env = dash?.ok ? dash.environment : null
  const regions = dash?.ok ? dash.electricityByRegion ?? [] : []
  const electricityLive = dash?.ok ? dash.electricityLive ?? null : null
  const electricityComparison = dash?.ok ? dash.electricityComparison ?? null : null

  return (
    <div className="relative bg-cream noise-overlay text-[var(--black)] min-h-0 w-full">
      <div className="absolute inset-0 dot-grid-fine opacity-[0.14] pointer-events-none" aria-hidden />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12 lg:px-12 pb-12 md:pb-16">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-dashed border-[var(--gray-border)] pb-6 mb-10 md:mb-14 lg:mb-16">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-red-mica shrink-0" aria-hidden />
              <p className="font-mono text-[10px] md:text-xs tracking-[0.22em] text-gray-500 uppercase">Analytics</p>
            </div>
            <h1 className="font-display font-extralight text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--black)] leading-[1.02]">
              Mica dashboard
            </h1>
          </div>
          <p className="font-mono text-xs md:text-sm text-gray-600 max-w-md text-right leading-relaxed hidden sm:block">
            Aggregate indicators. Values publish with verified telemetry.
          </p>
        </header>

        {status === 'error' && dashError ? (
          <div
            className="mb-8 md:mb-10 p-4 md:p-5 border border-dashed border-red-mica/45 bg-red-mica/[0.06] font-mono text-xs md:text-sm text-red-mica leading-relaxed"
            role="alert"
          >
            <span className="font-semibold">Dashboard data unavailable.</span> {dashError}. Confirm{' '}
            <code className="text-[11px] opacity-90">{API_BASE}/analytics/dashboard</code> returns JSON (deploy
            the <code className="text-[11px] opacity-90">server</code> service).
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-start">
          <div className="flex flex-col gap-8 md:gap-10 min-w-0">
            <CategoryHeading eyebrow="Subscriptions & billing" title="Overview" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <RevenueStat
                id="metric-mmr"
                label="MMR"
                sublabel="Monthly recurring revenue, active subscriptions"
                amount={mmr}
                status={revStatus}
              />
              <RevenueStat
                id="metric-arr"
                label="ARR"
                sublabel="Annualized from current MMR"
                amount={arr}
                status={revStatus}
              />
            </div>
            <ActivePlanPills revenue={revenuePayload} revStatus={revStatus} />

            <div id="markets-power">
              <CategoryHeading eyebrow="Markets" title="Power economics vs Mica" />
              <ElectricityComparisonHero comp={electricityComparison} status={status} />
              <details className="mt-6 group">
                <summary className="font-mono text-xs text-gray-600 cursor-pointer select-none hover:text-red-mica list-none flex items-center gap-2">
                  <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
                    ▸
                  </span>
                  All zones and sources
                </summary>
                <div className="mt-4">
                  <ElectricityStrip regions={regions} status={status} liveMeta={electricityLive} />
                </div>
              </details>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-10 min-w-0">
            <div>
              <CategoryHeading eyebrow="Network" title="Key metrics" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <KpiTile
                  large
                  metricId="users"
                  label="Users"
                  sublabel="Registered accounts"
                  value={status === 'ready' ? String(dash.users) : undefined}
                />
                <KpiTile
                  large
                  metricId="api-keys"
                  label="API keys"
                  sublabel="Active (non-revoked)"
                  value={status === 'ready' ? String(dash.apiKeysActive) : undefined}
                />
                <KpiTile
                  large
                  metricId="mvm-created"
                  label="MVM created"
                  sublabel="Lifetime"
                  value={status === 'ready' ? String(dash.mvmCreated) : undefined}
                />
                <KpiTile
                  large
                  metricId="mvm-running"
                  label="MVM running"
                  sublabel="Current"
                  value={status === 'ready' ? String(dash.mvmRunning) : undefined}
                />
              </div>
            </div>

            <div>
              <CategoryHeading eyebrow="Sustainability" title="Environment" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                <KpiTile
                  large
                  metricId="energy-savings"
                  label="Energy cost savings"
                  sublabel="USD cumulative (modeled)"
                  value={status === 'ready' && env ? formatUsd(env.energySavingsUsd) : undefined}
                />
                <KpiTile
                  large
                  metricId="co2-reduced"
                  label="CO₂ reduced"
                  sublabel="Tonnes CO₂e (modeled)"
                  value={status === 'ready' && env ? formatTonnes(env.co2ReducedTonnes) : undefined}
                />
                <KpiTile
                  large
                  metricId="kwh-shifted"
                  label="Compute shifted"
                  sublabel="Cumulative kWh (modeled)"
                  value={status === 'ready' ? formatKwh(dash.cumulativeKwhShifted) : undefined}
                />
              </div>
              {status === 'ready' && env?.methodology ? (
                <p className="mt-4 font-mono text-[10px] md:text-xs text-gray-600 leading-relaxed max-w-3xl">
                  {env.methodology}
                </p>
              ) : (
                <p className="mt-4 font-mono text-xs md:text-sm text-gray-600 leading-relaxed">
                  {status === 'loading' ? 'Loading environment model…' : 'Environment metrics unavailable.'}
                </p>
              )}
            </div>

            <div>
              <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-gray-500 uppercase mb-3">Fleet</p>
              <PendingStrip>
                Fleet activity charts: Pending. Series will appear when operator telemetry is connected.
              </PendingStrip>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6 md:gap-8 xl:gap-10 w-full min-w-0 mt-4 lg:mt-6">
            <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] text-gray-500 uppercase">
              Subscription economics
            </p>
            <div className="flex flex-col gap-6 md:gap-8 xl:gap-10 w-full">
              <ChartShell
                banner
                hero
                title="Gross revenue"
                subtitle="MMR implied by active basic & premium seats (enterprise excluded until priced)."
                yLabel="USD / month"
                xLabel="Day (UTC)"
                series={grossSeries}
                stroke="#fb7185"
                showUsdYTicks
                dateLabels={revenueDates}
                scrubbable
                footerNote={
                  grossSeries?.length >= 2
                    ? 'Daily series (UTC). Tier-priced MMR (Basic $40/mo, Premium $150/mo). Hover or drag for date and USD.'
                    : 'Awaiting series data.'
                }
              />
              <ChartShell
                banner
                hero
                title="Net revenue"
                subtitle="After blended processing take (typically ~84–92% of gross MMR; varies by day in the model)."
                yLabel="USD / month"
                xLabel="Day (UTC)"
                series={netSeries}
                stroke="#e2e8f0"
                showUsdYTicks
                dateLabels={revenueDates}
                scrubbable
                footerNote={
                  netSeries?.length >= 2
                    ? 'Daily series (UTC). Net uses a day-varying fee model, so the ratio to gross is not fixed. Hover or drag for date and USD.'
                    : 'Awaiting series data.'
                }
              />
            </div>
            {enterpriseNote ? (
              <p className="font-mono text-xs md:text-sm text-gray-600 leading-relaxed">
                Enterprise seats are active but not included in MMR until a contract value is on file.
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mt-14 md:mt-20 pt-6 border-t border-dashed border-[var(--gray-border)] flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-gray-600 tracking-wide">mica network</p>
          <a
            href="https://mica.energy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-gray-600 hover:text-red-mica transition-colors"
          >
            mica.energy
          </a>
        </footer>
      </div>
    </div>
  )
}
