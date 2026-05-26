# Лабораторная 8 — PWA, GitHub Pages, Tauri, Redux-фильтр, HTTPS

Проект: `RIP-battery-life-frontend`.

> Папка `sharding-strategies-frontend-lab8-tauri-pwa` в репозитории **не содержит** готовой реализации PWA/Tauri — лаб. 8 сделана здесь по методичке.

---

## 1. Что реализовано в коде

| Требование | Где |
|------------|-----|
| Redux Toolkit — фильтр каталога | `src/store/slices/catalogFiltersSlice.ts`, `ServicesPage.tsx` |
| PWA | `vite-plugin-pwa` в `vite.config.ts` |
| GitHub Pages | `VITE_BASE_PATH`, скрипт `npm run deploy:gh-pages` |
| Адаптивность 3 страниц | `lab-index-style.css` — каталог, карточка типа, заявка |
| Tauri гость (3 страницы) | `src-tauri/`, `AppGuest.tsx`, `VITE_GUEST_APP=true` |
| HTTPS в dev | `npm run dev:https` (`@vitejs/plugin-basic-ssl`) |
| API по IP LAN | `.env` → `VITE_API_BASE_URL=http://192.168.x.x:8080/api` |

Конкретные breakpoints и число колонок — в [LAB8_RESPONSIVE.md](./LAB8_RESPONSIVE.md).

---

## 2. Установка зависимостей

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
npm install
```

Для Tauri на macOS:

```bash
# Rust (если нет): https://rustup.rs
xcode-select --install   # при необходимости
```

Иконка для сборки Tauri (один раз):

```bash
mkdir -p src-tauri/icons
# положите PNG 1024×1024 как src-tauri/icons/icon.png
# или: npx tauri icon public/img/logo.svg
```

---

## 3. Запуск для разработки (веб)

### Бэкенд + Docker (как в лаб. 4–7)

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP2026-lab4_auth_swagger
docker compose up -d
go run ./cmd/server
```

### Фронт

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
cp .env.example .env
npm run dev
```

Открыть: http://localhost:3000

### HTTPS (для показа на защите)

```bash
npm run dev:https
```

Браузер: https://localhost:3000 (самоподписанный сертификат — подтвердить исключение).

### Redux DevTools (`catalogFilters`)

Пошагово: **[ZAPUSK_I_PROVERKA.md](./ZAPUSK_I_PROVERKA.md)** (пункты 1–3, Network, Redux).

Кратко: расширение [Redux DevTools](https://github.com/reduxjs/redux-devtools) → F12 → вкладка **Redux** → в state слайс **`catalogFilters`**, поле **`title`** (строка поиска в каталоге). При вводе в поиск — action `catalogFilters/setCatalogTitleFilter`. Сценарий защиты: ввести текст → открыть карточку → «Назад» — **`title` не пустой**.

**Network:** главная `/` — **1×** `battery_life_types`; карточка `/battery/:id` — **2×** `battery_life_type/{id}` (страница + крошки).

---

## 4. GitHub Pages (mock на телефоне + PWA)

### 4.1. Настроить base path

В `.env` или перед сборкой (подставьте **своё** имя репозитория):

```bash
export VITE_BASE_PATH=/RIP-frontend/
# если репозиторий только battery-life-frontend:
# export VITE_BASE_PATH=/RIP-battery-life-frontend/
```

### 4.2. Сборка и деплой

```bash
npm run build:pages
# или публикация в ветку gh-pages:
npm run deploy:gh-pages
```

В настройках GitHub репозитория: **Pages → Source: Deploy from branch → `gh-pages` / root**.

### 4.3. Телефон (mock)

1. Откройте URL Pages (без бэка каталог подставит **mock**).
2. Chrome/Safari → «Добавить на экран домой» → PWA.
3. Запустите PWA, проверьте фильтр и переход «Подробнее».

---

## 5. GitHub Pages + бэкенд с компьютера

Бэкенд на `localhost:8080` с телефона недоступен. Варианты:

- Поднять API на **IP машины в Wi‑Fi**: `go run` на `0.0.0.0:8080` и в `.env.production.local` для сборки Pages указать `VITE_API_BASE_URL=http://192.168.1.XX:8080/api` (редко для Pages).
- На защите: **на компьютере** открыть Pages и показать работу с бэкендом через `npm run dev` + proxy.

---

## 6. Tauri (гость, API по IP в LAN)

### 6.1. Узнать IP сервера

На Mac с бэкендом:

```bash
ipconfig getifaddr en0
# пример: 192.168.1.42
```

В консоли Go при старте слушает `:8080` — в коде приложения тот же хост.

### 6.2. Файл `.env` для Tauri

```env
VITE_API_BASE_URL=http://192.168.1.42:8080/api
```

(замените IP). **Не используйте `localhost`** в Tauri — это другой контекст.

### 6.3. Запуск dev Tauri

```bash
npm run tauri:dev
```

Откроется окно с **3 страницами**: каталог, тип АКБ, пример заявки (`/battery-life/1` mock). Без входа и без редактирования.

### 6.4. Сборка установщика (release)

```bash
npm run tauri:build
```

Артефакт: `src-tauri/target/release/bundle/…`

### 6.5. Wireshark / tcpdump — порт Tauri

После запуска собранного приложения:

```bash
# macOS
sudo lsof -iTCP -sTCP:LISTEN -n -P | grep -i battery
# или
sudo tcpdump -i any host 192.168.1.42 and port 8080
```

Исходящие запросы приложения идут на **порт API (8080)**, не на «порт Tauri». Порт Tauri — локальный webview; для задания покажите **исходящий HTTP на 8080** с IP из `.env`.

### 6.6. Изменение услуги в БД

```bash
# пример: Adminer http://localhost:8081 или psql
# таблица battery_types — изменить title, перезапустить список в Tauri
```

---

## 7. Скрипты npm

| Скрипт | Назначение |
|--------|------------|
| `npm run dev` | Веб, полное приложение |
| `npm run dev:guest` | Веб, только гость (3 страницы) |
| `npm run dev:https` | Dev с HTTPS |
| `npm run build` | Production build |
| `npm run build:guest` | Build для Tauri |
| `npm run build:pages` | Build + `404.html` для SPA на Pages |
| `npm run deploy:gh-pages` | Публикация на GitHub Pages |
| `npm run tauri:dev` | Tauri + hot reload |
| `npm run tauri:build` | Сборка Tauri |

---

## 8. Что сделать на защите (чеклист)

- [ ] Телефон: GitHub Pages, PWA, mock, фильтр → деталь → назад (фильтр на месте).
- [ ] DevTools: сузить ширину — **3 → 2 → 1** колонки каталога (992 / 640 px).
- [ ] Показать `catalogFiltersSlice` и Redux DevTools.
- [ ] Компьютер: Pages или dev + бэкенд.
- [ ] Tauri **release**, API по `192.168.x.x`, сравнить IP в `.env` и `ipconfig`.
- [ ] tcpdump/lsof — трафик на `:8080`.
- [ ] Правка `battery_types` в БД → обновление в Tauri.
- [ ] `npm run dev:https` — HTTPS локально.

---

## 9. Ограничения

- Полный **CLIP**-поиск по фото в PWA/Tauri может быть тяжёлым на слабых устройствах.
- Для Pages без бэка используется **mock** — это нормально для пункта «телефон + mock».
- Иконка Tauri (`src-tauri/icons/icon.png`) нужно добавить вручную перед `tauri build`.
