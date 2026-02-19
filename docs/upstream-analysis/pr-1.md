# PR #1: Add listAccounts, listFolders, and getRecentMessages tools

- **Author**: judicandus
- **State**: OPEN
- **Files changed**: CHANGELOG.md, extension/mcp_server/api.js, mcp-bridge.cjs
- **Additions/Deletions**: +335 / -1

## Summary

This PR adds three new tools (`listAccounts`, `listFolders`, `getRecentMessages`) and improves the MCP bridge to handle `resources/list` and `prompts/list` requests. It's the earliest and most comprehensive feature PR, but has been left open with review feedback that identifies several bugs.

The owner did a thorough review identifying incorrect folder flag values, noting that `getRecentMessages` duplicates `searchMessages` functionality, and requesting style changes. The bridge fixes for `resources/list` and `prompts/list` were acknowledged as useful.

## Key Changes (with code snippets where relevant)

### 1. listAccounts

Returns basic account info (key, name, type, email, username, hostName). Simpler than PR #7's version which includes full identity information.

### 2. listFolders with folder type detection

Recursively walks folder hierarchy, attempts to detect folder types using flag values:

```javascript
type: folder.flags & 0x00001000 ? "inbox" :
      folder.flags & 0x00000200 ? "sent" :
      folder.flags & 0x00000400 ? "drafts" :
      folder.flags & 0x00000100 ? "trash" :
      folder.flags & 0x00000800 ? "templates" : "folder"
```

**Bug**: Uses `0x1000` to skip virtual folders, but `0x1000` is actually `nsMsgFolderFlags.Inbox`, not Virtual. Virtual is `0x00000020`. This means Inbox folders are silently skipped. Also `0x00000800` is Queue (outbox), not Templates (which is `0x00400000`).

### 3. getRecentMessages

Provides date-filtered recent message retrieval with optional folder-specific or inbox-wide search, unread-only filter, and configurable limit. However, the owner noted this duplicates `searchMessages` and the performance claim is inaccurate since both use `enumerateMessages()`.

### 4. Bridge improvements

Added `resources/list` and `prompts/list` handlers that return empty arrays, and added `resources` and `prompts` to the advertised capabilities.

## Discussion & Review Comments

**TKasperczyk's review** (detailed):

1. **Folder flag bugs are the blocker**: `0x1000` skips Inbox (not Virtual), and `0x00000800` is Queue not Templates. These are functional bugs that would break the tool.

2. **getRecentMessages vs searchMessages**: Duplicates traversal logic. Suggested adding date filtering as parameters to `searchMessages` instead.

3. **Bridge fixes are good**: The `resources/list` and `prompts/list` handlers solve compatibility with Claude Desktop and similar clients.

4. **Style concerns**: Verbose JSDoc documentation doesn't match the project's minimal-comments style. CHANGELOG.md should be dropped.

## Relevance to Our Fork

**listAccounts**: Our fork has `listAccounts` with full identity information (from PR #7).

**listFolders**: Our fork has `listFolders` with a simpler and correct implementation. Our version uses `accountId` filtering and a `walkFolder` recursive approach with depth tracking, without folder-type detection (no flag-based type classification, which avoids the bugs in this PR).

**getRecentMessages**: Our fork does not have this as a separate tool, but our `searchMessages` supports the same use case via `startDate`/`endDate`/`maxResults`/`sortOrder` parameters. An empty query with date filtering achieves the same result.

**Bridge improvements**: Our fork already has `resources/list` and `prompts/list` handlers (line 78-90 of mcp-bridge.cjs). However, our fork does NOT advertise `resources` and `prompts` in capabilities (line 67) - it only advertises `tools: {}`. The PR advertises both in capabilities. This is a minor difference - the owner's comment suggested advertising without the capabilities might be better for well-behaved clients.

## Integration Recommendation

- **Should integrate**: no (mostly superseded, bugs in remaining parts)
- **Priority**: low
- **Effort**: n/a
- **Notes**: The useful parts (listAccounts, search enhancements, bridge fixes) are already in our fork via PR #7 and the owner's own fixes. The folder type detection has bugs and our fork's simpler approach works fine. The `getRecentMessages` tool is not needed since `searchMessages` covers the use case. The only potentially interesting piece is adding folder type information to `listFolders`, but only if using correct flag values.

## Related Issues

None explicitly referenced, but relates to Issue #5 (extending search function).
