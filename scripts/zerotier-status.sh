#!/usr/bin/env bash
# Статус ZeroTier: Node ID для Authorize, сети, IP.
set -euo pipefail

CLI="/Library/Application Support/ZeroTier/One/zerotier-cli"

if [[ ! -x "$CLI" ]]; then
  echo "ZeroTier не установлен. Скачай: https://www.zerotier.com/download/" >&2
  exit 1
fi

NODE_ID="$("$CLI" -j info 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('address',''))" 2>/dev/null || true)"

echo "=== ZeroTier ==="
echo "Node ID (для Authorize у препода): ${NODE_ID:-?}"
echo ""
echo "Сети:"
"$CLI" listnetworks 2>/dev/null || true
echo ""

ZT_IP="$(
  "$CLI" -j listnetworks 2>/dev/null | python3 -c "
import json, sys
try:
    nets = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for n in nets or []:
    st = (n.get('status') or '').upper()
    for a in n.get('assignedAddresses') or []:
        ip = a.split('/')[0]
        print(f'{ip}\t{n.get(\"id\",\"\")}\t{st}')
" 2>/dev/null | head -1 | cut -f1
)"

if [[ -n "$ZT_IP" ]]; then
  echo "ZeroTier IP: $ZT_IP"
  echo "Для Tauri: VITE_API_ORIGIN=http://${ZT_IP}:8080"
else
  echo "ZeroTier IP: пока нет (join сеть + Authorize узел $NODE_ID)"
  echo ""
  echo "Подключение:"
  echo "  npm run zerotier:join -- <16-символьный Network ID>"
  echo "  или положи ID в .env.zerotier.local → ZEROTIER_NETWORK_ID=..."
fi

echo ""
if pgrep -x zerotier-one >/dev/null; then
  echo "Служба zerotier-one: запущена"
else
  echo "Служба zerotier-one: НЕ запущена → open -a ZeroTier"
fi
