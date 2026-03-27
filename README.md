# Mobile Codex Viewer

Mobile Codex Viewer is a Next.js app that lets you browse local Codex projects and threads from your phone, then send a message into the real Codex desktop conversation on your Mac.

This project is not a generic chat frontend. It is a local companion for Codex Desktop:
- it reads project and thread metadata from your local Codex SQLite state database
- it reads conversation history from each thread transcript JSONL file
- it uses macOS UI automation to focus Codex Desktop, open the target thread, write into the real composer, and press send

## Status

The app is usable, but the send path is still version-sensitive because it depends on the Codex Desktop UI layout.

What is stable:
- project listing from local Codex state
- thread listing by workspace
- timeline rendering from transcript files
- public access through a temporary Cloudflare quick tunnel

What is inherently fragile:
- UI automation inside `Codex.app`
- composer focus and send behavior when the desktop layout changes

## Requirements

- macOS
- Codex Desktop installed
- Node.js 20+
- `sqlite3` CLI available on the machine
- local access to the same user profile that owns the Codex data
- Accessibility permission granted to the process that runs this app if you want mobile sends to control Codex Desktop

## Environment

Copy `.env.example` to `.env.local` and adjust as needed.

```bash
cp .env.example .env.local
```

Available variables:

- `CODEX_HOME`
  - path to the local Codex home directory
  - default: `~/.codex`
- `CODEX_STATE_DB`
  - path to the Codex state SQLite database
  - default: `<CODEX_HOME>/state_5.sqlite`
- `CODEX_DESKTOP_APP_NAME`
  - macOS application name used by AppleScript automation
  - default: `Codex`
- `CODEX_DESKTOP_CONTROLLER_MODE`
  - desktop controller mode
  - default: `ui-composer`
  - test modes: `mock-success`, `mock-busy`, `mock-unavailable`, `mock-thread-open-failed`, `mock-composer-not-found`, `mock-send-failed`
- `ALLOWED_DEV_ORIGINS`
  - optional comma-separated list for Next.js dev access from other devices
  - example: `http://192.168.1.50:3000,http://localhost:3000`

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open:

- local: `http://127.0.0.1:3001/projects`
- phone on the same network: `http://YOUR_MAC_LAN_IP:3001/projects`

## Public Access

This project should not be exposed directly through router port forwarding by default.

The safer practical option used during development was Cloudflare Tunnel:

```bash
brew install cloudflared
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:3001
```

That prints a temporary `https://<random>.trycloudflare.com` URL you can open from your phone.

Important:
- the quick tunnel lives only while `cloudflared` is running
- it is temporary and not a permanent production hostname
- if you expose this app publicly, add authentication before trusting it

## How It Works

### Read path

1. The app reads the Codex thread index from `state_5.sqlite`.
2. Projects are grouped by thread `cwd`.
3. Threads are rendered from the SQLite metadata.
4. Timeline entries are parsed from the thread transcript JSONL file referenced by `rollout_path`.

### Send path

1. The phone submits a message to `POST /api/threads/[threadId]/messages`.
2. The server resolves the target thread metadata.
3. The macOS desktop controller opens Codex Desktop and the target thread.
4. It writes into the real composer and presses Enter through AppleScript UI automation.
5. The app polls the transcript file to confirm the user message was actually written.

## Architecture Notes

- `src/lib/codex-thread-index.ts`
  - reads projects and threads from the Codex SQLite database
- `src/lib/codex-transcript.ts`
  - parses transcript JSONL into normalized timeline items
- `src/lib/desktop-controller.ts`
  - handles macOS UI automation for real desktop sends
- `src/lib/timeline.ts`
  - builds the thread timeline shown in the UI
- `src/app/api/threads/[threadId]/messages/route.ts`
  - validates and dispatches a mobile send request
- `src/app/api/threads/[threadId]/timeline/route.ts`
  - returns the current normalized timeline for polling

## Security Notes

If you publish this repo:
- do not commit `.env.local`
- do not commit runtime data folders like `.data/`
- do not commit local Codex artifacts like `.codex/`
- do not assume the app is safe to expose publicly without authentication

If you run this on the open internet, anybody who reaches the app can attempt to control your local Codex desktop session unless you put real access control in front of it.

## Testing

Run the checks:

```bash
npm run lint
npm test
npm run build
```

## Limitations

- macOS only for the real send path
- depends on the Codex Desktop UI layout and focus behavior
- transcript parsing depends on current Codex transcript formats
- no authentication is built in

## License

No license file is included yet. Add one before publishing if you want others to reuse the code under explicit terms.
