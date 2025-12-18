#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

# Detect an IP that phones on the same network can reach (best effort).
LAN_IP=""
if command -v hostname >/dev/null 2>&1; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LAN_IP" ] && command -v ipconfig >/dev/null 2>&1; then
  LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || true)
fi

cat <<URLS
📡 Preview server starting...
Local: http://localhost:${PORT}/index.html
LAN (share to phone): ${LAN_IP:+http://${LAN_IP}:${PORT}/index.html}
URLS

python -m http.server "$PORT" --bind "$HOST"
