import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import Footer from '../components/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

function Section({ id, number, label, children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`pt-16 md:pt-24 ${className}`}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
    >
      <div className="flex items-center gap-4 mb-6">
        <span className="font-mono text-[11px] text-red-mica font-semibold">{number}</span>
        <span className="font-mono text-[10px] tracking-[0.3em] text-gray-500 uppercase">
          {label}
        </span>
      </div>
      {children}
    </motion.section>
  )
}

function Stat({ value, label }) {
  return (
    <div className="border border-dashed border-[var(--gray-border)] px-5 py-4 clip-corner-tr-sm">
      <p className="font-display font-extralight text-2xl md:text-3xl text-gray-900">{value}</p>
      <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function RoadmapItem({ quarter, title, items }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className="border-l-2 border-red-mica/30 pl-6 pb-10 last:pb-0 relative"
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-red-mica" />
      <p className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-1">
        {quarter}
      </p>
      <h4 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">{title}</h4>
      <ul className="list-disc pl-5 space-y-1.5 font-mono text-[13px] text-gray-700 leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </motion.div>
  )
}

const TOC = [
  { id: 'abstract', label: 'Abstract' },
  { id: 'introduction', label: 'The AI Energy Crisis' },
  { id: 'problem', label: 'Why Current Infrastructure Fails' },
  { id: 'opportunity', label: 'Energy Arbitrage for AI' },
  { id: 'architecture', label: 'Protocol Architecture' },
  { id: 'mvm', label: 'Mica Virtual Machine' },
  { id: 'api', label: 'API & Key Utilities' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'conclusion', label: 'Conclusion' },
]

const ROADMAP = [
  {
    quarter: 'Q1 2026',
    title: 'Foundation',
    items: [
      'Protocol design and specification finalized.',
      'Core smart contracts deployed to testnet (job lifecycle, compute proofs, settlement).',
      'REST API alpha: job submission, status polling, energy routing.',
      'First node operator partnerships signed in Nordic hydro and US wind regions.',
    ],
  },
  {
    quarter: 'Q2 2026',
    title: 'MVM Alpha',
    items: [
      'MVM alpha launch on testnet across 3 energy regions (Nordic hydro, US wind, Southeast Asia solar).',
      'Claude Code plugin beta released — MCP tools for energy-routed agent compute.',
      '10+ node operators onboarded with live energy-price oracle feeds.',
      'Public API documentation and developer sandbox.',
    ],
  },
  {
    quarter: 'Q3 2026',
    title: 'Mainnet Beta',
    items: [
      'Mainnet beta with verifiable compute proofs settled on-chain.',
      'Token launch for node staking and compute credits.',
      'Analytics dashboard live for Premium subscribers.',
      'Python and TypeScript SDKs released.',
    ],
  },
  {
    quarter: 'Q4 2026',
    title: 'Full Mainnet',
    items: [
      'Production mainnet with full SLA guarantees for Enterprise tier.',
      '50+ node operators across 6+ energy regions.',
      'Go SDK released. Dedicated infrastructure option for Enterprise.',
      'On-chain audit trail for regulatory compliance.',
    ],
  },
  {
    quarter: 'Q1 2027',
    title: 'Governance & Scale',
    items: [
      'Governance rollout — token holders vote on protocol parameters (fees, oracle sources, staking minimums).',
      'Open node operator program (permissionless onboarding).',
      'Cross-chain settlement live on Base, Ethereum, and Solana.',
      '100+ node operators. Batch scheduling for off-peak energy windows.',
    ],
  },
]

export default function Whitepaper() {
  useEffect(() => {
    document.title = 'mica — Whitepaper'
    return () => { document.title = 'mica' }
  }, [])

  return (
    <div className="noise-overlay min-h-screen bg-cream">
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

      <div className="relative z-10 min-w-0">
        <div className="px-8 md:px-16 lg:px-24 pt-28 md:pt-36 pb-16 md:pb-24 max-w-4xl">

          {/* ── Title block ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <span className="w-2.5 h-2.5 bg-red-mica shrink-0" />
              <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500">Whitepaper</p>
              <span className="font-mono text-[10px] text-gray-400">v1.0 — March 2026</span>
            </div>

            <h1 className="font-display font-extralight text-4xl md:text-6xl lg:text-[4rem] leading-[1.08] text-gray-900 mb-4">
              mica protocol
            </h1>
            <p className="font-mono text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl mb-12">
              Decentralized energy routing for AI compute.
            </p>
          </motion.div>

          {/* ── Table of contents ── */}
          <motion.nav
            className="border border-dashed border-[var(--gray-border)] p-6 mb-4 clip-corner-tr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            aria-label="Table of contents"
          >
            <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-4">
              Contents
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
              {TOC.map(({ id, label }, i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="font-mono text-[12px] text-gray-700 hover:text-red-mica transition-colors"
                  >
                    <span className="text-red-mica mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </motion.nav>

          {/* ── 01 Abstract ── */}
          <Section id="abstract" number="01" label="Abstract">
            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p>
                The global surge in artificial intelligence is creating an unprecedented demand for
                compute infrastructure. Data centers are projected to consume over 945 TWh of
                electricity by 2030 — more than Japan's total annual consumption. Yet the cost of
                that electricity varies by an order of magnitude depending on geography, energy mix,
                and time of day.
              </p>
              <p>
                mica is a decentralized protocol that routes AI workloads to the cheapest, cleanest
                energy sources available. By coordinating a global mesh of compute nodes through
                smart contracts, energy-price oracles, and verifiable compute proofs, mica delivers
                agent-grade infrastructure at a fraction of the cost of centralized cloud providers —
                with full transparency and on-chain settlement.
              </p>
              <p>
                This paper describes the protocol architecture, the Mica Virtual Machine (MVM) for
                distributed execution, the energy arbitrage thesis that makes it economically viable,
                the API subscription model, and a quarterly roadmap from Q1 2026 through Q1 2027.
              </p>
            </div>
          </Section>

          {/* ── 02 Introduction: The AI Energy Crisis ── */}
          <Section id="introduction" number="02" label="The AI Energy Crisis">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              AI is the largest new source of electricity demand in a generation
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <Stat value="945 TWh" label="Projected data center consumption by 2030 (IEA)" />
              <Stat value="4×" label="AI data center demand growth by 2030" />
              <Stat value="$600B+" label="Hyperscaler AI capex in 2026" />
              <Stat value="⅔" label="Of all AI compute is now inference" />
            </div>

            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p>
                According to the International Energy Agency's <em>Electricity 2026</em> report,
                global data center electricity consumption has been growing at 12% annually and is
                projected to more than double by 2030, reaching approximately 945 terawatt-hours.
                This figure exceeds the total electricity consumption of Japan today. AI-focused
                facilities specifically will see demand increase over fourfold in the same period.
              </p>
              <p>
                In developed nations, data centers are projected to account for over 20% of
                electricity demand growth over the next decade — reversing 15 years of stagnation in
                advanced-economy power demand. Hyperscalers are projected to spend more than $600
                billion on AI-related capital and operating expenditure in 2026 alone.
              </p>
              <p>
                Critically, the composition of AI compute is shifting. Inference — running trained
                models to produce outputs — now accounts for roughly two-thirds of all AI compute
                demand, up from one-third in 2023. The inference market is projected to exceed $50
                billion in 2026. This shift is driven by the rise of autonomous AI agents: coding
                assistants, research agents, trading systems, and monitoring bots that run
                continuously, 24 hours a day, 7 days a week.
              </p>
              <p>
                The always-on agent paradigm means compute is no longer bursty — it is persistent.
                Developers are running fleets of Raspberry Pis, Mac Minis, or cloud GPU instances
                around the clock to keep agents alive. The energy bill for this infrastructure is
                growing faster than the models themselves are improving.
              </p>
            </div>
          </Section>

          {/* ── 03 The Problem ── */}
          <Section id="problem" number="03" label="Why Current Infrastructure Fails">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              Centralized compute is expensive, opaque, and wasteful
            </h2>
            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p>
                <strong className="text-gray-900">Cost opacity.</strong> Hyperscalers charge
                $12.30/hr for an H100 GPU instance, while specialized providers offer the same
                hardware at $2–3/hr. Hidden egress fees, virtualization overhead, and opaque billing
                add 20–40% to hyperscaler bills. Developers have no visibility into what they are
                actually paying for.
              </p>
              <p>
                <strong className="text-gray-900">Low utilization.</strong> Centralized data centers
                maintain GPU utilization rates of 30–40%. The majority of provisioned capacity sits
                idle or is overprovisioned as a hedge against demand spikes. This structural
                inefficiency is baked into every cloud bill.
              </p>
              <p>
                <strong className="text-gray-900">Geographic lock-in.</strong> Workloads run
                wherever the cloud region is located, regardless of energy cost. Electricity prices
                vary by a factor of 10× across regions — from under $0.01/kWh in Nordic hydropower
                zones to $0.30+/kWh in parts of Europe and Japan. Cloud users cannot arbitrage this
                difference.
              </p>
              <p>
                <strong className="text-gray-900">No energy transparency.</strong> Users have zero
                insight into energy source, carbon intensity, or true cost-per-compute-cycle. There
                is no mechanism to verify claims about renewable energy usage.
              </p>
              <p>
                <strong className="text-gray-900">Vendor lock-in.</strong> Proprietary APIs, egress
                fees, and tightly coupled infrastructure make migration expensive and
                time-consuming. Switching providers means re-architecting.
              </p>
              <p>
                <strong className="text-gray-900">The 24/7 agent problem.</strong> Running 10
                Raspberry Pis or Mac Minis for always-on AI agents costs $200–500/month in
                electricity alone in high-cost regions — before hardware depreciation, cooling,
                maintenance, and network. For cloud GPU equivalents, that figure is $2,000–5,000/month.
              </p>
            </div>
          </Section>

          {/* ── 04 The Opportunity ── */}
          <Section id="opportunity" number="04" label="Energy Arbitrage for AI">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              Route compute to where energy is cheapest and cleanest
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              <Stat value="40–50%" label="Nordic electricity cost vs. rest of Europe" />
              <Stat value="90%+" label="Nordic grid renewable share" />
              <Stat value="70–80%" label="Cost savings via decentralized compute" />
            </div>

            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p>
                Energy costs are not uniform. The Nordic region — powered by abundant hydroelectric,
                wind, and geothermal resources — offers electricity costs 40–50% lower than most of
                Europe for data center operations. Norway alone generates 95% of its electricity
                from renewable sources (83% hydropower, 11% wind). Swedish wind power reached a
                levelized cost of approximately $0.03/kWh in 2024.
              </p>
              <p>
                At scale, the savings are material. A 100MW AI compute cluster in a Nordic location
                saves $2–4 million annually compared to an equivalent deployment in Frankfurt.
              </p>
              <p>
                The decentralized compute market has already validated this thesis. OpenGPU Network
                delivers GPU compute at up to 70% lower cost than traditional cloud services like
                AWS and Google Cloud, with 97.8% network reliability across 272+ providers in 40+
                countries. Akash Network achieves 70–80% cost reduction for GPU instances. These
                networks prove that distributed infrastructure can match centralized reliability at a
                fraction of the cost.
              </p>
              <p>
                mica takes this a step further: instead of simply aggregating idle GPUs, mica
                coordinates compute placement with real-time energy pricing, ensuring workloads
                always run at optimal cost and carbon intensity. The protocol layer provides
                something no existing network offers — verifiable, on-chain proof that your compute
                ran on the energy source you paid for.
              </p>
            </div>
          </Section>

          {/* ── 05 Protocol Architecture ── */}
          <Section id="architecture" number="05" label="Protocol Architecture">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              Four-layer stack for energy-aware compute
            </h2>

            <div className="border border-dashed border-[var(--gray-border)] p-6 mb-8 font-mono text-[12px] leading-relaxed text-gray-700 overflow-x-auto">
              <pre className="whitespace-pre">{`
┌─────────────────────────────────────────────────────────┐
│  API LAYER                                              │
│  REST endpoints · Job submission · Auth · SDK           │
├─────────────────────────────────────────────────────────┤
│  PROTOCOL LAYER                                         │
│  Smart contracts · Energy oracles · Node staking        │
├─────────────────────────────────────────────────────────┤
│  EXECUTION LAYER (MVM)                                  │
│  Distributed nodes · GPU / edge / cloud · Job runner    │
├─────────────────────────────────────────────────────────┤
│  VERIFICATION LAYER                                     │
│  Compute proofs · On-chain settlement · Audit trail     │
└─────────────────────────────────────────────────────────┘
              `.trim()}</pre>
            </div>

            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  API Layer
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  RESTful endpoints for job submission, status polling, energy analytics, and
                  account management. Authenticated via API keys (prefix <code className="bg-gray-100/80 px-1 rounded text-[12px]">mica_</code>).
                  SDKs for Python, TypeScript, and Go wrap the raw HTTP interface.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Protocol Layer
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Smart contracts manage the job lifecycle: commitment, scheduling, settlement, and
                  dispute resolution. Energy-price oracles pull live wholesale grid pricing from
                  partner data feeds. Node operators stake to join the network; stake is slashed for
                  downtime or invalid proofs.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Execution Layer — MVM
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  The Mica Virtual Machine runs on a global mesh of heterogeneous compute nodes —
                  GPU clusters, edge devices, and cloud instances — located in low-cost energy
                  regions. MVM's scheduling algorithm routes jobs based on energy cost, latency
                  constraints, and available capacity.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Verification Layer
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Every execution cycle produces a cryptographic compute proof that is settled
                  on-chain. Proofs are independently verifiable and form an immutable audit trail.
                  Settlement is final — no disputes, no chargebacks.
                </p>
              </div>
            </div>
          </Section>

          {/* ── 06 MVM ── */}
          <Section id="mvm" number="06" label="Mica Virtual Machine">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              Replace your hardware fleet with a global compute mesh
            </h2>

            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl mb-8">
              <p>
                Today, developers who need always-on AI agents face an unpleasant choice: maintain
                physical hardware (Raspberry Pis, Mac Minis, dedicated servers) with all the
                associated cost and maintenance burden, or pay hyperscaler cloud rates that are
                5–10× higher than the marginal cost of the underlying compute.
              </p>
              <p>
                MVM eliminates this tradeoff. Instead of maintaining your own infrastructure, you
                submit jobs through the mica API. MVM's scheduling layer — powered by smart
                contracts and live energy-price oracles — routes your workload to the optimal node
                in the global pool based on three factors: <strong className="text-gray-900">real-time energy cost</strong>,{' '}
                <strong className="text-gray-900">latency requirements</strong>, and{' '}
                <strong className="text-gray-900">available node capacity</strong>.
              </p>
              <p>
                Energy-price oracles pull live wholesale grid data from partner feeds. Smart
                contracts lock the energy rate before job execution begins — no surprise bills.
                Every compute cycle produces a cryptographic proof that is settled on-chain:
                verifiable, auditable, tamper-proof.
              </p>
              <p>
                Node operators are independent entities that run MVM-compatible hardware in
                low-cost energy regions. They stake tokens to join the network and earn compute
                credits per job served. Stake is slashed for downtime or invalid compute proofs,
                ensuring network reliability.
              </p>
            </div>

            <div className="border border-dashed border-[var(--gray-border)] p-6 clip-corner-tr mb-4">
              <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-4">
                Cost comparison — Always-on AI agent fleet (monthly)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 p-4">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 mb-1">
                    Self-hosted (10 Mac Minis, US residential power)
                  </p>
                  <p className="font-display font-extralight text-2xl text-gray-900">~$450<span className="text-sm text-gray-500">/mo</span></p>
                  <p className="font-mono text-[10px] text-gray-500 mt-1">
                    + hardware depreciation, cooling, maintenance
                  </p>
                </div>
                <div className="border border-gray-200 p-4">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-gray-500 mb-1">
                    Cloud (AWS equivalent always-on)
                  </p>
                  <p className="font-display font-extralight text-2xl text-gray-900">~$2,500<span className="text-sm text-gray-500">/mo</span></p>
                  <p className="font-mono text-[10px] text-gray-500 mt-1">
                    + egress fees, vendor lock-in
                  </p>
                </div>
                <div className="border border-red-mica/30 bg-red-mica/[0.03] p-4">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-red-mica mb-1">
                    MVM (Nordic hydro nodes)
                  </p>
                  <p className="font-display font-extralight text-2xl text-gray-900">~$180<span className="text-sm text-gray-500">/mo</span></p>
                  <p className="font-mono text-[10px] text-gray-500 mt-1">
                    Verified on-chain. 60% savings vs. self-hosted.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 07 API & Key Utilities ── */}
          <Section id="api" number="07" label="API & Key Utilities">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-4">
              What you can build with a mica API key
            </h2>
            <p className="font-mono text-[13px] text-gray-600 leading-relaxed max-w-3xl mb-8">
              Every mica API key (prefix <code className="bg-gray-100/80 px-1 rounded text-[12px]">mica_</code>) authenticates
              against the protocol and unlocks the following capabilities, depending on your
              subscription tier.
            </p>

            {/* Subscription tiers */}
            <div className="border border-dashed border-[var(--gray-border)] p-6 mb-10">
              <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-4">
                Subscription tiers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 p-4">
                  <p className="font-display font-light text-lg text-gray-900">Basic</p>
                  <p className="font-display font-extralight text-2xl text-gray-900 mt-1">$20<span className="text-sm text-gray-500">/mo</span></p>
                  <ul className="mt-3 space-y-1 font-mono text-[11px] text-gray-600">
                    <li>1,000 API calls / month</li>
                    <li>Standard energy routing</li>
                    <li>Email support</li>
                  </ul>
                </div>
                <div className="border border-red-mica/30 bg-red-mica/[0.03] p-4">
                  <p className="font-display font-light text-lg text-gray-900">Premium</p>
                  <p className="font-display font-extralight text-2xl text-gray-900 mt-1">$75<span className="text-sm text-gray-500">/mo</span></p>
                  <ul className="mt-3 space-y-1 font-mono text-[11px] text-gray-600">
                    <li>25,000 API calls / month</li>
                    <li>Priority energy routing</li>
                    <li>Webhook events + analytics dashboard</li>
                    <li>Dedicated support</li>
                  </ul>
                </div>
                <div className="border border-gray-200 p-4">
                  <p className="font-display font-light text-lg text-gray-900">Enterprise</p>
                  <p className="font-display font-extralight text-2xl text-gray-900 mt-1">Custom</p>
                  <ul className="mt-3 space-y-1 font-mono text-[11px] text-gray-600">
                    <li>Unlimited API calls</li>
                    <li>Custom routing rules + SLA</li>
                    <li>Dedicated infrastructure</li>
                    <li>On-chain audit trail</li>
                    <li>24/7 support</li>
                  </ul>
                </div>
              </div>
              <p className="font-mono text-[10px] text-gray-500 mt-4">
                All plans are billed monthly. Payment accepted in USDC (Base), ETH, and SOL.
              </p>
            </div>

            {/* Utilities */}
            <div className="space-y-8 max-w-3xl">
              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  mica Claude Code plugin
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed mb-3">
                  Install the mica plugin for Claude Code — modeled on{' '}
                  <a
                    href="https://github.com/get-Lucid/Lucid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-mica hover:underline"
                  >
                    Lucid
                  </a>
                  . When prompted, enter your <code className="bg-gray-100/80 px-1 rounded text-[12px]">mica_</code> API key. The
                  plugin exposes MCP tools that route your agent's compute-heavy tasks — inference,
                  batch processing, fine-tuning — through MVM nodes at the cheapest available energy
                  cost.
                </p>
                <div className="bg-[#060606] text-green-400 font-mono text-[11px] leading-relaxed p-4 rounded overflow-x-auto">
                  <p className="text-gray-500"># Available MCP tools</p>
                  <p>mica_deploy_job&nbsp;&nbsp;&nbsp;— Submit a compute job to MVM</p>
                  <p>mica_check_status — Poll job status and results</p>
                  <p>mica_energy_stats — Get energy cost and carbon data</p>
                  <p>mica_verify_proof — Verify on-chain compute proof</p>
                </div>
              </div>

              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  Agent orchestration API
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Submit agent swarms via <code className="bg-gray-100/80 px-1 rounded text-[12px]">POST /deploy</code> with your
                  agent configuration, model selection, and cost ceiling. MVM handles scheduling,
                  load balancing, and failover across nodes. Real-time status via webhook events.
                  Every job returns an on-chain receipt hash.
                </p>
              </div>

              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  Energy analytics
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  API endpoints return per-job energy cost, carbon intensity (gCO₂/kWh), node
                  geolocation, and compute proof hashes. Visualize cost trends, energy mix, and
                  regional efficiency in the mica dashboard. Available on Premium and Enterprise
                  plans.
                </p>
              </div>

              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  Batch scheduling
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Schedule inference or fine-tuning jobs for off-peak energy windows. Smart
                  contracts lock the rate at time of commitment; jobs execute when energy is cheapest.
                  Ideal for non-latency-sensitive workloads like nightly fine-tuning runs or large
                  batch inference.
                </p>
              </div>

              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  On-chain audit trail
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Every API call produces a verifiable compute proof settled on-chain. Enterprise
                  customers can query the full audit trail for regulatory compliance, energy
                  reporting, and internal governance.
                </p>
              </div>

              <div className="border-dashed-t-dark pt-6">
                <h3 className="font-display font-light text-lg md:text-xl text-gray-900 mb-2">
                  SDK integration
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Python, TypeScript, and Go SDKs wrap the REST API. Drop-in replacement for
                  self-hosted inference with a single import. Handles authentication, retries,
                  streaming results, and proof verification.
                </p>
              </div>
            </div>
          </Section>

          {/* ── 08 Tokenomics ── */}
          <Section id="tokenomics" number="08" label="Tokenomics">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              Economic model
            </h2>

            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Compute credits
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Users pay per compute cycle, settled in USDC, ETH, or SOL. No proprietary token
                  is required for usage — this reduces friction and keeps the barrier to entry low.
                  Pricing is denominated in USD; on-chain settlement handles exchange.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Node staking
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Operators stake to join the network. Stake is slashed for downtime, invalid
                  compute proofs, or failure to meet SLA requirements. Rewards are paid per job
                  served, proportional to the energy efficiency and reliability of the node.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  On-chain settlement
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  Every job produces a receipt hash on-chain. Settlement is final, transparent, and
                  auditable. No invoices, no net-30, no disputes.
                </p>
              </div>
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  Protocol treasury
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed">
                  A small percentage of each job fee flows to the protocol treasury, funding
                  continued development, oracle maintenance, security audits, and node operator
                  incentive programs.
                </p>
              </div>
            </div>
          </Section>

          {/* ── 09 Roadmap ── */}
          <Section id="roadmap" number="09" label="Roadmap">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-8">
              Q1 2026 — Q1 2027
            </h2>
            <div className="max-w-3xl">
              {ROADMAP.map((item) => (
                <RoadmapItem key={item.quarter} {...item} />
              ))}
            </div>
          </Section>

          {/* ── 10 Conclusion ── */}
          <Section id="conclusion" number="10" label="Conclusion">
            <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-6">
              The future of AI compute is energy-aware
            </h2>
            <div className="space-y-4 font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed max-w-3xl">
              <p>
                AI compute demand is doubling. Energy costs vary by an order of magnitude across
                geographies. The current model — opaque billing, geographic lock-in, idle capacity —
                is structurally inefficient and unsustainable.
              </p>
              <p>
                mica provides the missing coordination layer: a decentralized protocol that routes
                workloads to the cheapest, cleanest energy, verifies every compute cycle on-chain,
                and settles in seconds. The Mica Virtual Machine replaces hardware fleets with a
                global compute mesh. The API gives developers a single interface to energy-optimized
                infrastructure.
              </p>
              <p>
                The protocol is designed to be transparent, verifiable, and open. Energy data is
                on-chain. Compute proofs are public. Node operators compete on efficiency, not
                brand. The result is AI infrastructure that is cheaper, cleaner, and accountable.
              </p>
            </div>

            <div className="mt-12 pt-8 border-dashed-t-dark">
              <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-4">
                Get involved
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/app"
                  className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase py-3 px-6 bg-[#060606] text-white clip-corner-tr-sm hover:bg-red-mica transition-colors"
                >
                  Use Mica
                </Link>
                <Link
                  to="/careers"
                  className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase py-3 px-6 border border-dashed border-[var(--gray-border)] text-gray-700 hover:text-red-mica hover:border-red-mica transition-colors"
                >
                  Careers
                </Link>
                <a
                  href="mailto:contact@mica.energy"
                  className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase py-3 px-6 border border-dashed border-[var(--gray-border)] text-gray-700 hover:text-red-mica hover:border-red-mica transition-colors"
                >
                  Contact
                </a>
                <a
                  href="https://x.com/micadotenergy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-[10px] tracking-[0.18em] uppercase py-3 px-6 border border-dashed border-[var(--gray-border)] text-gray-700 hover:text-red-mica hover:border-red-mica transition-colors"
                >
                  @micadotenergy
                </a>
              </div>
            </div>

            <p className="mt-12">
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-mono text-sm text-gray-600 hover:text-red-mica transition-colors"
              >
                <span aria-hidden>←</span> Back to home
              </Link>
            </p>
          </Section>
        </div>

        <Footer />
      </div>
    </div>
  )
}
