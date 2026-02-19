# Upstream Analysis Overview

Analysis of all PRs and issues from [TKasperczyk/thunderbird-mcp](https://github.com/TKasperczyk/thunderbird-mcp) as of 2026-02-19.

Our fork is at `/home/guibaeta/Projects/thunderbird-mcp` and is based on upstream post-PR #7 merge with the owner's follow-up fixes.

## Pull Requests Summary

| PR | Title | Author | State | Integrate? | Priority | Effort | Notes |
|----|-------|--------|-------|------------|----------|--------|-------|
| [#12](pr-12.md) | fix(getMessage): fall back to HTML body when plain text extraction fails | lihaokun | OPEN | partial | medium | small | HTML fallback + bodyIsHtml flag + markAsRead batch tool + ccList in search |
| [#11](pr-11.md) | feat: add createEvent tool for calendar event creation | simon-77 | OPEN | yes | medium | small | Clean calendar event creation via dialog |
| [#10](pr-10.md) | fix: handle HTML-only emails and Unicode encoding in JSON responses | quittung | OPEN | yes | high | small | HTML fallback (strips tags) + sanitizeForJson on res.write() |
| [#7](pr-7.md) | feat: add listAccounts, from, attachments, search enhancements | simon-77 | MERGED | no | n/a | n/a | Already integrated in our fork |
| [#6](pr-6.md) | feat(searchMessages): add date filtering, sorting, improved descriptions | Oaklight | CLOSED | no | n/a | n/a | Superseded by PR #7, already in our fork |
| [#4](pr-4.md) | feat: include quoted original message in replyToMessage + UTF-8 fix | simon-77 | CLOSED | no | n/a | n/a | Superseded by PR #7, already in our fork |
| [#3](pr-3.md) | fix: getMessage JSON serialization for non-ASCII and control chars | simon-77 | CLOSED | no | n/a | n/a | Superseded by PR #7, had bugs |
| [#1](pr-1.md) | Add listAccounts, listFolders, and getRecentMessages tools | judicandus | OPEN | no | low | n/a | Has folder flag bugs, mostly superseded |

## Issues Summary

| Issue | Title | Author | State | Addressed By | Status in Our Fork |
|-------|-------|--------|-------|--------------|--------------------|
| [#9](issue-9.md) | bridge process | gdkrmr | OPEN | None | Same architecture, future improvement |
| [#8](issue-8.md) | Client error report | sabrehagen | CLOSED | Commit 0bbf2b1 | Fixed |
| [#5](issue-5.md) | extending searching function | gdkrmr | OPEN | PR #7 (partial) | Partially addressed, remaining filters available |
| [#2](issue-2.md) | getMessage fails with JSON parse error on non-ASCII | simon-77 | CLOSED | PR #7 + commit 0bbf2b1 | Fixed |

## Cross-References

| PR/Issue | Related To | Relationship |
|----------|-----------|--------------|
| PR #12 | Issue #2 | Extends the non-ASCII fix with HTML body fallback |
| PR #10 | Issue #2 | Also extends non-ASCII fix, different approach to HTML fallback |
| PR #10 | PR #12 | Competing approaches: #10 strips HTML to text, #12 returns HTML with flag |
| PR #7 | PR #3, PR #4 | Consolidated version of both + additional features |
| PR #7 | Issue #2, Issue #5 | Fixes #2, partially addresses #5 |
| PR #6 | Issue #5 | Partially addresses, superseded by PR #7 |
| PR #4 | Issue #2 | Includes fix, superseded by PR #7 |
| PR #3 | Issue #2 | Direct fix attempt, superseded by PR #7 |
| PR #1 | Issue #5 | getRecentMessages partially addresses, has bugs |
| Issue #8 | PR #1 | PR #1's bridge fixes solve the client error |

## Integration Status (2026-02-19)

### Integrated

| Source | What | Credit |
|--------|------|--------|
| PR #10 | `res.write()` wrapped in `sanitizeForJson()` - fixes Unicode low-byte `0x22` JSON corruption | @quittung |
| PR #10 | `findTextPart` MIME tree walker - HTML body fallback with tag stripping for HTML-only emails | @quittung |
| PR #12 | `bodyIsHtml` flag on `getMessage` response | @lihaokun |
| PR #12 | `ccList` in search results + CC field included in query matching | @lihaokun |
| PR #12 | `sanitizeForJson()` on search result header fields | @lihaokun |
| PR #11 | `createEvent` tool - calendar event creation via dialog | @simon-77 |

Upstream comments posted: [PR #10](https://github.com/TKasperczyk/thunderbird-mcp/pull/10#issuecomment-3924643026), [PR #11](https://github.com/TKasperczyk/thunderbird-mcp/pull/11#issuecomment-3924643147), [PR #12](https://github.com/TKasperczyk/thunderbird-mcp/pull/12#issuecomment-3924643236)

### Skipped

| Source | What | Reason |
|--------|------|--------|
| PR #12 | `markAsRead` batch tool | `updateMessage` already covers read/unread state |
| PR #1 | `getRecentMessages` tool | Folder flag bugs, mostly superseded by existing tools |

### Remaining (not yet implemented)

| Source | What | Priority |
|--------|------|----------|
| Issue #5 | Extended search filters: `unread`, `flagged`, `folder` params on `searchMessages` | low |
| Issue #9 | Move MCP protocol handling into extension (skip bridge for HTTP clients) | low |

## Items Already in Our Fork

The following upstream changes are already present in our fork:
- listAccounts tool with full identity info
- findIdentity + setComposeIdentity helpers
- addAttachments with failure reporting
- escapeHtml + formatBodyHtml shared helpers
- forwardMessage tool with attachment preservation
- Reply with quoted original message
- In-Reply-To header for threading
- Proper replyAll with regex-aware address splitting and deduplication
- Enhanced searchMessages (startDate, endDate, maxResults, sortOrder, SEARCH_COLLECTION_CAP)
- sanitizeForJson with surrogate pair support (no quote/backslash stripping)
- Bridge: resources/list, prompts/list handlers, correct error response IDs
- listFolders tool
- updateMessage tool (covers markAsRead use case)
