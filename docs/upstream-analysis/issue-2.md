# Issue #2: getMessage fails with JSON parse error on emails containing non-ASCII characters or control codes

- **Author**: simon-77
- **State**: CLOSED

## Problem Description

The `getMessage` MCP function failed with "Invalid JSON from Thunderbird" when parsing emails containing:
- Control characters (e.g., 0x13 DC3)
- Unescaped double quotes in the body
- Non-ASCII characters (umlauts, Euro sign, bullets, em-dash, etc.)

The error message was:
```
Bridge error: Invalid JSON from Thunderbird: Unexpected token ... at position 1572
```

Root causes identified:
1. `coerceBodyToPlaintext()` returns strings with control chars and unescaped quotes
2. The regex-based `sanitizeForJson()` didn't work reliably in Thunderbird's JS engine
3. Thunderbird's HTTP server writes raw bytes - non-ASCII chars aren't UTF-8 encoded, but Content-Type claims UTF-8

Environment: Thunderbird 140.6.0esr on openSUSE Leap 16.0.

## Discussion

**TKasperczyk** confirmed the fix in commit `0bbf2b1`:
- Replaced the regex sanitizer with a loop-based approach
- Manually pre-encodes non-ASCII as UTF-8 bytes before the HTTP server writes the response
- Control characters are stripped
- Quotes and backslashes are left alone (JSON.stringify handles them)
- Handles emojis and other characters above U+FFFF via surrogate pair detection and 4-byte UTF-8 encoding

## Addressed By

- PR #3 (closed) - first fix attempt, had bugs (stripped quotes, no surrogate pairs)
- PR #7 (merged) - incorporated the fix
- Upstream commit `0bbf2b1` - final correct implementation

## Status in Our Fork

Our fork has the complete fix. Our `sanitizeForJson` function (lines 220-271 of api.js):
- Uses the loop-based approach
- Correctly preserves quotes and backslashes
- Handles 2-byte (U+0080 to U+07FF), 3-byte (U+0800 to U+FFFF), and 4-byte (U+10000+) UTF-8 encoding
- Properly detects surrogate pairs via `codePointAt()` and skips the trailing surrogate

This issue is fully resolved in our fork.
