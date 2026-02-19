# PR #3: fix: getMessage JSON serialization for non-ASCII and control chars

- **Author**: simon-77
- **State**: CLOSED (not merged)
- **Files changed**: extension/mcp_server/api.js
- **Additions/Deletions**: +21 / -1

## Summary

This was the first attempt at fixing the JSON parse errors caused by non-ASCII characters in email bodies (Issue #2). It replaced the regex-based `sanitizeForJson` with a loop-based approach that also handled UTF-8 encoding. The PR was closed by the author in favor of PR #7, which incorporated these changes along with additional features.

## Key Changes (with code snippets where relevant)

### sanitizeForJson rewrite

Replaced the one-line regex:
```javascript
return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
```

With a character-by-character loop that:
1. Strips control characters (except tab, newline, carriage return)
2. Strips quotes (`0x22`) and backslashes (`0x5C`) - **this is the problematic part**
3. Manually UTF-8 encodes non-ASCII characters

```javascript
let result = "";
for (let i = 0; i < text.length; i++) {
  const c = text.charCodeAt(i);
  if ((c >= 0x00 && c <= 0x08) || c === 0x0B || c === 0x0C ||
      (c >= 0x0E && c <= 0x1F) || c === 0x7F ||
      c === 0x22 || c === 0x5C) {
    continue; // Strips quotes and backslashes!
  }
  if (c >= 128 && c <= 2047) {
    result += String.fromCharCode(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
  } else if (c >= 2048 && c <= 65535) {
    result += String.fromCharCode(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
  } else {
    result += text[i];
  }
}
```

**Issues identified in the PR #7 review**:
- Stripping quotes (`"`) and backslashes (`\`) causes data loss. These are valid printable characters that `JSON.stringify` handles correctly.
- Missing surrogate pair handling means emojis (U+10000+) would be incorrectly encoded.

## Discussion & Review Comments

**simon-77's closing comment**: Closed in favor of PR #7.

## Relevance to Our Fork

Our fork has a corrected version of `sanitizeForJson` that:
- Does NOT strip quotes or backslashes
- Properly handles surrogate pairs (4-byte UTF-8 for code points > U+FFFF)
- Preserves all valid printable characters

This was fixed as part of the owner's follow-up commit after merging PR #7.

## Integration Recommendation

- **Should integrate**: no (superseded, already fixed in our fork)
- **Priority**: n/a
- **Effort**: n/a
- **Notes**: Historical interest only. The bugs in this PR were identified during PR #7 review and fixed before merge.

## Related Issues

- Directly addresses Issue #2 (getMessage JSON parse errors)
