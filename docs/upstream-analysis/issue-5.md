# Issue #5: extending searching function

- **Author**: gdkrmr
- **State**: OPEN

## Problem Description

The search function for emails is described as "very rudimentary." The author notes it is not possible for the LLM to search for unread emails, and suggests using `browser.messages.query` (the WebExtension API) for more comprehensive search capabilities. The issue asks:

1. What extra parameters should be included in the search function?
2. Can `browser.messages.query` be used in the privileged context, or does the `query` function need to be reimplemented?

## Discussion

**Oaklight** submitted PR #6 addressing part of this with date filtering, sorting, and result limiting.

**TKasperczyk** noted the issue was partially addressed in commit `0bbf2b1` with the search enhancements from PR #7:
- `startDate` / `endDate` - ISO 8601 date filtering
- `maxResults` - configurable limit, default 50, max 200
- `sortOrder` - "asc" or "desc"
- Empty query matches all messages

The owner left the issue open for remaining filters not yet covered:
- `unread` - filter by read/unread status
- `flagged` - filter by flagged status
- `folder` - filter by specific folder
- `fromMe` / `toMe` - filter by sender/recipient

## Addressed By

- PR #6 (closed, superseded by PR #7)
- PR #7 (merged) - partially addresses with date filtering and sorting
- PR #1 (open) - `getRecentMessages` has `unreadOnly` and `folderPath` filters but has bugs

## Status in Our Fork

Our fork has the same partial coverage as upstream post-PR #7. We have `startDate`, `endDate`, `maxResults`, and `sortOrder` parameters on `searchMessages`. The remaining requested features (unread filter, flagged filter, folder filter, fromMe/toMe) are not implemented.

These would be straightforward to add since the data is available on `msgHdr`:
- `msgHdr.isRead` for unread filtering
- `msgHdr.isFlagged` for flagged filtering
- Folder filtering by checking `folder.URI` against a parameter
- `fromMe`/`toMe` by comparing against account identities

This could be a good enhancement for our fork.
