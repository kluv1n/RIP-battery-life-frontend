#!/usr/bin/env bash
# Сертификаты для npm run dev:https (localhost + Wi‑Fi IP + опционально ZeroTier).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v mkcert &>/dev/null; then
  echo "Сначала установи mkcert:" >&2
  echo "  brew install mkcert" >&2
  echo "  mkcert -install" >&2
  exit 1
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
ZEROTIER_IP="${ZEROTIER_IP:-}"
EXTRA_IP="${HTTPS_CERT_IP:-}"

HOSTS=(localhost 127.0.0.1 ::1)
[[ -n "$LAN_IP" ]] && HOSTS+=("$LAN_IP")
[[ -n "$EXTRA_IP" ]] && HOSTS+=("$EXTRA_IP")
[[ -n "$ZEROTIER_IP" ]] && HOSTS+=("$ZEROTIER_IP")

echo "mkcert для: ${HOSTS[*]}"
mkcert -cert-file cert.crt -key-file cert.key "${HOSTS[@]}"
echo ""
echo "Готово: cert.crt, cert.key"
echo "Запуск: npm run dev:https"
echo "Открыть: https://localhost:3000"
[[ -n "$LAN_IP" ]] && echo "         https://${LAN_IP}:3000"
[[ -n "$ZEROTIER_IP" ]] && echo "         https://${ZEROTIER_IP}:3000"
