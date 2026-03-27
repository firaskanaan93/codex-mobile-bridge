#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${APP_HOST:-127.0.0.1}"
PORT="${APP_PORT:-3001}"
NPM_BIN="${NPM_BIN:-$(command -v npm)}"

if [[ -z "${NPM_BIN}" ]]; then
  echo "npm is required." >&2
  exit 1
fi

cd "${ROOT_DIR}"
exec "${NPM_BIN}" run start -- --hostname "${HOST}" --port "${PORT}"
