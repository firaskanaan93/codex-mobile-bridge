#!/bin/bash
set -euo pipefail

LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
APP_PLIST="${LAUNCH_AGENTS_DIR}/com.mobile-codex-viewer.app.plist"
TUNNEL_PLIST="${LAUNCH_AGENTS_DIR}/com.mobile-codex-viewer.cloudflare.plist"

launchctl bootout "gui/$(id -u)/com.mobile-codex-viewer.app" 2>/dev/null || true
launchctl bootout "gui/$(id -u)/com.mobile-codex-viewer.cloudflare" 2>/dev/null || true

rm -f "${APP_PLIST}" "${TUNNEL_PLIST}"

echo "LaunchAgents removed."
