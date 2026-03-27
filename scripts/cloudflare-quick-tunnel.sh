#!/bin/bash
set -euo pipefail

HOST="${APP_HOST:-127.0.0.1}"
PORT="${APP_PORT:-3001}"
CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-$(command -v cloudflared)}"
LOG_DIR="${LOG_DIR:-${HOME}/Library/Logs/mobile-codex-viewer}"
LOG_FILE="${LOG_DIR}/cloudflared.log"

if [[ -z "${CLOUDFLARED_BIN}" ]]; then
  echo "cloudflared is required. Install it first with: brew install cloudflared" >&2
  exit 1
fi

mkdir -p "${LOG_DIR}"

exec "${CLOUDFLARED_BIN}" tunnel \
  --no-autoupdate \
  --url "http://${HOST}:${PORT}" >>"${LOG_FILE}" 2>&1
