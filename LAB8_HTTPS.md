# HTTPS для лаб. 8

## Быстрый показ на защите (компьютер)

```bash
# один раз
brew install mkcert
mkcert -install

cd RIP-battery-life-frontend
npm run dev:https
```

Открыть: **https://localhost:3000** — в адресной строке **https://**, замок без красного предупреждения (mkcert).

Прокси `/api` → `http://localhost:8080` работает как в обычном `npm run dev`.

---

## Сертификат на Wi‑Fi IP и ZeroTier

Если нужен **https://твой-ip:3000** (телефон в той же сети или ZeroTier):

```bash
# Wi‑Fi IP с en0 + localhost
npm run dev:https:certs

# + IP из ZeroTier (подставь свой из приложения ZeroTier)
ZEROTIER_IP=10.147.20.5 npm run dev:https:certs

npm run dev:https
```

Открыть, например: `https://172.20.10.3:3000` или `https://10.147.20.5:3000`.

> На телефоне mkcert-CA нет — будет предупреждение о сертификате. Для защиты обычно достаточно **https на Mac** в Chrome.

---

## Что в коде

| Файл | Роль |
|------|------|
| `vite.config.ts` | `VITE_DEV_HTTPS=true` → mkcert или `cert.crt`/`cert.key` |
| `scripts/gen-https-certs.sh` | `mkcert` для localhost + en0 + `ZEROTIER_IP` |
| `npm run dev:https` | dev-сервер с HTTPS |

GitHub Pages уже на **https://** (`kluv1n.github.io/...`) — отдельная настройка не нужна.

---

## ZeroTier (отдельно от HTTPS фронта)

1. Установить [ZeroTier](https://www.zerotier.com/download/), войти в сеть курса (Network ID от преподавателя).
2. В ZeroTier скопировать **Assigned Addresses** (например `10.147.x.x`).
3. Бэкенд слушает `0.0.0.0:8080`; в `.env.tauri` или `ZEROTIER_IP=... npm run dev:https:certs`.
4. Для Tauri: IP ZeroTier в `VITE_API_ORIGIN=http://10.147.x.x:8080`.
