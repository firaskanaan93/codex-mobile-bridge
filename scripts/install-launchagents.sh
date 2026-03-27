#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
LOG_DIR="${HOME}/Library/Logs/mobile-codex-viewer"
APP_PLIST="${LAUNCH_AGENTS_DIR}/com.mobile-codex-viewer.app.plist"
TUNNEL_PLIST="${LAUNCH_AGENTS_DIR}/com.mobile-codex-viewer.cloudflare.plist"
APP_SCRIPT="${ROOT_DIR}/scripts/start-prod-server.sh"
TUNNEL_SCRIPT="${ROOT_DIR}/scripts/cloudflare-quick-tunnel.sh"
NPM_BIN="${NPM_BIN:-$(command -v npm)}"
CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-$(command -v cloudflared)}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3001}"

if [[ -z "${NPM_BIN}" ]]; then
  echo "npm is required." >&2
  exit 1
fi

if [[ -z "${CLOUDFLARED_BIN}" ]]; then
  echo "cloudflared is required. Install it first with: brew install cloudflared" >&2
  exit 1
fi

mkdir -p "${LAUNCH_AGENTS_DIR}" "${LOG_DIR}"

cat >"${APP_PLIST}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.mobile-codex-viewer.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>${APP_SCRIPT}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>APP_HOST</key>
    <string>${APP_HOST}</string>
    <key>APP_PORT</key>
    <string>${APP_PORT}</string>
    <key>NPM_BIN</key>
    <string>${NPM_BIN}</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/app.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/app.err.log</string>
</dict>
</plist>
PLIST

cat >"${TUNNEL_PLIST}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.mobile-codex-viewer.cloudflare</string>
  <key>ProgramArguments</key>
  <array>
    <string>${TUNNEL_SCRIPT}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>APP_HOST</key>
    <string>${APP_HOST}</string>
    <key>APP_PORT</key>
    <string>${APP_PORT}</string>
    <key>CLOUDFLARED_BIN</key>
    <string>${CLOUDFLARED_BIN}</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/cloudflared.stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/cloudflared.stderr.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)/com.mobile-codex-viewer.app" 2>/dev/null || true
launchctl bootout "gui/$(id -u)/com.mobile-codex-viewer.cloudflare" 2>/dev/null || true

launchctl bootstrap "gui/$(id -u)" "${APP_PLIST}"
launchctl bootstrap "gui/$(id -u)" "${TUNNEL_PLIST}"
launchctl kickstart -k "gui/$(id -u)/com.mobile-codex-viewer.app"
launchctl kickstart -k "gui/$(id -u)/com.mobile-codex-viewer.cloudflare"

echo "LaunchAgents installed."
echo "Current public URL (if available):"
"${ROOT_DIR}/scripts/print-cloudflare-url.sh" || true
