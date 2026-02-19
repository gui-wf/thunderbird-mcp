# Issue #9: bridge process

- **Author**: gdkrmr
- **State**: OPEN

## Problem Description

The MCP protocol works over HTTP, so the bridge process (mcp-bridge.cjs) should be optional. The issue is that part of the MCP protocol is implemented within the bridge - specifically the `initialize` handshake, `resources/list`, and `prompts/list` handlers. If the initialization logic could be moved into the Thunderbird extension itself, the bridge could become optional for HTTP-capable clients, and the bridge could become a simpler, more generic stdio-to-HTTP translator.

The author links to the bridge code where the MCP initialization is handled rather than being forwarded to Thunderbird.

## Discussion

**TKasperczyk** acknowledged the point and agreed it should be done eventually. The extension's HTTP server would need to handle the full MCP lifecycle (initialize, resources/list, prompts/list, etc.) instead of just `tools/list` and `tools/call`. This would let HTTP-capable clients skip the bridge entirely.

The owner is not planning to tackle this soon but left the issue open as a future improvement.

## Addressed By

No PRs directly address this. The feature would require changes to both the extension's HTTP server handler (to respond to MCP protocol methods) and potentially the bridge (to become truly optional).

## Status in Our Fork

Our fork has the same architecture - the bridge handles MCP initialization and the extension only handles `tools/list` and `tools/call`. This is a valid architectural improvement we could consider, but it's not a bug. The current architecture works fine for stdio-based MCP clients (Claude Code, Claude Desktop, etc.).

Moving to HTTP-native MCP support would also require implementing the Streamable HTTP transport (the newer MCP transport replacing SSE), which is a larger undertaking.
