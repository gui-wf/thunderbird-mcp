# PR #4: feat: include quoted original message in replyToMessage + UTF-8 fix

- **Author**: simon-77
- **State**: CLOSED (not merged)
- **Files changed**: extension/mcp_server/api.js
- **Additions/Deletions**: +282 / -73

## Summary

This PR was an earlier version of features that were later consolidated into PR #7. It added three main things: reply-with-quote (fetching original message body via `MsgHdrToMimeMessage` and building a quoted text block), a new `forwardMessage` tool with attachment preservation, and a `to` override parameter for `replyToMessage`. It also included the `sanitizeForJson` fix from PR #3.

The author closed the PR themselves, noting that all changes were incorporated into PR #7 which included these features plus additional ones.

## Key Changes (with code snippets where relevant)

### 1. Reply with quoted original

The `replyToMessage` function was converted from synchronous to async (Promise-based) to support the `MsgHdrToMimeMessage` callback. The original message body is fetched and quoted with `&gt;` prefixed lines:

```javascript
const quotedLines = originalBody.split('\n').map(line =>
  `&gt; ${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`
).join('<br>');
const quoteBlock = `<br><br>On ${dateStr}, ${author} wrote:<br>${quotedLines}`;
```

### 2. forwardMessage tool

New tool that opens a forward compose window with:
- Forward header block (Subject, Date, From, To)
- Original body preserved and escaped
- Attachments copied from original message via `allUserAttachments`
- Optional intro body prepended

### 3. replyToMessage `to` override

Added ability to override the reply recipient instead of always replying to the original sender.

### 4. sanitizeForJson rewrite

Replaced regex with loop-based approach. **Note**: This version stripped quotes and backslashes (data loss), which the owner flagged in the PR #7 review.

## Discussion & Review Comments

**simon-77's comment on forwardMessage**: Explained the use of `nsIMsgCompType.New` instead of `ForwardInline` because Thunderbird's ForwardInline overwrites the body field.

**simon-77's closing comment**: Closed in favor of PR #7 which includes all changes plus additional features.

## Relevance to Our Fork

Our fork already has all of these features in improved form. Our `replyToMessage` includes quoted original, In-Reply-To header, proper address splitting for replyAll, and the `to` override. Our `forwardMessage` includes attachment preservation with per-attachment error handling. Our `sanitizeForJson` correctly handles surrogate pairs and does not strip quotes/backslashes.

## Integration Recommendation

- **Should integrate**: no (superseded by PR #7, already in our fork)
- **Priority**: n/a
- **Effort**: n/a
- **Notes**: Historical interest only. All features integrated via PR #7.

## Related Issues

- Addresses Issue #2 (JSON parse errors)
