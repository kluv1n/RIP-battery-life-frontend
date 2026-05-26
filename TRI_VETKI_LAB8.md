# Три ветки лабы 8 — не три репозитория

Обычно это **один репозиторий фронта**, **три ветки Git**. У вас эталон (sharding) разложен в папки; ваш код — в `RIP-battery-life-frontend`, ветка по смыслу **`lab8-tauri-pwa`**.

| Ветка Git | Папка-эталон у вас | Что это |
|-----------|-------------------|---------|
| **`lab8-tauri-pwa`** | `sharding-strategies-frontend-lab8-tauri-pwa` | Исходники: React, Redux, PWA, **частично** Tauri (у sharding без полного `src-tauri`) |
| **`gh-pages`** | `sharding-strategies-frontend-gh-pages` | **Только собранный сайт** (HTML, JS, `sw.js`, PWA) — то, что отдаёт GitHub Pages |
| **`tauri`** | `sharding-strategies-frontend-tauri` | Полный проект под **Tauri** + `runtimeConfig.ts` (localStorage + `VITE_API_ORIGIN`) |

Ветка `gh-pages` **не для правок** — её генерируют командой `npm run deploy` / `gh-pages -d dist`.  
Ветка `tauri` — те же исходники, но настройки под **exe** и LAN IP при сборке.

---

## Что куда класть в вашем репозитории

Работаете в **`RIP-battery-life-frontend`**, ветка **`lab8-tauri-pwa`** (или как у вас названа основная):

```text
lab8-tauri-pwa   →  весь код (src, src-tauri, package.json)
gh-pages         →  только dist после npm run deploy:gh-pages
tauri            →  можно не отдельная ветка: те же исходники + сборка Tauri с IP в .env
```

На защите показывают:

1. **Pages** — URL с GitHub (`gh-pages`), на телефоне PWA + mock.  
2. **Dev на ПК** — `npm run dev` + бэкенд localhost.  
3. **Tauri exe** — собранное приложение, API по **IP Wi‑Fi** (не localhost).

---

## localStorage — зачем четыре ключа

Вам в консоли дали «на всякий случай» несколько ключей. В **эталоне `tauri`** в коде реально используется **`rip.apiOrigin`** (`runtimeConfig.ts`).

В **вашем** проекте теперь читаются по порядку:

1. `rip.apiOrigin`  
2. `apiOrigin`  
3. `VITE_API_ORIGIN`  
4. `runtime_api_origin`  

Достаточно **одного**:

```javascript
localStorage.setItem("rip.apiOrigin", "http://192.168.56.1:8080");
location.reload();
```

Или IP вашей машины в Wi‑Fi (не `localhost` для Pages на телефоне / другого ПК).

**Когда это работает:** только на **собранном** сайте (GitHub Pages / preview), **не** в `npm run dev` — в dev localStorage **специально игнорируется**, чтобы работал прокси Vite → `localhost:8080`.

**На localhost:3000 (dev)** API задаётся через `.env` и прокси, localStorage не нужен.

---

## Windows — команды из чата (PowerShell)

Подставьте **свой IP** вместо `192.168.56.1` (`ipconfig` → IPv4).

### Tauri: сборка + запуск exe с LAN IP

```powershell
cd RIP-battery-life-frontend

$env:VITE_API_ORIGIN = "http://192.168.56.1:8080"
$env:VITE_MINIO_PUBLIC_BASE = "http://192.168.56.1:9000/test"
npm run tauri:build

# exe обычно здесь (имя может отличаться):
Start-Process -FilePath ".\src-tauri\target\release\battery-life-guest.exe"
```

Или одной командой (в `package.json` уже есть скрипт, **поменяйте IP в package.json** или через env):

```powershell
$env:VITE_API_ORIGIN = "http://ВАШ_IP:8080"
$env:VITE_MINIO_PUBLIC_BASE = "http://ВАШ_IP:9000/test"
npm run tauri:build:lan
```

