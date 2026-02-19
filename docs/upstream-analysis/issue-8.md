# Issue #8: Client error report

- **Author**: sabrehagen
- **State**: CLOSED

## Problem Description

After installing the extension on commit `af785b8`, the MCP client received validation errors when connecting. The error was a zod validation error showing:
- `id` field was `null` (expected string or number)
- `method` field was `undefined` (expected string)
- Unrecognized keys: `error`

This indicated the bridge was sending malformed JSON-RPC error responses to the client. The issue manifested as `"Found 0 tools, 0 prompts, and 0 resources"` followed by client validation errors.

The user was running Thunderbird 148.0b3 (beta).

## Discussion

**TKasperczyk** identified two root causes fixed in commit `0bbf2b1`:

1. **Missing handlers for resources/list and prompts/list**: MCP clients probe for these after initialization. The bridge was forwarding them to the Thunderbird extension, which returned HTTP 404 with plain text, causing JSON parse failures.

2. **Error response with null id**: The bridge's error handler was sending `id: null` instead of extracting the request ID before processing. This broke client-side JSON-RPC validation which requires a valid `id` field.

## Addressed By

Fixed in upstream commit `0bbf2b1` (before PR #7 merge). The fix added `resources/list` and `prompts/list` handlers to the bridge, and ensured error responses include the correct request ID.

## Status in Our Fork

Our fork has both fixes:
- `resources/list` and `prompts/list` handlers are present in `mcp-bridge.cjs` (lines 78-90)
- Error responses extract the request ID before processing (lines 148-153 in mcp-bridge.cjs)

This issue is fully resolved in our fork.
