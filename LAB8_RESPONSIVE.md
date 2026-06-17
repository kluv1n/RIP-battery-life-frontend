# Лаб. 8 — адаптивность (конкретные значения для защиты)

Файл стилей: `src/lab-index-style.css` (и `src/pages/*/…css`).

## Сетка карточек каталога (`.container`)

| Ширина окна | Колонок | Строка CSS |
|-------------|---------|------------|
| **> 992px** | **3** | `.container { grid-template-columns: repeat(3, 1fr); gap: 32px; }` (`src/lab-index-style.css`, ~374) |
| **≤ 992px** | **2** | `@media (max-width: 992px)` |
| **≤ 640px** | **1** | `@media (max-width: 640px)` |

Компонент: `ServicesList` → `<div className="container">`.

## Карточка каталога (`a.card`)

| Свойство | Значение | Файл |
|----------|----------|------|
| Разметка (как в шаблоне) | `ServiceCard.tsx` → `<Link className="card">` — вся карточка одна ссылка | |
| Карточка | `a.card` — `min-height: 460px`, `border-radius: 16px`, шахматка odd/even через `--neter-card-bg` / `--neter-white` | `src/components/ServiceCard/ServiceCard.css` |
| Фото | `.card__photo` — `height: 300px`, на всю ширину | там же |

## Страница типа АКБ (`.detail-card--split`)

| Ширина | Колонок в карточке |
|--------|-------------------|
| **> 640px** | 2 (медиа + текст) |
| **≤ 640px** | 1 (столбец) |

## Страница заявки (`.battery-life-items-table__head`)

| Режим | Колонок в строке позиции |
|-------|-------------------------|
| **> 900px** | 7 (+ «Действия» в черновике) |
| **≤ 900px** | 2 (мобильная раскладка с подписями через `::before`) |

## Navbar

| Ширина | Поведение |
|--------|-----------|
| **≥ 992px** | Горизонтальное меню (`BatteryAppHeader.css`) |
| **< 992px** | Bootstrap collapse (бургер) |

## Toolbar каталога

| Ширина | Поведение |
|--------|-----------|
| **≤ 768px** | Колонка, корзина не `position: absolute` |
