import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

const ROLES = [
  {
    title: 'Protocol / Smart Contract Engineer',
    summary:
      'Design and ship on-chain job lifecycle, verification, and settlement for a decentralized energy-aware compute network.',
    about:
      'You will own smart-contract architecture and security for how AI workloads are committed, proven, and paid for on-chain, in coordination with off-chain execution and oracles.',
    responsibilities: [
      'Design and implement contracts for job receipts, proofs, and attribution.',
      'Integrate energy-price and availability signals via oracle patterns; harden against manipulation.',
      'Partner with backend engineers on message formats, indexing, and upgrade paths.',
      'Lead audits, threat modeling, and documentation for external reviewers.',
    ],
    requirements: [
      'Strong experience with Solidity (or similar) and common security tooling.',
      'Familiarity with oracle design, upgradeability, and key management in production.',
      'Ability to reason clearly about adversarial behavior and economic incentives.',
      'Excellent written English for specs and runbooks.',
    ],
    niceToHave: [
      'Experience with verifiable compute or proof systems at the protocol level.',
      'Background in energy markets or incentive design.',
    ],
  },
  {
    title: 'Backend / Distributed Systems Engineer',
    summary:
      'Build APIs, scheduling, and orchestration that route AI agent workloads across heterogeneous compute with clear cost and energy signals.',
    about:
      'You will make the control plane reliable at scale: submission, routing, observability, and integration with node operators and clients.',
    responsibilities: [
      'Implement and evolve REST (and future) APIs for deploy, status, and reporting.',
      'Design scheduling and queueing that respect cost ceilings, locality, and operator constraints.',
      'Instrument services for latency, failures, and cost; drive on-call readiness.',
      'Collaborate with protocol engineers on state that must align on-chain and off-chain.',
    ],
    requirements: [
      'Strong backend experience (e.g. Node, Go, or Rust) in production systems.',
      'Comfort with distributed systems: idempotency, retries, backpressure, and observability.',
      'Pragmatic API design and performance profiling.',
      'Remote-friendly async communication and clear technical writing.',
    ],
    niceToHave: [
      'Experience with GPU clusters, batch jobs, or ML inference pipelines.',
      'Familiarity with blockchain-adjacent backends (indexers, wallets, webhooks).',
    ],
  },
  {
    title: 'Product Engineer (Full Stack)',
    summary:
      'Ship polished product surfaces in React, integrate with our APIs and protocol flows, and improve developer experience for customers.',
    about:
      'You will bridge design and infrastructure: dashboards, docs-adjacent flows, and internal tools that make mica easy to adopt.',
    responsibilities: [
      'Build and maintain user-facing features with React, TypeScript, and Tailwind CSS.',
      'Integrate authentication, billing hooks, and protocol/API contracts safely.',
      'Improve performance, accessibility, and clarity of complex workflows.',
      'Partner with design and backend on contracts, error states, and analytics events.',
    ],
    requirements: [
      'Solid React and modern front-end practices (hooks, performance, testing mindset).',
      'Comfort working from OpenAPI-style or internal API definitions.',
      'Product sense: you care about copy, empty states, and edge cases.',
      'Based in or able to work core hours aligned with US time zones.',
    ],
    niceToHave: [
      'Experience with Framer Motion, GSAP, or data-heavy dashboards.',
      'Interest in AI infrastructure, energy, or developer tools.',
    ],
  },
]

export default function Careers() {
  return (
    <div className="noise-overlay min-h-screen bg-cream">
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

      <div className="relative z-10 min-w-0">
        <div className="px-8 md:px-16 lg:px-24 pt-28 md:pt-36 pb-16 md:pb-24 max-w-4xl">
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <span className="w-2.5 h-2.5 bg-red-mica shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500">Careers</p>
          </div>

          <h1 className="font-display font-extralight text-4xl md:text-6xl lg:text-[4rem] leading-[1.08] text-gray-900 mb-6">
            Join mica
          </h1>

          <p className="font-mono text-sm md:text-base text-gray-700 leading-relaxed max-w-2xl mb-4">
            mica is building a decentralized energy protocol for AI compute: routing agent workloads
            to efficient energy, with on-chain verification and transparent economics.
          </p>
          <p className="font-mono text-sm text-gray-600 leading-relaxed max-w-2xl mb-12">
            <strong className="font-semibold text-gray-800">Location:</strong> Remote. We work
            primarily in US time zones (Pacific through Eastern). We do not list compensation in
            public postings; we are happy to discuss package details directly with candidates.
          </p>

          <div className="space-y-16 md:space-y-20">
            {ROLES.map((role) => (
              <article
                key={role.title}
                className="border-dashed-t-dark pt-12 first:border-t-0 first:pt-0 first:mt-0"
              >
                <h2 className="font-display font-light text-2xl md:text-3xl text-gray-900 mb-3">
                  {role.title}
                </h2>
                <p className="font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed mb-6">
                  {role.summary}
                </p>

                <h3 className="font-mono text-[10px] tracking-[0.25em] text-red-mica uppercase mb-2">
                  About the role
                </h3>
                <p className="font-mono text-[13px] text-gray-700 leading-relaxed mb-6">{role.about}</p>

                <h3 className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-2">
                  What you will do
                </h3>
                <ul className="list-disc pl-5 space-y-2 font-mono text-[13px] text-gray-700 leading-relaxed mb-6">
                  {role.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3 className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-2">
                  What we are looking for
                </h3>
                <ul className="list-disc pl-5 space-y-2 font-mono text-[13px] text-gray-700 leading-relaxed mb-6">
                  {role.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                {role.niceToHave?.length ? (
                  <>
                    <h3 className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase mb-2">
                      Nice to have
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 font-mono text-[13px] text-gray-700 leading-relaxed">
                      {role.niceToHave.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </article>
            ))}
          </div>

          <section className="mt-20 pt-12 border-dashed-t-dark">
            <h2 className="font-display font-light text-xl md:text-2xl text-gray-900 mb-4">
              How to apply
            </h2>
            <p className="font-mono text-[13px] md:text-sm text-gray-700 leading-relaxed mb-4">
              Send your application to{' '}
              <a
                href="mailto:contact@mica.energy?subject=Application%3A%20%5BRole%20title%5D"
                className="text-red-mica hover:underline font-medium"
              >
                contact@mica.energy
              </a>
              . Use the subject line{' '}
              <span className="font-mono text-gray-800 bg-gray-100/80 px-1.5 py-0.5 rounded">
                Application: [Role title]
              </span>{' '}
              (replace with the position you want). Include your resume or CV, links to relevant work
              (GitHub, papers, portfolio), and a short note (a few sentences) on why you are a fit.
            </p>
            <p className="font-mono text-[12px] text-gray-600 leading-relaxed">
              We review applications on a rolling basis. If you need accommodations for the interview
              process, mention it in your email.
            </p>
            <p className="mt-10">
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-mono text-sm text-gray-600 hover:text-red-mica transition-colors"
              >
                <span aria-hidden>←</span> Back to home
              </Link>
            </p>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  )
}
