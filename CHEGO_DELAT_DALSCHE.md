# Вы на `lab8-tauri-pwa` — что делать дальше (простыми словами)

Репозиторий: **https://github.com/kluv1n/RIP-battery-life-frontend**  
Сейчас вы в ветке **`lab8-tauri-pwa`** — это **правильно**, здесь живёт весь код.

---

## Главная идея (одним абзацем)

| Ветка | Что это | Кто создаёт |
|-------|---------|-------------|
| **`lab8-tauri-pwa`** | Обычный код (React, Redux, Tauri-папка) | **Вы** — коммиты и push |
| **`gh-pages`** | Готовый сайт для GitHub Pages (как папка `sharding-strategies-frontend-gh-pages`) | **Автоматически** командой `npm run deploy:gh-pages` |
| **`tauri`** | В эталоне sharding — отдельная копия под exe. **У вас exe собирается из `lab8-tauri-pwa`**, отдельную ветку `tauri` заводить **не обязательно**, если преподаватель не требует отдельно |

Папки `sharding-strategies-frontend-*` у вас на диске — **примеры чужого проекта**, не ваши ветки. Смотрите на образец, код пишете в **`RIP-battery-life-frontend`**.

---

## Шаг 0 — что уже сделано (пункт 3)

Если у вас открывается http://localhost:3000 и каталог виден — **пункт «dev» готов**.

Два терминала:

```bash
# Терминал 1 — бэкенд
cd /Users/kryzhnyiklim/RIP-frontend/RIP2026-lab4_auth_swagger
docker compose up -d
go run ./cmd/server

# Терминал 2 — фронт (ветка lab8-tauri-pwa)
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
npm install
cp .env.example .env   # один раз
npm run dev
```

---

## Шаг 1 — сохранить код в GitHub (ветка `lab8-tauri-pwa`)

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
git status
git add .
git commit -m "Lab 8: PWA, Redux catalog filter, Tauri guest, runtimeConfig"
git push -u origin lab8-tauri-pwa
```

На GitHub откройте репозиторий → ветка **`lab8-tauri-pwa`** — там весь исходник.  
**Ничего вручную в `gh-pages` не копируете.**

---

## Шаг 2 — выложить сайт на GitHub Pages (появится ветка `gh-pages`)

Один раз в `.env` или перед командой (имя репозитория):

```bash
export VITE_BASE_PATH=/RIP-battery-life-frontend/
```

Сборка и публикация:

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
npm run deploy:gh-pages
```

Что произойдёт:

1. Соберётся `dist/`
2. Создастся/обновится ветка **`gh-pages`** на GitHub
3. Сайт будет: **https://kluv1n.github.io/RIP-battery-life-frontend/**

В GitHub: **Settings → Pages → Source: branch `gh-pages` / folder root** (если ещё не включено).

**Показ на защите (телефон):**

- Открыть этот URL на телефоне
- «Добавить на экран» → PWA
- Ввести фильтр в поиск → карточка → назад (Redux `catalogFilters`)
- Без бэка на телефоне будет **mock** — для лабы это нормально

**Показ на компьютере с бэкендом:** открыть тот же URL, F12 → Console:

```javascript
localStorage.setItem("rip.apiOrigin", "http://ВАШ_IP:8080");
location.reload();
```

(не `localhost`, IP машины в Wi‑Fi; **не** работает в `npm run dev`, только на Pages)

---

## Шаг 3 — Tauri (exe), остаётесь на `lab8-tauri-pwa`

Отдельную ветку `tauri` **не нужно**, если не сказали иначе. Сборка из текущей папки.

### macOS

```bash
# Узнать IP (для .env)
ipconfig getifaddr en0

cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend

# Подставьте свой IP вместо 192.168.x.x
export VITE_API_ORIGIN=http://192.168.x.x:8080
export VITE_MINIO_PUBLIC_BASE=http://192.168.x.x:9000/test

npm run tauri:build
# Запуск: src-tauri/target/release/bundle/ (app или dmg)
```

### Windows (PowerShell)

```powershell
cd RIP-battery-life-frontend
$env:VITE_API_ORIGIN = "http://192.168.x.x:8080"
$env:VITE_MINIO_PUBLIC_BASE = "http://192.168.x.x:9000/test"
npm run tauri:build
Start-Process ".\src-tauri\target\release\battery-life-guest.exe"
```

Бэкенд на том же IP, порт **8080**. В Tauri **не** `localhost`.

**Показ на защите:**

- Запустить **собранный** exe (не `npm run dev`)
- Сравнить IP в `.env` / переменных сборки и `ipconfig`
- Показать список типов АКБ с API
- (опционально) правка в БД → обновление в Tauri

---

## Шаг 4 — что говорить и что открывать на защите (порядок)

| № | Что показать | Как открыть |
|---|--------------|-------------|
| 1 | PWA + mock на телефоне | GitHub Pages URL |
| 2 | Фильтр Redux сохраняется | Pages или `npm run dev` + Redux DevTools → `catalogFilters.title` |
| 3 | Адаптивность 3→2→1 колонки | F12, сузить окно на каталоге |
| 4 | Бэкенд с ПК | `npm run dev` + бэкенд, Network |
| 5 | Tauri + IP LAN | exe после `tauri:build` |
| 6 | HTTPS | `npm run dev:https` |

---

## Схема «куда что кидать»

```text
Ваш компьютер (папка RIP-battery-life-frontend, ветка lab8-tauri-pwa)
        │
        │  git push
        ▼
GitHub: ветка lab8-tauri-pwa     ← исходники, проверяет преподаватель
        │
        │  npm run deploy:gh-pages
        ▼
GitHub: ветка gh-pages           ← только сайт, НЕ править руками
        │
        │  npm run tauri:build (локально)
        ▼
exe на ноутбуке                  ← показать на защите, в Git можно не класть
```

---

## Что НЕ путать

- **`sharding-strategies-frontend-gh-pages`** на диске = пример готового Pages, **не ваша ветка**
- **`sharding-strategies-frontend-tauri`** = пример другого проекта, у вас Tauri уже в **`RIP-battery-life-frontend/src-tauri`**
- **Четыре ключа localStorage** — достаточно **`rip.apiOrigin`**
- **Redux `catalogFilters`** — только для поиска в каталоге на главной

---

## Минимальный чеклист «всё готово»

- [ ] `git push origin lab8-tauri-pwa`
- [ ] `npm run deploy:gh-pages` → открывается https://kluv1n.github.io/RIP-battery-life-frontend/
- [ ] На телефоне PWA ставится
- [ ] `npm run tauri:build` с IP → exe открывается и видит API
- [ ] Redux: фильтр после «назад» на месте

Если застрянете на шаге — напишите номер шага (1–4), разберём точечно.
