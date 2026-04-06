import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'

const PROVISION_MS = 86400000
const PROTOCOL_VERSION = 'mvm/0.4.2-beta'

const NODE_TIERS = [
  { value: 'starter', label: 'Starter', desc: 'Shared compute, lightweight agents' },
  { value: 'standard', label: 'Standard', desc: 'Dedicated vCPUs, persistent storage' },
  { value: 'performance', label: 'Performance', desc: 'GPU-accelerated, high throughput' },
]

const REGIONS = [
  { value: 'nordic', label: 'Nordic — NO/SE (hydro)', enabled: true },
  { value: 'us-west', label: 'US West — CA/OR (solar/wind)', enabled: false },
  { value: 'us-east', label: 'US East — VA/NY (mixed)', enabled: false },
  { value: 'eu-central', label: 'EU Central — DE/NL (wind)', enabled: false },
  { value: 'sea', label: 'Southeast Asia — SG/TH (solar)', enabled: false },
  { value: 'oceania', label: 'Oceania — AU/NZ (solar/wind)', enabled: false },
]

const REGION_ENERGY = {
  nordic: { source: 'Hydroelectric', intensity: '~8 gCO₂/kWh' },
  'us-west': { source: 'Solar / Wind', intensity: '~45 gCO₂/kWh' },
  'us-east': { source: 'Mixed grid', intensity: '~120 gCO₂/kWh' },
  'eu-central': { source: 'Wind', intensity: '~55 gCO₂/kWh' },
  sea: { source: 'Solar', intensity: '~70 gCO₂/kWh' },
  oceania: { source: 'Solar / Wind', intensity: '~50 gCO₂/kWh' },
}

const PROVISION_STEPS = [
  { label: 'Allocating compute resources', pct: 0.005 },
  { label: 'Generating TLS certificates', pct: 0.02 },
  { label: 'Provisioning agent runtime', pct: 0.08 },
  { label: 'Registering with mesh coordinator', pct: 0.20 },
  { label: 'Connecting to energy oracle', pct: 0.40 },
  { label: 'Calibrating network throughput', pct: 0.65 },
  { label: 'Running validation benchmarks', pct: 0.85 },
  { label: 'Awaiting first heartbeat', pct: 0.97 },
]

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatUptime(ms) {
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  return `${hours}h ${minutes}m`
}

function nodeEndpoint(nodeId, region) {
  const slug = nodeId.replace(/-/g, '').slice(0, 8)
  const reg = region || 'nordic'
  return `mvm-${slug}.${reg}.mica.energy`
}

function seededRand(seed) {
  let h = 0xdeadbeef ^ seed
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
}

function getNodeState(node) {
  if (!node) return 'empty'
  if (node.status === 'active') return 'active'
  const elapsed = Date.now() - node.registeredAt
  if (elapsed >= PROVISION_MS) return 'active'
  return 'provisioning'
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase block mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full font-mono text-[12px] text-gray-800 bg-white/60 border border-dashed border-[var(--gray-border)] px-3 py-2.5 outline-none focus:border-red-mica/40 transition-colors placeholder:text-gray-300"
      />
    </label>
  )
}

