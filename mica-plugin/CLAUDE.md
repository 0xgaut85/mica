# Mica Plugin Instructions

Mica saves tokens and reduces LLM costs by routing compute-heavy tasks through MVM (Mica Virtual Machine) nodes running on the cheapest available energy worldwide.

## Tool Priority

1. To set your API key: use `mica_set_api_key` (MCP tool from mica server)
2. To route a compute job: use `mica_route_compute` (MCP tool from mica server)
3. To estimate savings: use `mica_estimate_savings` (MCP tool from mica server)
4. To check node status: use `mica_node_status` (MCP tool from mica server)

## API Key Flow

On first use, mica will prompt for an API key. Ask the user to paste their `mica_` key in the chat, then call `mica_set_api_key` with it. Keys are available at https://mica.energy/app

## When to use mica tools

- Before running inference or batch processing tasks
- When the user wants to optimize compute costs
- For long-running agent tasks that benefit from cheaper energy routing
- When estimating token and cost savings
