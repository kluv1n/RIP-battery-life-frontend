#!/usr/bin/env bash
# Подставляет IP с en0 в .env.tauri (только VITE_API_ORIGIN / VITE_MINIO_PUBLIC_BASE).
set -euo pipefail
cd "$(dirname "$0")/.."
IP="${TAURI_LAN_IP:-$(ipconfig getifaddr en0 2>/dev/null || true)}"
if [[ -z "$IP" ]]; then
  echo "Нет IP на en0. Задай: TAURI_LAN_IP=192.168.x.x bash scripts/tauri-set-ip.sh" >&2
  exit 1
fi
ENV=".env.tauri"
[[ -f "$ENV" ]] || { echo "Нет $ENV" >&2; exit 1; }
sed -i '' "s|^VITE_API_ORIGIN=.*|VITE_API_ORIGIN=http://${IP}:8080|" "$ENV"
sed -i '' "s|^VITE_MINIO_PUBLIC_BASE=.*|VITE_MINIO_PUBLIC_BASE=http://${IP}:9000/batteries|" "$ENV"
echo ".env.tauri → http://${IP}:8080 и :9000/batteries"
