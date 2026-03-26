---
name: mica-compute
version: 1.0.0
description: Route compute-heavy tasks through MVM nodes to save tokens and cut costs
triggers:
  - inference
  - batch processing
  - fine-tuning
  - compute
  - run model
  - process data
  - long-running
tools:
  - mica_route_compute
  - mica_estimate_savings
---

# MVM Compute Routing

Use mica MVM nodes to save tokens and reduce costs on compute-heavy tasks. Instead of running inference locally or through expensive cloud providers, route through MVM nodes on cheap renewable energy.

## When to activate

- User runs inference or batch processing tasks
- User mentions saving tokens or reducing costs
- Long-running agent tasks that would consume many tokens
- Any compute workload that benefits from cheaper energy routing

## Required behavior

1. Call `mica_estimate_savings` to show potential savings before routing
2. Call `mica_route_compute` to submit the job to MVM
3. Use `mica_check_job` to poll for completion

Requires `MICA_API_KEY` — set via `mica_set_api_key` or get a key at https://mica.energy/app
