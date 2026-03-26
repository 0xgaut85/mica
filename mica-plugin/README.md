```
    __  ______________
   /  |/  /  _/ ____/   _
  / /|_/ // // /   / | / /
 / /  / // // /___/ |/ /
/_/  /_/___/\____/|___/
```

Save tokens. Cut inference costs. Route compute through MVM nodes on the cheapest available energy.

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](#)

---

## What is mica?

LLM inference is expensive. Running agents 24/7 burns tokens and energy. Mica fixes this by routing your compute-heavy tasks through MVM (Mica Virtual Machine) nodes — distributed across regions with the cheapest renewable energy on the planet.

Instead of paying full price for cloud compute at $0.10+/kWh, MVM routes your workloads to nodes running on Nordic hydroelectric ($0.02/kWh), Icelandic geothermal ($0.01/kWh), and Canadian hydro ($0.04/kWh). Same results, ~40% lower cost.

Mica runs as an MCP server plugin for Claude Code. When your agent needs to run inference, batch processing, or long-running tasks, it routes through MVM instead of standard cloud — saving tokens and money automatically.

## Install

### Claude Code Plugin

```
/plugin marketplace add mica-energy/mica-plugin
```

Then install:

```
/plugin install mica
```

## Setup

1. Get an API key at **[mica.energy/app](https://mica.energy/app)**
2. Set your key:

```bash
export MICA_API_KEY=mica_your_key_here
```

Or paste your key in chat and the plugin will prompt you to set it via `mica_set_api_key`.

## Tools

| Tool | What it does |
|------|-------------|
| `mica_set_api_key` | Set your mica API key at runtime |
| `mica_route_compute` | Route a compute job through MVM nodes |
| `mica_estimate_savings` | Estimate token and cost savings vs standard cloud |
| `mica_node_status` | Check MVM node clusters, energy costs, and load |
| `mica_check_job` | Check the status of a submitted compute job |

### Example calls

```typescript
mica_set_api_key({ key: "mica_abc123..." })
mica_route_compute({ task: "batch inference on 10k samples", priority: "normal" })
mica_estimate_savings({ tokens: 50000, model: "claude-3.5-sonnet" })
mica_node_status()
mica_check_job({ job_id: "mvm_abc123" })
```

## How It Works

```
Agent has a compute task
        ↓
mica_estimate_savings shows ~40% savings
        ↓
mica_route_compute sends job to MVM
        ↓
MVM routes to cheapest energy node
        ↓
Job runs on Nordic hydro / Icelandic geothermal
        ↓
Results returned, tokens saved
```

## Pricing

Subscribe at **[mica.energy/app](https://mica.energy/app)**. Payment in USDC (Base), ETH, or SOL.

| Plan | Price | Compute |
|------|-------|---------|
| Basic | $20/mo | 500K tokens/mo routed |
| Premium | $75/mo | Unlimited routing |
| Enterprise | Contact us | Custom SLA + dedicated nodes |

## Troubleshooting

**API key not working**
Make sure your subscription is active at [mica.energy/app](https://mica.energy/app).

**Tools not appearing**
Rebuild the MCP server:
```bash
cd mcp-server && npm run build
```

**Connection errors**
Check that `MICA_API_KEY` is set in your environment and the API is reachable.

## License

[MIT](LICENSE)
