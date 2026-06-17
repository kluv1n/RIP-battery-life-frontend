#!/usr/bin/env bash
# Берёт IPv4 с en0 (Wi‑Fi / раздача с телефона), подставляет в Vite и запускает Tauri dev.
set -euo pipefail
cd "$(dirname "$0")/.."
IP="${TAURI_LAN_IP:-}"
if [[ -z "$IP" ]]; then
  IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
fi
if [[ -z "$IP" ]]; then
  echo "Не удалось получить IP с en0. Задай вручную: TAURI_LAN_IP=192.168.x.x npm run tauri:dev:autoip" >&2
  exit 1
fi
export VITE_GUEST_APP=true
export VITE_TAURI_USE_LAN_IP=true
export VITE_API_ORIGIN="http://${IP}:8080"
export VITE_MINIO_PUBLIC_BASE="http://${IP}:9000/batteries"
echo "Tauri dev → API $VITE_API_ORIGIN  MinIO $VITE_MINIO_PUBLIC_BASE"
exec npm run tauri -- dev
