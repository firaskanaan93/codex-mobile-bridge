# Mobile Codex Viewer with Next.js

## Summary
Build a mobile-first web app in this empty workspace using `Next.js + TypeScript + Tailwind` to browse Codex projects and threads from local Codex storage on the same machine.

V1 behavior:
- A project is defined by the Codex thread `cwd`.
- Thread lists are read from `~/.codex/state_5.sqlite`.
- Full conversation history is read from the JSONL file referenced by each thread’s `rollout_path`.
- Sending a message from mobile will not inject it directly into Codex, because no supported write path was found. Instead, the app stores it as a `pending` message tied to the thread.

## Key Changes
### App foundation
- Scaffold a `Next.js` app using the `App Router`.
- Use `TypeScript` across server and UI code.
- Use `Tailwind CSS` for a clean mobile-first interface.
- Add server-only configuration for local Codex paths:
  - `CODEX_STATE_DB=~/.codex/state_5.sqlite`
  - `CODEX_HOME=~/.codex`

### Server integration
- Add a server-only `services` layer:
  - `codexThreadIndexService` to read the `threads` table from SQLite
  - `codexTranscriptService` to read and parse transcript JSONL files
  - `mobileQueueService` to store app-owned pending messages
- Use a separate app-owned SQLite database for:
  - `queued_messages`
  - message delivery status such as `pending` and `failed`
- Do not mirror all Codex data into the app database; keep Codex reads live from local storage.

### Pages and APIs
- `/projects`
  - show all projects grouped by `cwd`
  - include thread count and latest activity
- `/projects/[projectKey]`
  - show all threads for a selected project
- `/threads/[threadId]`
  - show the full merged timeline
  - include Codex transcript items and app queued messages
  - include a message composer fixed near the bottom for mobile
- `GET /api/threads/[threadId]/timeline`
  - return a normalized merged timeline for polling refresh
- `POST /api/threads/[threadId]/messages`
  - validate input and store a new message as `pending`

### UI behavior
- Design the app mobile-first:
  - project selection
  - thread list
  - conversation view
  - sticky composer
- Use server rendering for initial page load.
- Use polling every few seconds on the thread page for updates.
- Show clear message state badges:
  - `pending`
  - `failed`
- Do not imply that Codex has actually received queued mobile messages.

### Outbound boundary
- Define a clear interface such as `CodexOutboundTransport`.
- Ship a v1 implementation named `QueuedOnlyTransport`.
- This implementation stores outgoing messages only and does not attempt to write into Codex internals.
- Keep this boundary ready for a future local bridge/helper if a real supported delivery path is added later.

## Interfaces / Types
- `ProjectSummary`
  - `cwd`
  - `projectKey`
  - `threadCount`
  - `lastUpdatedAt`
- `ThreadSummary`
  - `id`
  - `cwd`
  - `title`
  - `createdAt`
  - `updatedAt`
  - `archived`
  - `rolloutPath`
- `TimelineItem`
  - `id`
  - `source` = `codex | mobile_queue`
  - `role`
  - `body`
  - `timestamp`
  - `status?`
- Message submit API
  - input: `body`
  - context: `threadId`
  - output: queued record with `pending` status

## Test Plan
- Test reading and mapping threads from the Codex SQLite database.
- Test parsing transcript JSONL into normalized user, assistant, and event entries.
- Test the project route groups threads correctly by `cwd`.
- Test the project detail route returns only threads for the selected project.
- Test the thread timeline merges Codex transcript items with queued app messages.
- Test `POST /api/threads/[threadId]/messages` creates a `pending` queued record.
- Test failure cases:
  - invalid `threadId`
  - missing `rollout_path`
  - unreadable JSONL
  - empty or invalid message input

## Assumptions
- The app runs on the same machine that has access to `~/.codex`.
- V1 is private and LAN-only.
- V1 does not require login or multi-user support.
- Polling is sufficient for updates; websocket/SSE is out of scope for now.
- In V1, “send message” means queueing a local app message, not direct delivery into Codex.
- If direct Codex delivery becomes required later, it should be implemented through a separate local helper/bridge rather than writing directly into Codex internal files.
