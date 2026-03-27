#!/bin/bash
set -euo pipefail

LOG_FILE="${LOG_FILE:-${HOME}/Library/Logs/mobile-codex-viewer/cloudflared.log}"

if [[ ! -f "${LOG_FILE}" ]]; then
  echo "No Cloudflare log found at ${LOG_FILE}" >&2
  exit 1
fi

URL="$(grep -Eo 'https://[[:alnum:]-]+\.trycloudflare\.com' "${LOG_FILE}" | tail -n 1)"

if [[ -z "${URL}" ]]; then
  echo "No quick tunnel URL found in ${LOG_FILE}" >&2
  exit 1
fi

printf '%s\n' "${URL}"
