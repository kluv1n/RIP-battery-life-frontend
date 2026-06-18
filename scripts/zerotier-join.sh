#!/usr/bin/env bash
# join ZeroTier сети курса → ждём IP → пишем в .env.tauri
set -euo pipefail
cd "$(dirname "$0")/.."

CLI="/Library/Application Support/ZeroTier/One/zerotier-cli"
ENV_LOCAL=".env.zerotier.local"

NETWORK_ID="${1:-${ZEROTIER_NETWORK_ID:-}}"
if [[ -z "$NETWORK_ID" && -f "$ENV_LOCAL" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  NETWORK_ID="${ZEROTIER_NETWORK_ID:-}"
fi

if [[ ! -x "$CLI" ]]; then
  echo "Установи ZeroTier: https://www.zerotier.com/download/" >&2
  exit 1
fi

if [[ -z "$NETWORK_ID" ]]; then
  echo "Нужен Network ID (16 символов) от преподавателя." >&2
  echo "" >&2
  echo "Вариант 1:" >&2
  echo "  npm run zerotier:join -- a1b2c3d4e5f6g7h8" >&2
  echo "" >&2
  echo "Вариант 2 — файл .env.zerotier.local:" >&2
  echo "  ZEROTIER_NETWORK_ID=a1b2c3d4e5f6g7h8" >&2
  echo "" >&2
  bash scripts/zerotier-status.sh
  exit 1
fi

NODE_ID="$("$CLI" -j info | python3 -c "import json,sys; print(json.load(sys.stdin)['address'])")"

echo "Node ID: $NODE_ID  (попроси препода Authorize, если зависнет на REQUESTING)"
echo "Join: $NETWORK_ID"
"$CLI" join "$NETWORK_ID"

echo "Ожидание IP (до 90 с)…"
ZT_IP=""
for _ in $(seq 1 30); do
  ZT_IP="$(
    "$CLI" -j listnetworks | python3 -c "
import json, sys
nets = json.load(sys.stdin)
want = '${NETWORK_ID}'.replace('-', '').lower()
for n in nets:
    nid = (n.get('id') or '').replace('-', '').lower()
    if want and nid != want:
        continue
    for a in n.get('assignedAddresses') or []:
        print(a.split('/')[0])
        raise SystemExit(0)
" 2>/dev/null || true
  )"
  if [[ -n "$ZT_IP" ]]; then
    break
  fi
  STATUS="$("$CLI" listnetworks 2>/dev/null | grep -i "$NETWORK_ID" | awk '{print $4}' || true)"
  echo "  статус: ${STATUS:-ожидание…}"
  if [[ "$STATUS" == *REQUESTING* ]]; then
    echo "  → Открой https://my.zerotier.com или попроси препода Authorize узел $NODE_ID"
  fi
  sleep 3
done

if [[ -z "$ZT_IP" ]]; then
  echo "" >&2
  echo "IP не выдан. Сделай Authorize для Node ID: $NODE_ID" >&2
  echo "Потом: npm run zerotier:status && npm run zerotier:apply" >&2
  exit 1
fi

echo "ZeroTier IP: $ZT_IP"

ENV_TAURI=".env.tauri"
if [[ -f "$ENV_TAURI" ]]; then
  sed -i '' "s|^VITE_API_ORIGIN=.*|VITE_API_ORIGIN=http://${ZT_IP}:8080|" "$ENV_TAURI"
  sed -i '' "s|^VITE_MINIO_PUBLIC_BASE=.*|VITE_MINIO_PUBLIC_BASE=http://${ZT_IP}:9000/batteries|" "$ENV_TAURI"
  grep -q '^VITE_TAURI_USE_LAN_IP=' "$ENV_TAURI" || echo 'VITE_TAURI_USE_LAN_IP=true' >> "$ENV_TAURI"
  sed -i '' 's|^VITE_TAURI_USE_LAN_IP=.*|VITE_TAURI_USE_LAN_IP=true|' "$ENV_TAURI"
  echo "Обновлён $ENV_TAURI"
else
  echo "Нет $ENV_TAURI — создай вручную с IP $ZT_IP"
fi

echo ""
echo "Дальше:"
echo "  1) API на 0.0.0.0:8080 (go run / docker)"
echo "  2) npm run tauri:build:app && npm run tauri:open"
echo "  3) curl http://${ZT_IP}:8080/api/battery_life_types"
