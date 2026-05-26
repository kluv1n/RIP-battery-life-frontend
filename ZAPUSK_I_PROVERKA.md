# Полная инструкция: запуск, проверка, Redux DevTools

Проект: `RIP-battery-life-frontend`  
Сайт в dev: **http://localhost:3000**

---

## Что вы уже сделали (пункты 1 и 2)

| Шаг | Что это | Команды |
|-----|---------|---------|
| **1** | Бэкенд + база | `docker compose up -d` и `go run ./cmd/server` в `RIP2026-lab4_auth_swagger` |
| **2** | Фронт, зависимости | `npm install`, `cp .env.example .env` в `RIP-battery-life-frontend` |

Если шаг 1 не запущен — каталог покажет **mock** (заглушки), API не ответит.

---

## Пункт 3 — запуск фронта (то, что «не понял»)

### Терминал 1 — бэкенд (оставить работать)

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP2026-lab4_auth_swagger
docker compose up -d
go run ./cmd/server
```

Должно слушать **:8080** (в логе без ошибки про PostgreSQL).

### Терминал 2 — фронт

```bash
cd /Users/kryzhnyiklim/RIP-frontend/RIP-battery-life-frontend
cp .env.example .env    # если ещё не копировали
npm run dev
```

В консоли: `Local: http://localhost:3000/`

### Открыть в браузере

http://localhost:3000

**Проверка, что «всё живое»:**

1. Каталог — карточки типов АКБ (с бэка или mock).
2. F12 → **Network** → фильтр **Fetch/XHR**:
   - обновили **главную** `/` → **1** запрос `battery_life_types`;
   - открыли **карточку** `/battery/7` → **2** запроса `battery_life_type/7` (страница + крошки).
3. Вход/регистрация — если бэк поднят, логин работает.

---

## Redux DevTools — что такое `catalogFilters` (простыми словами)

### Зачем Redux в лабе 8

В каталоге есть **строка поиска** (фильтр по названию типа АКБ). Значение должно **не пропадать**, когда вы:

1. Ввели текст в поиск  
2. Открыли карточку «Подробнее»  
3. Нажали «Назад» в браузере  

Без Redux фильтр жил бы только в React-состоянии страницы каталога и **сбрасывался** при уходе.  
С Redux он лежит в **общем хранилище (store)** → переживает переходы.

### Где это в коде

| Часть | Файл |
|-------|------|
| Слайс (кусок store) | `src/store/slices/catalogFiltersSlice.ts` |
| Поле фильтра | `catalogFilters.title` — строка поиска |
| Запись в store | `setCatalogTitleFilter("текст")` из `ServicesPage` |
| Чтение | `useAppSelector((s) => s.catalogFilters.title)` |

Схема для защиты:

```
dispatch(setCatalogTitleFilter("Li"))  →  action
         ↓
reducer в catalogFiltersSlice        →  state.catalogFilters.title = "Li"
         ↓
ServicesPage читает title            →  список фильтруется
```

### Как установить Redux DevTools

1. Chrome: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)  
2. Перезапустите `npm run dev`, откройте http://localhost:3000  
3. F12 → вкладка **Redux** (появится после установки расширения)

Если вкладки Redux нет — расширение не стоит или страница не с `localhost:3000`.

### Пошаговая проверка на защите (5 минут)

1. Откройте **Redux** → слева дерево state:
   ```text
   catalogFilters
     title: ""
   user
     ...
   batteryLifeApplication
     ...
   ```
2. На главной в поиске каталога введите, например, `Li` (или `18650`).
3. В Redux смотрите:
   - вкладка **Action** — действие `catalogFilters/setCatalogTitleFilter` с `payload: "Li"`;
   - **State** → `catalogFilters.title` стало `"Li"`.
4. Кликните любую карточку → URL `/battery/...`.
5. В Redux **снова** `catalogFilters.title` всё ещё `"Li"` (не очистилось).
6. Кнопка **Назад** в браузере → каталог → в поле поиска снова `Li`.

Это и есть требование лабы: **менеджер состояний для фильтра услуг**.

### Что говорить преподавателю одной фразой

«Фильтр каталога в Redux Toolkit, слайс `catalogFilters`, поле `title`. При переходе на детальную страницу и назад значение сохраняется, видно в Redux DevTools.»

---

## Сколько запросов в Network — «по две»

| Страница | Сколько `battery_life_*` | Почему |
|----------|-------------------------|--------|
| `/` (каталог) | **1** | Грузит только `ServicesPage` |
| `/battery/:id` (карточка) | **2** | `ServicePage` + `BreadCrumbs` (крошки с названием) |

Три–четыре запроса на каталоге — **баг** (исправлен). Два на карточке — **норма** по вашей договорённости.

Запросы `languages.json` от **jquery** — расширения браузера, не ваш код.

---

## Остальное по лабе 8 (кратко)

```bash
# HTTPS локально
npm run dev:https

# Сборка + GitHub Pages
export VITE_BASE_PATH=/ИМЯ-ВАШЕГО-РЕПО/
npm run deploy:gh-pages

# Tauri (в .env IP Wi‑Fi, не localhost)
# VITE_API_BASE_URL=http://192.168.1.XX:8080/api
npm run tauri:dev
```

Подробнее: [README_LAB8.md](./README_LAB8.md), адаптивность: [LAB8_RESPONSIVE.md](./LAB8_RESPONSIVE.md).

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Пустой каталог, mock | Запустить Docker + `go run ./cmd/server` |
| `go run` падает на PostgreSQL | `docker compose up -d` в папке бэка |
| Нет вкладки Redux | Установить расширение Redux DevTools |
| Фильтр сбрасывается | Проверить, что в store есть `catalogFilters.title` после «Назад» |
| 404 на `/minio/...` с пробелами в имени | Файл в MinIO или mock-картинка; URL кодируется в `batteryApi.ts` |
| CORS / API | В dev запросы идут на `/api` → прокси Vite на `:8080` (см. `.env`) |

---

## Минимальный чеклист «моя хуйня работает»

- [ ] `npm run dev` без ошибок  
- [ ] http://localhost:3000 открывается  
- [ ] Network: 1× список на главной, 2× карточка на `/battery/1`  
- [ ] Redux: `catalogFilters.title` меняется при вводе и остаётся после «Назад»  
- [ ] (опционально) Вход → заявки → тема заявки на `/battery-life/:id`