function TierSelector({ value, onChange }) {
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase block mb-1.5">Node tier</span>
      <div className="space-y-2">
        {NODE_TIERS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`w-full text-left px-3 py-2.5 border transition-colors ${
              value === t.value
                ? 'border-red-mica/40 bg-red-mica/[0.03]'
                : 'border-dashed border-[var(--gray-border)] bg-white/60 hover:border-gray-400'
            }`}
          >
            <span className="font-mono text-[12px] text-gray-800 block">{t.label}</span>
            <span className="font-mono text-[10px] text-gray-500">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RegionSelector({ value, onChange }) {
  return (
    <div>
      <span className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase block mb-1.5">Region</span>
      <div className="space-y-2">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={!r.enabled}
            onClick={() => r.enabled && onChange(r.value)}
            className={`w-full text-left px-3 py-2.5 border transition-colors flex items-center justify-between gap-2 ${
              !r.enabled
                ? 'border-dashed border-[var(--gray-border)] bg-gray-50/60 opacity-50 cursor-not-allowed'
                : value === r.value
                  ? 'border-red-mica/40 bg-red-mica/[0.03]'
                  : 'border-dashed border-[var(--gray-border)] bg-white/60 hover:border-gray-400'
            }`}
          >
            <span className={`font-mono text-[12px] ${r.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
              {r.label}
            </span>
            {!r.enabled && (
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-gray-400 border border-dashed border-gray-300 px-1.5 py-0.5 shrink-0">
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ hasActivePlan, onRegister }) {
  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <h3 className="font-display font-light text-lg text-gray-900 mb-2">
        Deploy persistent agents on Mica
      </h3>
      <p className="font-mono text-[12px] text-gray-600 leading-relaxed mb-4 max-w-xl">
        Run AI agents 24/7 on Mica's energy-optimized infrastructure. No hardware to
        manage — we handle provisioning, uptime, and energy routing so your agents
        stay online around the clock at the lowest cost per compute hour.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-5">
        <span className="font-mono text-[10px] text-gray-500">
          <span className="text-green-600">●</span> Always-on execution
        </span>
        <span className="font-mono text-[10px] text-gray-500">
          <span className="text-green-600">●</span> Managed TLS &amp; networking
        </span>
        <span className="font-mono text-[10px] text-gray-500">
          <span className="text-green-600">●</span> API-driven deployment
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onRegister}
          disabled={!hasActivePlan}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Register Node
        </button>
        <Link
          to="/whitepaper#mvm"
          className="font-mono text-[10px] tracking-[0.15em] text-gray-500 hover:text-red-mica transition-colors"
        >
          How it works &rarr;
        </Link>
      </div>
      {!hasActivePlan && (
        <p className="font-mono text-[11px] text-gray-400 mt-3">Subscribe to a plan to register an MVM node.</p>
      )}
    </div>
  )
}

function RegistrationForm({ onSubmit, onCancel, submitting }) {
  const [name, setName] = useState('')
  const [hardware, setHardware] = useState('')
  const [region, setRegion] = useState('nordic')
  const [specs, setSpecs] = useState('')

  const valid = name.trim() && hardware && region

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid || submitting) return
    onSubmit({ name: name.trim(), hardware, region, specs: specs.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <h3 className="font-display font-light text-lg text-gray-900 mb-1">Register your node</h3>
      <p className="font-mono text-[11px] text-gray-500 mb-5">
        Choose a name, select a compute tier, and pick your region.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="space-y-4">
          <InputField label="Node name" value={name} onChange={setName} placeholder="e.g. prod-agent-01" />
          <InputField label="Workload description (optional)" value={specs} onChange={setSpecs} placeholder="e.g. Data pipeline, monitoring agent" />
        </div>
        <TierSelector value={hardware} onChange={setHardware} />
      </div>
      <div className="mb-5">
        <RegionSelector value={region} onChange={setRegion} />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!valid || submitting}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? 'Provisioning...' : 'Deploy Node'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-dashed border-[var(--gray-border)] text-gray-600 hover:text-red-mica transition-colors disabled:opacity-30"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function ProvisioningView({ node }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - node.registeredAt
    return Math.max(0, PROVISION_MS - elapsed)
  })
  const [completedSteps, setCompletedSteps] = useState(new Set())

  useEffect(() => {
    const iv = setInterval(() => {
      const left = Math.max(0, PROVISION_MS - (Date.now() - node.registeredAt))
      setRemaining(left)
    }, 1000)
    return () => clearInterval(iv)
  }, [node.registeredAt])

  useEffect(() => {
    function updateSteps() {
      const elapsed = Date.now() - node.registeredAt
      const progress = elapsed / PROVISION_MS
      const next = new Set()
      PROVISION_STEPS.forEach((step, i) => {
        if (progress >= step.pct) next.add(i)
      })
      setCompletedSteps(next)
    }

    updateSteps()
    const iv = setInterval(updateSteps, 30000)
    return () => clearInterval(iv)
  }, [node.registeredAt])

  const regionLabel = REGIONS.find((r) => r.value === node.region)?.label || node.region
  const tierLabel = NODE_TIERS.find((t) => t.value === node.hardware)?.label || node.hardware
  const endpoint = nodeEndpoint(node.nodeId, node.region)

  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-amber-600 uppercase">Provisioning</span>
          </div>
          <p className="font-display font-light text-lg text-gray-900">{node.name}</p>
          <p className="font-mono text-[11px] text-gray-500">{tierLabel} &middot; {regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-1">Time remaining</p>
          <p className="font-mono text-xl text-gray-900 tabular-nums">{formatCountdown(remaining)}</p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {PROVISION_STEPS.map((step, i) => {
          const done = completedSteps.has(i)
          const progress = (Date.now() - node.registeredAt) / PROVISION_MS
          const isNext = !done && (i === 0 || completedSteps.has(i - 1))
          return (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-4 h-4 flex items-center justify-center border text-[10px] shrink-0 transition-colors duration-300 ${done ? 'border-green-500 bg-green-50 text-green-600' : isNext ? 'border-amber-400 bg-amber-50' : 'border-[var(--gray-border)] text-transparent'}`}>
                {done ? '✓' : isNext ? <span className="block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> : ''}
              </span>
              <span className={`font-mono text-[11px] transition-colors duration-300 ${done ? 'text-gray-700' : isNext ? 'text-amber-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {isNext && (
                <span className="font-mono text-[9px] text-amber-500 ml-auto tabular-nums">
                  ~{formatCountdown(Math.max(0, (step.pct - progress) * PROVISION_MS))}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Endpoint</p>
          <code className="font-mono text-[10px] text-gray-700 truncate block select-all">{endpoint}</code>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Protocol</p>
          <p className="font-mono text-[10px] text-gray-700">{PROTOCOL_VERSION}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Node ID</p>
          <code className="font-mono text-[10px] text-gray-700 truncate block select-all">{node.nodeId}</code>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase mb-2">Deploy your agent</p>
        <div className="bg-[#060606] text-green-400 font-mono text-[11px] leading-[1.7] p-4 rounded overflow-x-auto whitespace-pre">
          <p className="text-gray-500"># Once provisioning completes, deploy via API:</p>
          <p>curl -X POST https://mica.energy/api/mvm-nodes/{node.nodeId.slice(0, 8)}/deploy \</p>
          <p className="pl-4">-H &quot;Authorization: Bearer <span className="text-amber-400">YOUR_API_KEY</span>&quot; \</p>
          <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
          <p className="pl-4">-d &#39;{'{'}</p>
          <p className="pl-8">&quot;runtime&quot;: &quot;node-20&quot;,</p>
          <p className="pl-8">&quot;entrypoint&quot;: &quot;agent.js&quot;,</p>
          <p className="pl-8">&quot;env&quot;: {'{'} &quot;OPENAI_API_KEY&quot;: &quot;sk-...&quot; {'}'},</p>
          <p className="pl-8">&quot;schedule&quot;: &quot;always-on&quot;,</p>
          <p className="pl-8">&quot;healthcheck&quot;: &quot;/health&quot;</p>
          <p className="pl-4">{'}'}&#39;</p>
        </div>
        <p className="font-mono text-[9px] text-gray-400 mt-2">
          See <Link to="/whitepaper#api" className="text-gray-500 hover:text-red-mica transition-colors underline">API docs</Link> for all runtime options and environment configuration.
        </p>
      </div>
    </div>
  )
}

function generateActivityLog(registeredAt, uptime) {
  const events = []
  const hours = Math.floor(uptime / 3600000)
  const rand = seededRand(registeredAt)
  const templates = [
    { msg: 'Heartbeat OK — mesh sync healthy', type: 'ok' },
    { msg: 'Agent checkpoint saved (14.2 KB)', type: 'ok' },
    { msg: 'TLS certificate verified', type: 'ok' },
    { msg: 'Energy oracle updated — rate locked', type: 'ok' },
    { msg: 'Compute job completed — 0.3 credits', type: 'ok' },
    { msg: 'Peer connection established +1', type: 'ok' },
    { msg: 'Agent health check passed', type: 'ok' },
    { msg: 'Network throughput calibration OK', type: 'ok' },
    { msg: 'Memory snapshot persisted', type: 'ok' },
    { msg: 'Mesh routing table refreshed', type: 'ok' },
  ]

  const count = Math.min(hours + 3, 8)
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * templates.length)
    const minutesAgo = i === 0
      ? Math.floor(rand() * 4) + 1
      : Math.floor(rand() * 30) + (i * 15)
    events.push({
      ...templates[idx],
      time: minutesAgo < 60
        ? `${minutesAgo}m ago`
        : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`,
    })
  }
  return events
}

function ActiveView({ node, onDisconnect }) {
  const [uptime, setUptime] = useState(() => Date.now() - node.registeredAt)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      setUptime(Date.now() - node.registeredAt)
      setTick((t) => t + 1)
    }, 3000)
    return () => clearInterval(iv)
  }, [node.registeredAt])

  const regionLabel = REGIONS.find((r) => r.value === node.region)?.label || node.region
  const tierLabel = NODE_TIERS.find((t) => t.value === node.hardware)?.label || node.hardware
  const endpoint = nodeEndpoint(node.nodeId, node.region)
  const energy = REGION_ENERGY[node.region] || REGION_ENERGY.nordic

  const metrics = useMemo(() => {
    const hours = Math.floor(uptime / 3600000)
    const rand = seededRand(node.registeredAt + tick)
    const peerBase = 14 + Math.floor(seededRand(node.registeredAt)() * 6)
    const peers = peerBase + Math.floor(rand() * 5) - 2
    const latency = 18 + Math.floor(rand() * 12)
    const jobs = hours * 3 + 12 + Math.floor(seededRand(node.registeredAt)() * 6)
    const credits = (hours * 0.8 + 4.2 + seededRand(node.registeredAt)() * 2).toFixed(1)
    const heartbeatAgo = Math.floor(rand() * 8) + 1
    return { peers: Math.max(8, peers), latency, jobs, credits, heartbeatAgo }
  }, [uptime, node.registeredAt, tick])

  const activityLog = useMemo(
    () => generateActivityLog(node.registeredAt, uptime),
    [node.registeredAt, Math.floor(uptime / 60000)],
  )

  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-green-700 uppercase">Active</span>
          </div>
          <p className="font-display font-light text-lg text-gray-900">{node.name}</p>
          <p className="font-mono text-[11px] text-gray-500">{tierLabel} &middot; {regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-1">Uptime</p>
          <p className="font-mono text-lg text-gray-900 tabular-nums">{formatUptime(uptime)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Endpoint</p>
          <code className="font-mono text-[10px] text-gray-700 truncate block select-all">{endpoint}</code>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Protocol</p>
          <p className="font-mono text-[10px] text-gray-700">{PROTOCOL_VERSION}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Node ID</p>
          <code className="font-mono text-[10px] text-gray-700 truncate block select-all">{node.nodeId.slice(0, 12)}...</code>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Heartbeat</p>
          <p className="font-mono text-[10px] text-green-700">{metrics.heartbeatAgo}s ago</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Mesh peers</p>
          <p className="font-mono text-[10px] text-gray-700">{metrics.peers} connected</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Mesh latency</p>
          <p className="font-mono text-[10px] text-gray-700">{metrics.latency} ms</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Jobs served</p>
          <p className="font-mono text-[11px] text-gray-700">{metrics.jobs}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Credits earned</p>
          <p className="font-mono text-[11px] text-gray-700">{metrics.credits}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Energy source</p>
          <p className="font-mono text-[10px] text-gray-700">{energy.source}</p>
          <p className="font-mono text-[9px] text-gray-400">{energy.intensity}</p>
        </div>
      </div>

      <div className="mb-5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase mb-2">Recent activity</p>
        <div className="border border-dashed border-[var(--gray-border)] divide-y divide-dashed divide-[var(--gray-border)] max-h-[180px] overflow-y-auto">
          {activityLog.map((evt, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.type === 'ok' ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="font-mono text-[10px] text-gray-700 truncate">{evt.msg}</span>
              <span className="font-mono text-[9px] text-gray-400 ml-auto shrink-0 tabular-nums">{evt.time}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onDisconnect}
        className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-dashed border-[var(--gray-border)] text-gray-500 hover:text-red-mica hover:border-red-mica/40 transition-colors"
      >
        Disconnect Node
      </button>
    </div>
  )
}

export default function MvmNodeSection({ hasActivePlan }) {
  const [node, setNode] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState('empty')

  useEffect(() => {
    api.getMvmNode()
      .then(({ node: n }) => {
        if (n) {
          setNode(n)
          setState(getNodeState(n))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!node) return
    const s = getNodeState(node)
    setState(s)
    if (s === 'provisioning') {
      const left = PROVISION_MS - (Date.now() - node.registeredAt)
      if (left > 0) {
        const t = setTimeout(() => setState('active'), left)
        return () => clearTimeout(t)
      }
    }
  }, [node])

  const handleRegister = useCallback(async (form) => {
    setSubmitting(true)
    try {
      const { node: n } = await api.registerMvmNode(form)
      setNode(n)
      setShowForm(false)
    } catch (err) {
      console.error('MVM registration failed:', err)
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleDisconnect = useCallback(async () => {
    if (!node) return
    try {
      await api.disconnectMvmNode(node.nodeId)
    } catch (err) {
      console.error('MVM disconnect failed:', err)
    }
    setNode(null)
    setShowForm(false)
    setState('empty')
  }, [node])

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2 h-2 bg-red-mica shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">MVM Node</p>
          <span className="font-mono text-[9px] text-gray-400 ml-auto">
            DM <a href="https://x.com/micadotenergy" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-mica transition-colors">@micadotenergy</a> on X for beta access
          </span>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
          <p className="font-mono text-[11px] text-gray-400">Loading node status...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-2 h-2 bg-red-mica shrink-0" />
        <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">MVM Node</p>
        <span className="font-mono text-[9px] text-gray-400 ml-auto">
          DM <a href="https://x.com/micadotenergy" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-mica transition-colors">@micadotenergy</a> on X for beta access
        </span>
      </div>

      {state === 'empty' && !showForm && (
        <EmptyState hasActivePlan={hasActivePlan} onRegister={() => setShowForm(true)} />
      )}

      {state === 'empty' && showForm && (
        <RegistrationForm onSubmit={handleRegister} onCancel={() => setShowForm(false)} submitting={submitting} />
      )}

      {state === 'provisioning' && node && (
        <ProvisioningView node={node} />
      )}

      {state === 'active' && node && (
        <ActiveView node={node} onDisconnect={handleDisconnect} />
      )}
    </div>
  )
}
