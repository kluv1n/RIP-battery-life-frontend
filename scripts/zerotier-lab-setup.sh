#!/usr/bin/env bash
# Полная настройка ZeroTier для лаб. 8: сеть → join → authorize → .env.tauri → (опц.) сборка Tauri
set -euo pipefail
cd "$(dirname "$0")/.."

CLI="/Library/Application Support/ZeroTier/One/zerotier-cli"
ENV_LOCAL=".env.zerotier.local"
ENV_TAURI=".env.tauri"
BUILD_TAURI="${ZEROTIER_BUILD_TAURI:-true}"

if [[ -f "$ENV_LOCAL" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
fi

if [[ ! -x "$CLI" ]]; then
  echo "Установи ZeroTier: https://www.zerotier.com/download/" >&2
  exit 1
fi

if [[ -z "${ZEROTIER_API_TOKEN:-}" ]]; then
  echo "Нужен API token ZeroTier Central (один раз):" >&2
  echo "  1) https://my.zerotier.com/account → Create API Access Token" >&2
  echo "  2) Создай $ENV_LOCAL:" >&2
  echo "     ZEROTIER_API_TOKEN=твой_токен" >&2
  echo "  3) npm run zerotier:lab" >&2
  open "https://my.zerotier.com/account" 2>/dev/null || true
  exit 1
fi

NODE_ID="$("$CLI" -j info | python3 -c "import json,sys; print(json.load(sys.stdin)['address'])")"
AUTH="Authorization: token ${ZEROTIER_API_TOKEN}"

api() {
  local method="$1" path="$2" data="${3:-}"
  if [[ -n "$data" ]]; then
    curl -sfS -X "$method" "https://my.zerotier.com/api${path}" \
      -H "$AUTH" -H "Content-Type: application/json" -d "$data"
  else
    curl -sfS -X "$method" "https://my.zerotier.com/api${path}" -H "$AUTH"
  fi
}

NETWORK_ID="${ZEROTIER_NETWORK_ID:-}"

if [[ -z "$NETWORK_ID" ]]; then
  echo "Создаю сеть my-first-network (RIP Lab8)…"
  RESP="$(api POST /network '{"config":{"name":"my-first-network","description":"RIP Lab8 battery-life","private":true}}')"
  NETWORK_ID="$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")"
  echo "Network ID: $NETWORK_ID"
  # сохранить для следующих запусков
  if [[ -f "$ENV_LOCAL" ]]; then
    if grep -q '^ZEROTIER_NETWORK_ID=' "$ENV_LOCAL"; then
      sed -i '' "s|^ZEROTIER_NETWORK_ID=.*|ZEROTIER_NETWORK_ID=${NETWORK_ID}|" "$ENV_LOCAL"
    else
      echo "ZEROTIER_NETWORK_ID=${NETWORK_ID}" >> "$ENV_LOCAL"
    fi
  else
    cat > "$ENV_LOCAL" <<EOF
ZEROTIER_API_TOKEN=${ZEROTIER_API_TOKEN}
ZEROTIER_NETWORK_ID=${NETWORK_ID}
EOF
  fi
else
  echo "Использую сеть: $NETWORK_ID"
fi

echo "Join + Authorize узел $NODE_ID…"
"$CLI" join "$NETWORK_ID" >/dev/null 2>&1 || true
api POST "/network/${NETWORK_ID}/member/${NODE_ID}" '{"authorized":true,"name":"MacBook Lab8"}' >/dev/null

open "https://my.zerotier.com/network/${NETWORK_ID}" 2>/dev/null || true
open -a ZeroTier 2>/dev/null || true

echo "Жду ZeroTier IP…"
ZT_IP=""
for _ in $(seq 1 40); do
  ZT_IP="$(
    "$CLI" -j listnetworks 2>/dev/null | python3 -c "
import json,sys
want='${NETWORK_ID}'.lower()
for n in json.load(sys.stdin):
    if (n.get('id') or '').lower()!=want: continue
    for a in n.get('assignedAddresses') or []:
        print(a.split('/')[0]); raise SystemExit(0)
" 2>/dev/null || true
  )"
  [[ -n "$ZT_IP" ]] && break
  sleep 2
done

if [[ -z "$ZT_IP" ]]; then
  echo "IP не получен. Открой Members на my.zerotier.com и Authorize $NODE_ID вручную." >&2
  echo "Потом: npm run zerotier:apply" >&2
  exit 1
fi

echo ""
echo "============================================"
echo " ZeroTier готов"
echo " Network ID:  $NETWORK_ID"
echo " Node ID:     $NODE_ID"
echo " ZT IP:       $ZT_IP"
echo " API:         http://${ZT_IP}:8080"
echo "============================================"

[[ -f "$ENV_TAURI" ]] || cp .env.tauri.example "$ENV_TAURI" 2>/dev/null || true
if [[ ! -f "$ENV_TAURI" ]]; then
  cat > "$ENV_TAURI" <<EOF
VITE_GUEST_APP=true
VITE_TAURI_USE_LAN_IP=true
VITE_BASE_PATH=/
VITE_API_ORIGIN=http://${ZT_IP}:8080
VITE_MINIO_PUBLIC_BASE=http://${ZT_IP}:9000/batteries
EOF
else
  grep -q '^VITE_GUEST_APP=' "$ENV_TAURI" || echo 'VITE_GUEST_APP=true' >> "$ENV_TAURI"
  sed -i '' 's|^VITE_GUEST_APP=.*|VITE_GUEST_APP=true|' "$ENV_TAURI"
  sed -i '' 's|^VITE_TAURI_USE_LAN_IP=.*|VITE_TAURI_USE_LAN_IP=true|' "$ENV_TAURI"
  grep -q '^VITE_TAURI_USE_LAN_IP=' "$ENV_TAURI" || echo 'VITE_TAURI_USE_LAN_IP=true' >> "$ENV_TAURI"
  sed -i '' "s|^VITE_API_ORIGIN=.*|VITE_API_ORIGIN=http://${ZT_IP}:8080|" "$ENV_TAURI"
  sed -i '' "s|^VITE_MINIO_PUBLIC_BASE=.*|VITE_MINIO_PUBLIC_BASE=http://${ZT_IP}:9000/batteries|" "$ENV_TAURI"
fi

echo "Обновлён $ENV_TAURI"

if [[ "$BUILD_TAURI" == "true" ]]; then
  echo "Сборка Tauri…"
  if command -v cargo >/dev/null 2>&1 || [[ -f "$HOME/.cargo/env" ]]; then
    # shellcheck disable=SC1091
    [[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
    export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$PWD/src-tauri/target}"
    npm run tauri:build:app
    echo "Запуск: npm run tauri:open"
  else
    echo "cargo не найден — собери позже: npm run tauri:build:app"
  fi
fi

echo ""
echo "Скрины для отчёта:"
echo "  1) my.zerotier.com → сеть $NETWORK_ID, Members, Authorized"
echo "  2) ZeroTier в меню-баре → IP $ZT_IP"
echo "  3) cat .env.tauri  (VITE_API_ORIGIN)"
echo "  4) Tauri каталог + curl http://${ZT_IP}:8080/api/battery_life_types"
