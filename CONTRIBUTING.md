# Contributing

## Scope

This project is useful only if it stays honest about what it can and cannot control.

Good contributions:
- improve transcript parsing compatibility
- improve desktop automation reliability on macOS
- add authentication and safer public exposure paths
- improve setup, docs, and test coverage
- reduce machine-specific assumptions

Changes that need extra care:
- anything that claims to make desktop send "fully reliable"
- anything that exposes the app publicly without an auth layer
- anything that depends on undocumented Codex Desktop internals

## Development setup

```bash
cp .env.example .env.local
npm install
npm run dev -- --hostname 0.0.0.0 --port 3001
```

If you open the dev server from another device, add your Mac's LAN IP to `ALLOWED_DEV_ORIGINS` in `.env.local`.

## Before opening a PR

Run:

```bash
npm run lint
npm test
npm run build
```

## Pull request guidelines

- keep changes scoped
- explain desktop automation tradeoffs clearly
- do not commit local runtime data or machine-specific secrets
- update the README when setup or behavior changes
- prefer synthetic screenshots or diagrams over real local transcripts

## Security

If your change affects networking, tunneling, auth, or desktop control, document the risk explicitly. This project can drive a local Codex Desktop session, so security regressions are product regressions.
