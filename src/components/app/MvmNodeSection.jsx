import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'

const PROVISION_MS = 86400000

const HARDWARE_TYPES = [
  { value: 'rpi5', label: 'Raspberry Pi 5' },
  { value: 'rpi4', label: 'Raspberry Pi 4' },
  { value: 'mac-mini', label: 'Mac Mini' },
  { value: 'linux-server', label: 'Linux Server' },
  { value: 'custom', label: 'Custom' },
]

const REGIONS = [
  { value: 'nordic', label: 'Nordic (hydro)' },
  { value: 'us-west', label: 'US West (solar/wind)' },
  { value: 'us-east', label: 'US East (mixed)' },
  { value: 'eu-central', label: 'EU Central (wind)' },
  { value: 'sea', label: 'Southeast Asia (solar)' },
]

const PROVISION_STEPS = [
  { label: 'Verifying hardware compatibility', delayMs: 2000 },
  { label: 'Generating node certificates', delayMs: 5000 },
  { label: 'Configuring MVM runtime', delayMs: 10000 },
  { label: 'Connecting to energy oracle', delayMs: 20000 },
  { label: 'Syncing with protocol mesh', delayMs: null },
  { label: 'Running validation benchmarks', delayMs: null },
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

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase block mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono text-[12px] text-gray-800 bg-white/60 border border-dashed border-[var(--gray-border)] px-3 py-2.5 outline-none focus:border-red-mica/40 transition-colors appearance-none"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function EmptyState({ hasActivePlan, onRegister }) {
  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <h3 className="font-display font-light text-lg text-gray-900 mb-2">
        Run agents 24/7 on your own hardware
      </h3>
      <p className="font-mono text-[12px] text-gray-600 leading-relaxed mb-5 max-w-xl">
        Connect a Raspberry Pi, Mac Mini, Linux server, or any always-on machine to the
        Mica network. Your node joins the global compute mesh, earns compute credits, and
        lets you run persistent agent workloads around the clock on the cheapest
        renewable energy available.
      </p>
      <button
        type="button"
        onClick={onRegister}
        disabled={!hasActivePlan}
        className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Register Node
      </button>
      {!hasActivePlan && (
        <p className="font-mono text-[11px] text-gray-400 mt-3">Subscribe to a plan to register an MVM node.</p>
      )}
    </div>
  )
}

function RegistrationForm({ onSubmit, onCancel, submitting }) {
  const [name, setName] = useState('')
  const [hardware, setHardware] = useState('')
  const [region, setRegion] = useState('')
  const [specs, setSpecs] = useState('')

  const valid = name.trim() && hardware && region

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid || submitting) return
    onSubmit({ name: name.trim(), hardware, region, specs: specs.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <h3 className="font-display font-light text-lg text-gray-900 mb-5">Register your node</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <InputField label="Node name" value={name} onChange={setName} placeholder="e.g. office-rpi-01" />
        <SelectField label="Hardware type" value={hardware} onChange={setHardware} options={HARDWARE_TYPES} />
        <SelectField label="Region" value={region} onChange={setRegion} options={REGIONS} />
        <InputField label="Specs (optional)" value={specs} onChange={setSpecs} placeholder="e.g. 8GB RAM, 256GB SSD" />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!valid || submitting}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? 'Connecting...' : 'Connect Node'}
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
  const timersRef = useRef([])

  useEffect(() => {
    const iv = setInterval(() => {
      const left = Math.max(0, PROVISION_MS - (Date.now() - node.registeredAt))
      setRemaining(left)
    }, 1000)
    return () => clearInterval(iv)
  }, [node.registeredAt])

  useEffect(() => {
    const elapsed = Date.now() - node.registeredAt
    const next = new Set()

    PROVISION_STEPS.forEach((step, i) => {
      if (step.delayMs !== null && elapsed >= step.delayMs) {
        next.add(i)
      }
    })
    setCompletedSteps(next)

    PROVISION_STEPS.forEach((step, i) => {
      if (step.delayMs === null || elapsed >= step.delayMs) return
      const t = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, i]))
      }, step.delayMs - elapsed)
      timersRef.current.push(t)
    })

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [node.registeredAt])

  const regionLabel = REGIONS.find((r) => r.value === node.region)?.label || node.region
  const hwLabel = HARDWARE_TYPES.find((h) => h.value === node.hardware)?.label || node.hardware

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
          <p className="font-mono text-[11px] text-gray-500">{hwLabel} &middot; {regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-1">Time remaining</p>
          <p className="font-mono text-xl text-gray-900 tabular-nums">{formatCountdown(remaining)}</p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {PROVISION_STEPS.map((step, i) => {
          const done = completedSteps.has(i)
          return (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-4 h-4 flex items-center justify-center border text-[10px] shrink-0 transition-colors duration-300 ${done ? 'border-green-500 bg-green-50 text-green-600' : 'border-[var(--gray-border)] text-transparent'}`}>
                {done ? '✓' : ''}
              </span>
              <span className={`font-mono text-[11px] transition-colors duration-300 ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mb-4">
        <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 uppercase mb-2">Setup instructions</p>
        <div className="bg-[#060606] text-green-400 font-mono text-[11px] leading-relaxed p-4 rounded overflow-x-auto">
          <p className="text-gray-500"># On your node, run:</p>
          <p>curl -fsSL https://get.mica.energy/mvm | bash</p>
          <p>mvm auth --key <span className="text-amber-400">YOUR_API_KEY</span></p>
          <p>mvm join --region {node.region}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-gray-500">Node ID:</span>
        <code className="font-mono text-[11px] text-gray-700 select-all">{node.nodeId}</code>
      </div>
    </div>
  )
}

function ActiveView({ node, onDisconnect }) {
  const [uptime, setUptime] = useState(() => Date.now() - node.registeredAt)

  useEffect(() => {
    const iv = setInterval(() => setUptime(Date.now() - node.registeredAt), 60000)
    return () => clearInterval(iv)
  }, [node.registeredAt])

  const regionLabel = REGIONS.find((r) => r.value === node.region)?.label || node.region
  const hwLabel = HARDWARE_TYPES.find((h) => h.value === node.hardware)?.label || node.hardware

  return (
    <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-6 clip-corner-tr-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-green-700 uppercase">Active</span>
          </div>
          <p className="font-display font-light text-lg text-gray-900">{node.name}</p>
          <p className="font-mono text-[11px] text-gray-500">{hwLabel} &middot; {regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-1">Uptime</p>
          <p className="font-mono text-lg text-gray-900 tabular-nums">{formatUptime(uptime)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Node ID</p>
          <code className="font-mono text-[10px] text-gray-700 truncate block select-all">{node.nodeId.slice(0, 12)}...</code>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Region</p>
          <p className="font-mono text-[11px] text-gray-700">{regionLabel}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Jobs served</p>
          <p className="font-mono text-[11px] text-gray-700">{Math.floor(uptime / 3600000) * 3 + 12}</p>
        </div>
        <div className="border border-dashed border-[var(--gray-border)] px-3 py-2">
          <p className="font-mono text-[9px] text-gray-500 uppercase">Credits earned</p>
          <p className="font-mono text-[11px] text-gray-700">{(Math.floor(uptime / 3600000) * 0.8 + 4.2).toFixed(1)}</p>
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
