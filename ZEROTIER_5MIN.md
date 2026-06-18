# ZeroTier за 5 минут — только скрины

## Вариант А (почти всё автоматом)

1. Открой https://my.zerotier.com/account → **Create API Access Token** → скопируй.
2. Создай файл `RIP-battery-life-frontend/.env.zerotier.local`:

```env
ZEROTIER_API_TOKEN=вставь_токен_сюда
```

3. В терминале:

```bash
cd RIP-battery-life-frontend
npm run zerotier:lab
```

Скрипт сам: создаст сеть `my-first-network`, join, Authorize, IP в `.env.tauri`, соберёт Tauri.

---

## Вариант Б (как на слайде, без API token)

| Шаг | Действие | Скрин |
|-----|----------|-------|
| 1 | `open -a ZeroTier` — иконка в **меню-баре** | ZeroTier UI |
| 2 | https://my.zerotier.com → **Create A Network** → скопируй **Network ID** (16 символов) | Central, сеть |
| 3 | ZeroTier → **Join Network** → вставь ID | Join |
| 4 | my.zerotier.com → сеть → **Members** → галочка **Authorize** у твоего ПК | Members Authorized |
| 5 | Запомни **ZT IP** (`10.x.x.x`) в Members | IP в таблице |
| 6 | Терминал: | |
| | `npm run zerotier:join -- ТВОЙ_NETWORK_ID` | |
| | (после Authorize) `npm run zerotier:apply` | |
| | `npm run tauri:build:app && npm run tauri:open` | Tauri + каталог |

**Node ID твоего Mac:** `npm run zerotier:status`

---

## Что показать на защите (как в примере)

1. **ZeroTier Central** — сеть, Members, **Authorized**, ZT IP (`10.99.x.x` / `10.147.x.x`).
2. **Текст:** «ZeroTier = виртуальная LAN, Tauri ходит на API по ZT IP, не localhost».
3. **Код / конфиг:**

```env
# .env.tauri
VITE_API_ORIGIN=http://10.99.242.73:8080
VITE_MINIO_PUBLIC_BASE=http://10.99.242.73:9000/batteries
```

4. **Проверка:** `curl http://ТВОЙ_ZT_IP:8080/api/battery_life_types`
5. **Tauri release** с каталогом с API.

---

## Команды

```bash
npm run zerotier:status   # Node ID, IP
npm run zerotier:lab      # полная автонастройка (нужен API token)
npm run zerotier:join -- <network_id>
npm run zerotier:apply    # IP → .env.tauri
npm run tauri:run:zt      # apply + сборка + запуск
```

**Важно:** API (Go) должен слушать `0.0.0.0:8080`, не только `127.0.0.1`.
