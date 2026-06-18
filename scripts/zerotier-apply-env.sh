#!/usr/bin/env bash
# Только прописать текущий ZeroTier IP в .env.tauri (после Authorize).
set -euo pipefail
cd "$(dirname "$0")/.."

CLI="/Library/Application Support/ZeroTier/One/zerotier-cli"
ZT_IP="$(
  "$CLI" -j listnetworks 2>/dev/null | python3 -c "
import json, sys
nets = json.load(sys.stdin)
for n in nets:
    for a in n.get('assignedAddresses') or []:
        print(a.split('/')[0])
        raise SystemExit(0)
sys.exit(1)
" 2>/dev/null || true
)"

if [[ -z "$ZT_IP" ]]; then
  echo "ZeroTier IP не найден. Сначала: npm run zerotier:join -- <Network ID>" >&2
  bash scripts/zerotier-status.sh
  exit 1
fi

ENV_TAURI=".env.tauri"
sed -i '' "s|^VITE_API_ORIGIN=.*|VITE_API_ORIGIN=http://${ZT_IP}:8080|" "$ENV_TAURI"
sed -i '' "s|^VITE_MINIO_PUBLIC_BASE=.*|VITE_MINIO_PUBLIC_BASE=http://${ZT_IP}:9000/batteries|" "$ENV_TAURI"
grep -q '^VITE_TAURI_USE_LAN_IP=' "$ENV_TAURI" || echo 'VITE_TAURI_USE_LAN_IP=true' >> "$ENV_TAURI"
sed -i '' 's|^VITE_TAURI_USE_LAN_IP=.*|VITE_TAURI_USE_LAN_IP=true|' "$ENV_TAURI"

echo ".env.tauri → http://${ZT_IP}:8080"
echo "Пересобери Tauri: npm run tauri:build:app"
