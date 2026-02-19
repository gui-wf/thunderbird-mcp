# PR #7: feat: add listAccounts, from, attachments, search enhancements

- **Author**: simon-77
- **State**: MERGED
- **Files changed**: extension/mcp_server/api.js
- **Additions/Deletions**: +419 / -79
- **Merged at**: 2026-02-11

## Summary

This is the largest and most significant PR in the upstream history. It was merged into upstream main and adds several major features: a `listAccounts` tool, identity selection via `from` parameter on compose tools, file attachment support, BCC support, enhanced search with date filtering and sorting, `forwardMessage` tool, reply-with-quote functionality, and In-Reply-To threading headers. It also incorporates fixes from PRs #3 and #4.

The owner (TKasperczyk) did a thorough code review and pushed a follow-up commit (40851d9) with additional fixes on top of the PR's changes: proper `&` escaping in HTML before `<`/`>`, regex-based quoted-name-aware address splitting for replyAll, identity fallback warnings, per-attachment try/catch in forward, and extraction of shared helpers (`escapeHtml`, `formatBodyHtml`, `setComposeIdentity`).

## Key Changes (with code snippets where relevant)

### 1. listAccounts tool

Returns accounts with full identity information:

```javascript
function listAccounts() {
  const accounts = [];
  for (const account of MailServices.accounts.accounts) {
    const server = account.incomingServer;
    const identities = [];
    for (const identity of account.identities) {
      identities.push({
        id: identity.key,
        email: identity.email,
        name: identity.fullName,
        isDefault: identity === account.defaultIdentity
      });
    }
    accounts.push({ id: account.key, name: server.prettyName, type: server.type, identities });
  }
  return accounts;
}
```

### 2. findIdentity and identity selection

New helper for resolving `from` parameter to an identity:

```javascript
function findIdentity(emailOrId) {
  if (!emailOrId) return null;
  const lowerInput = emailOrId.toLowerCase();
  for (const account of MailServices.accounts.accounts) {
    for (const identity of account.identities) {
      if (identity.key === emailOrId || identity.email.toLowerCase() === lowerInput) {
        return identity;
      }
    }
  }
  return null;
}
```

### 3. File attachment support

New `addAttachments` helper with failure reporting:

```javascript
function addAttachments(composeFields, attachments) {
  const result = { added: 0, failed: [] };
  if (!attachments || !Array.isArray(attachments)) return result;
  for (const filePath of attachments) {
    // ... creates nsIFile, nsIMsgAttachment, reports failures
  }
  return result;
}
```

### 4. forwardMessage tool

Opens a forward compose window preserving original attachments, with manual forward quote block construction (Subject, Date, From, To headers plus body).

### 5. Reply with quoted original

`replyToMessage` now fetches the original body via `MsgHdrToMimeMessage` and builds a quoted text block. Also adds In-Reply-To header and improved replyAll CC handling with deduplication.

### 6. Enhanced searchMessages

Added `startDate`, `endDate`, `maxResults`, and `sortOrder` parameters. Added `SEARCH_COLLECTION_CAP` (1000) to limit memory usage before sorting.

## Discussion & Review Comments

**TKasperczyk's review** was detailed and thorough:

1. **sanitizeForJson critique**: The PR originally stripped quotes (`0x22`) and backslashes (`0x5C`), causing data loss (`He said "hello"` became `He said hello`). Also broke emoji handling (no surrogate pair support). The owner considered this the main blocker.

2. **Search performance**: Removing all early-exit `MAX_SEARCH_RESULTS` checks meant scanning all messages. The owner suggested an internal collection cap (e.g., 1000), which was implemented.

3. **addAttachments silent failures**: Originally silently skipped invalid paths. The owner requested failure reporting, which was implemented.

4. **composeMail marked async unnecessarily**: Fixed.

**simon-77's rebase comment**: Rebased onto current main as a single clean commit, keeping upstream's versions of `sanitizeForJson`, `searchMessages` constants, and bridge code.

**TKasperczyk's merge comment**: Merged with a follow-up commit adding proper `&` escaping, regex-aware address splitting for replyAll, identity fallback warnings, per-attachment error handling in forward, and extraction of shared helpers.

## Relevance to Our Fork

**Our fork already has all of these features.** Our fork's `api.js` contains `listAccounts`, `findIdentity`, `addAttachments`, `escapeHtml`, `formatBodyHtml`, `setComposeIdentity`, `forwardMessage`, reply-with-quote, In-Reply-To, enhanced search with `startDate`/`endDate`/`maxResults`/`sortOrder`, `SEARCH_COLLECTION_CAP`, and all the owner's follow-up fixes.

Our fork appears to be based on the upstream state after PR #7 was merged and the follow-up fixes were applied. Comparing line by line, our fork matches the post-merge state closely, with some additional improvements (e.g., our `findIdentity` guards against `undefined` email, our `setComposeIdentity` is a cleaner shared helper, our `forwardMessage` has per-attachment try/catch).

## Integration Recommendation

- **Should integrate**: no (already integrated)
- **Priority**: n/a
- **Effort**: n/a
- **Notes**: Our fork is already based on upstream post-PR #7. No action needed.

## Related Issues

- Addresses Issue #2 (JSON parse errors with non-ASCII)
- Partially addresses Issue #5 (extending search function)