### macOS / Linux (аналог)

```bash
cd RIP-battery-life-frontend
VITE_API_ORIGIN=http://192.168.56.1:8080 \
VITE_MINIO_PUBLIC_BASE=http://192.168.56.1:9000/test \
npm run tauri:build
open src-tauri/target/release/bundle/macos/*.app   # или .dmg
```

### Бэкенд должен слушать сеть

Go-сервер доступен не только с `127.0.0.1`, а с IP машины (часто `0.0.0.0:8080` или firewall открыт).

---

## Соответствие переменных (эталон ↔ ваш проект)

| Эталон `tauri` | Ваш `RIP-battery-life-frontend` |
|----------------|-----------------------------------|
| `VITE_API_ORIGIN=http://IP:8080` | то же + или `VITE_API_BASE_URL=http://IP:8080/api` в `.env` |
| `VITE_MINIO_PUBLIC_BASE` | то же в `.env` / при сборке Tauri |
| `localStorage rip.apiOrigin` | `src/modules/runtimeConfig.ts` |
| `npm run build:pages` + `deploy` | `npm run build:pages` + `deploy:gh-pages` |
| `npm run tauri:build:local` | `npm run tauri:build:lan` |

---

## Пошагово: три сценария

### A. Пункт 3 — dev (вы уже сделали)

```bash
# терминал 1
cd RIP2026-lab4_auth_swagger && docker compose up -d && go run ./cmd/server

# терминал 2
cd RIP-battery-life-frontend && cp .env.example .env && npm run dev
```

→ http://localhost:3000 , Redux `catalogFilters`, Network 1+2 запроса.

### B. GitHub Pages (ветка `gh-pages`)

```bash
cd RIP-battery-life-frontend
# в .env или перед сборкой:
# VITE_BASE_PATH=/ИМЯ-РЕПОЗИТОРИЯ/
npm run deploy:gh-pages
```

GitHub → Settings → Pages → branch **`gh-pages`**.

На **компьютере** открыли Pages, в консоли (F12) для доступа к бэку в LAN:

```javascript
localStorage.setItem("rip.apiOrigin", "http://192.168.56.1:8080");
location.reload();
```

На **телефоне** без бэка — mock, PWA «на экран домой».

### C. Tauri (ветка `tauri` по смыслу)

```bash
# .env или env при сборке — IP, не localhost
VITE_API_ORIGIN=http://192.168.56.1:8080
npm run tauri:build:lan
```

Запустить exe, в Network/логах запросы на `http://192.168.56.1:8080/api/...`.

---

## Папки-эталон — что внутри

### `sharding-strategies-frontend-gh-pages`

- Готовый **dist**: `index.html`, `assets/`, `sw.js`, `manifest.webmanifest`
- Пути с префиксом `/sharding-strategies-frontend/` (base path репозитория)
- **Нет** `src/` — не редактируют, только смотрят как выглядит Pages

### `sharding-strategies-frontend-tauri`

- Полный **исходник** + `src-tauri/`
- **`runtimeConfig.ts`** — localStorage + env
- Скрипты `tauri:build:local`, `build:pages`, PWA в vite

### `sharding-strategies-frontend-lab8-tauri-pwa`

- Похож на основную ветку sharding, **без** полного Tauri в дереве (у вас battery-life Tauri дописан в `RIP-battery-life-frontend`)

---

## Ваш проект сейчас

В `RIP-battery-life-frontend` добавлено как в эталоне **`tauri`**:

- `src/modules/runtimeConfig.ts` — localStorage + `VITE_API_ORIGIN`
- `batteryApi.ts`, `authApi.ts`, `api/index.ts` → `apiBaseUrl`
- скрипты `build:tauri`, `tauri:build:lan`

Подробный запуск: [ZAPUSK_I_PROVERKA.md](./ZAPUSK_I_PROVERKA.md), лаба: [README_LAB8.md](./README_LAB8.md).
