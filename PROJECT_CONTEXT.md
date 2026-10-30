# PROJECT_CONTEXT — «Осколки Кристалла Маны»

Карта проекта для последующих задач. Составлена по фактическому чтению файлов и запуску проверок (30.10.2026); README и CHANGELOG сверялись с кодом и местами расходятся с ним.

> ✅ **Статус: приложение снова загружается.** Незавершённый распил `ui/overworld.js` доведён до рабочего состояния: `ui/overworld/render.js` восстановлен из `HEAD`, возвращены автосейв и `GameAPI.invSlotClick`. Проверки: `node --check` (52/52), `check-imports`, `smoke-load` и одноразовый интеграционный прогон (boot → герой → overworld → движение → вкладки → NPC → бой → сохранение) проходят. Подробности — §11 и §14.

## 1. Назначение

Браузерная 2D-RPG с видом сверху (top-down) в тёмном фэнтези. Игрок выбирает класс, путешествует по локациям, сражается в пошаговых боях на карте, собирает три осколка Кристалла Маны, побеждает мини-боссов, открывает эндгейм («Бесконечный Разлом», этажи с эскалацией) и режим NG+.

Продукт — самостоятельная статическая веб-страница без сервера и сборки. Аудитория: браузер, в т.ч. мобильный (есть D-Pad и media queries).

## 2. Стек

| Слой | Технология |
|---|---|
| Язык | JavaScript (ES2022+, ES-модули), HTML5, CSS3 |
| Фреймворки | **нет** (vanilla JS, без React/Vue и без зависимостей) |
| Рендер | HTML + CSS; игровая карта — `<canvas>` 800×500 (Canvas 2D API) |
| Звук | Web Audio API + локальные MP3 (`audio/`) |
| Озвучка пролога | Web Speech API (TTS), fallback с MP3 на TTS |
| Хранение | `localStorage` (сейвы, настройки, флаг пролога) |
| Сборка | **нет**: ни bundler, ни transpiler, ни `package.json` |
| Пакетный менеджер | **нет** (npm/pnpm не используются; Node нужен только для скриптов проверки) |
| CI | GitHub Actions, Node 24 (workflow пока не в git — см. §10) |
| Тесты / lint / types | **отсутствуют** |

Доступное окружение (проверено): Node.js v24.22.1, Python 3.15.0, git CLI отсутствует в `PATH`, но найдена встроенная версия из GitHub Desktop: `%LOCALAPPDATA%\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe`.

## 3. Структура

```
magic-rpg/
├── index.html                 # все экраны (11), inline onclick → window.GameAPI
├── main.js                    # entrypoint: wiring, boot, GameAPI, глобальные ошибки, пролог
├── css/style.css              # весь UI одним файлом (~526 строк, 3 media query, 7 keyframes)
├── audio/                     # village / explore / combat / prologue .mp3 (~14.7 МБ)
├── data/                      # статические данные (10 модулей, без логики)
│   ├── classes.js             # 3 класса, стартовые статы/заклинания/предметы, способности
│   ├── items.js               # 25 предметов + редкости, цены, бонусы
│   ├── spells.js              # 8 заклинаний
│   ├── enemies.js             # 25 врагов (включая боссов)
│   ├── locations.js           # 11 локаций: тема, враги, размеры карты, safe-флаг
│   ├── npcs.js                # 12 NPC + FORGE_BONUS
│   ├── shop.js                # 13 позиций ассортимента
│   ├── achievements.js        # 19 достижений
│   ├── talents.js             # деревья талантов по классам (тиры 5/10/15/20)
│   └── story.js               # тексты/пролог
├── systems/                   # игровая логика (18 модулей)
│   ├── state.js               # единственный синглтон состояния
│   ├── events.js              # event bus: on / off / emit
│   ├── save.js                # localStorage, миграции сейвов v1→v9, настройки v3
│   ├── inventory.js, shop.js, crafting.js, character.js
│   ├── progression.js, stats.js, status.js, talents.js, achievements.js
│   ├── dailyQuests.js, ngplus.js, rift.js, audio.js, voice.js
│   ├── overworld.js           # фасад: enterOverworld/exitOverworld + реэкспорты
│   └── overworld/
│       ├── map.js             # генерация карт, TILE=48, seededRandom
│       ├── ai.js              # камера, движение, updateOverworld(dt)
│       ├── combat.js          # пошаговый бой, дроп, награды (крупнейший модуль, ~609 строк)
│       ├── spawn.js           # враги/сундуки/NPC/статика/события, элитники, модификаторы
│       ├── particles.js, log.js
├── ui/                        # DOM/Canvas-слой (13 модулей)
│   ├── game.js                # ФАСАД: re-export доменных UI-модулей (7 строк)
│   ├── header.js, locations.js, inventory.js, spells.js, quests.js, npcs.js, shop.js
│   ├── menu.js, screens.js, character.js, village.js
│   ├── overworld.js           # оркестратор overworld: ввод, секреты, NPC-панель, pause
│   └── overworld/
│       ├── models.js          # отрисовка спрайтов (~515 строк)
│       ├── combat-panel.js     # под-панели боя (заклинания/предметы/способности)
│       ├── effects.js         # темы, погода, туман, молнии, частицы
│       └── render.js          # canvas-цикл, рендер, HUD, миникарта, pause, автосейв, тултипы
├── scripts/                   # node-проверки (не в git)
│   ├── check-imports.mjs      # резолвинг относительных импортов
│   └── smoke-load.mjs         # 12 smoke-проверок данных и чистой логики
├── .github/workflows/ci.yml   # CI: syntax + imports + smoke (не в git)
├── .nojekyll                  # для GitHub Pages
├── README.md                  # 8 строк: только команда запуска
├── CHANGELOG.md               # v0.1 … v0.10
└── PROJECT_CONTEXT.md         # этот файл
```

Объём: 52 JS-модуля, ≈5.7 тыс. строк JS; `index.html` ~214 строк; `css/style.css` ~526 строк. Самые крупные модули: `systems/overworld/combat.js`, `ui/overworld/render.js`, `ui/overworld/models.js`, `ui/inventory.js`, `ui/menu.js`.

## 4. Ключевые entrypoints

- `index.html` → `<script type="module" src="main.js">` — единственная точка входа. Все кнопки в разметке вызывают `window.GameAPI.*`.
- `main.js`:
  - подписка на события (`toast`, `log`, `game:started`, `overworld:*`, `combat:*`, `victory`);
  - `window.GameAPI` — фасад на ~47 методов для inline-обработчиков (единый «контракт» между HTML и модулями);
  - boot-решение о прологе (`ALWAYS_SHOW_PROLOGUE`, `magic-rpg-prologue-seen`, наличие сейвов);
  - глобальные `error` / `unhandledrejection` → toast;
  - `beforeunload` → `saveGame()`.
- `systems/state.js` — `state = { game, settings, selectedClass, currentTab, overworld }` (мутабельный синглтон, импортируется всеми слоями).
- `systems/events.js` — единственная шина: `on`, `off`, `emit`; ошибки listener'ов ловятся и логируются.
- `ui/game.js` — тонкий фасад над `header/locations/inventory/spells/quests/npcs/shop` (сохранён, чтобы не менять импорты в `main.js`).

## 5. Архитектура и потоки данных

Слои и направление зависимостей:

```
data/*  ←  systems/*  ←  ui/*  ←  main.js
(данные)   (логика)      (DOM/Canvas)   (wiring)
```

`systems/*` не должен трогать DOM (на практике есть исключения: `confirm` в `systems/overworld.js`, `Audio`/`localStorage`); `ui/*` читает `state` и вызывает системы; связь между слоями — через `state` и event bus.

Основные потоки:

1. **Boot:** `main.js` → `migrateLegacySave()` / `loadSettings()` → пролог или главное меню (`showScreen`, `updateMainMenu`).
2. **Новая игра:** выбор класса (`ui/character.js`) → `createCharacter` (`systems/character.js`) → `state.game` → `saveGame()` в слот.
3. **Вход в локацию:** `enterOverworldFromUI` → `enterOverworld(locId, opts)` (`systems/overworld.js`) → генерация карты/спавн → `emit('overworld:start')` → `initOverworld()` → `start()` (rAF).
4. **Игровой цикл:** `requestAnimationFrame` → `updateOverworld(dt)` (`systems/overworld/ai.js`) → движение/ИИ/эффекты → `tick`/`render` (`ui/overworld/render.js`) → canvas.
5. **Бой:** столкновение с врагом → `enterCombat` → пошаговые действия (`combatAttack`, `combatCastSpell`, `combatUseAbility`, `combatUseItem`, `combatBlock`, `combatFlee`) → события `combat:start/end`, `victory`, `rift:*`.
6. **Смерть/победа:** `overworld:defeat` → экран смерти; `victory` → сохранение флага → экран победы → NG+ (`systems/ngplus.js`) или Разлом (`systems/rift.js`).
7. **Сохранение:** `saveGame()` при переходах/выходе и в `beforeunload`; сейв — JSON целиком в `localStorage`, версия схемы 9.

Модель данных сейва: `{ version, location, shards, quests, player: { name, class, level, exp, expNext, hp/mp, статы, inventory[], equipped{weapon,armor}, spells[], talents[], effects[], cooldowns, achievements[], stats{}, dailyQuests{}, buffs[], ngPlus, riftBest, playtimeSec } }`. Ключи: `magic-rpg-save-1..3`, legacy `magic-rpg-save`, `magic-rpg-settings`, `magic-rpg-prologue-seen`.

## 6. Внешние зависимости

- БД, backend, API, очереди, внешние сервисы — **нет**. Сетевых вызовов (`fetch`, XHR, WebSocket, EventSource) в коде **нет** — проверено поиском.
- Сторонние CDN, шрифты, аналитика — **нет**.
- Нативные браузерные API: Canvas 2D, Web Audio API, Web Speech API (`speechSynthesis`), `localStorage`, `requestAnimationFrame`, `matchMedia`.
- Ассеты: 4 MP3 в `audio/` (~14.7 МБ суммарно) — основной вес проекта.
- Переменные окружения и секреты не используются; `.env`-файлов в репозитории нет.

## 7. Команды

Запуск (единственный поддерживаемый способ — статическая раздача, файл `file://` не подойдёт из-за ES-модулей и CORS):

```bash
python -m http.server 8000     # из корня репозитория
# открыть http://localhost:8000
```

Проверки (то же, что делает CI):

```bash
node --check <file.js>              # синтаксис; CI прогоняет по всем *.js
node scripts/check-imports.mjs      # что все относительные импорты резолвятся
node scripts/smoke-load.mjs         # 12 smoke-проверок данных и чистой логики
```

Чего нет: `install`, `build`, `dev`-скриптов, `test`, `lint`, `typecheck`, `format`. Нет `package.json` и lock-файлов, поэтому `npm install` неприменим.

CI (`.github/workflows/ci.yml`, job `verify`, ubuntu-latest + Node 24): те же три шага (`find … node --check`, `check-imports`, `smoke-load`). Workflow лежит в рабочей копии, но **не закоммичен**, поэтому на GitHub ещё не действует.

Ручная проверка: `python -m http.server 8000` → создать героя → войти в локацию → бой. Автоматического браузерного прогона в репозитории нет (в окружении аудита браузер отсутствовал; проверка делалась интеграционным harness в Node с DOM-заглушкой).

## 8. Тесты и покрытие

- Автотестов игры нет: ни `tests/`, ни `*.test.js`, ни test-runner'а.
- `scripts/smoke-load.mjs` — 12 проверок: загрузка 10 модулей данных + `state/events/progression/status/stats`, `addExp`, `getEffStats`, `applyEffect`. Покрытие — только «модули импортируются, данные непустые».
- `scripts/check-imports.mjs` проверяет **только существование файлов** по относительным путям, но не именованные экспорты (поэтому разрывы вида «импортируется несуществующий `startAutosave`» им не ловятся).
- Не покрыто: бой, ИИ, генерация карт, сейвы/миграции, экономика, прогрессия, UI, canvas-рендер. Качественная оценка: покрыта малая доля (<5 %) игровой логики; регрессии ловятся только вручную в браузере.
- Отдельный аудит данных (разово, вне репозитория) нарушений не нашёл: все `startingSpells/startingItems`, `locations.enemies`, `shop`, ссылки предметов на заклинания валидны, дублей id нет.
- После починки выполнялся одноразовый интеграционный прогон (Node + DOM/Canvas/Audio-заглушки, вне репозитория): boot `main.js`, создание героя, вход в деревню, движение WASD, все вкладки дашборда, NPC-диалоги, бой в лесу до победы, сохранение в слот 1 — без исключений. В репозиторий harness не добавлен.

## 9. Соглашения

- **Модули:** ES-модули, только именованные экспорты (`export function`, `export const`), default-экспортов нет. Относительные пути с явным `.js`.
- **Стиль:** 2 пробела, одинарные кавычки, точки с запятой, `const`/`let`, ранние `return`, короткие функции. Строгого линтера нет, стиль поддерживается вручную.
- **Нейминг:** функции/переменные — `camelCase`; константы и объекты данных — `UPPER_SNAKE` (`CLASSES`, `ITEMS`, `TILE`); id в данных — `kebab-case` (`health-potion`, `ice-bolt`); DOM-id — `kebab-case` (`screen-game`, `combat-panel`); UI-действия overworld — префикс `ow` (`owAttack`, `owCast`).
- **Структура:** `data/` — только данные; `systems/` — логика; `ui/` — рендер и DOM; `main.js` — склейка. Новые экраны/вкладки принято выносить в отдельный `ui/*.js` и реэкспортировать через фасад `ui/game.js`.
- **Связь с HTML:** только через `window.GameAPI.<method>`; обработчики в разметке — inline `onclick`.
- **Ошибки:** глобальные `window.onerror`/`unhandledrejection` в `main.js` → красный toast; `emit` изолирует падения listener'ов; деструктивные действия подтверждаются `confirm()`.
- **Логирование:** `console.log/warn/error` с тегом в квадратных скобках (`[boot]`, `[events]`, `[prologue]`, `[global error]`, `[secrets]`); игровые сообщения — через `emit('log', { channel, msg, cls })` и `emit('toast', msg)`, а не напрямую в DOM.
- **Сохранения:** обратная совместимость через `migrateGame` (version 1→9) и `migrateSettings` (version 3); при добавлении полей в сейв — новая ветка миграции и инкремент `SAVE_VERSION`.
- **CSS:** один файл, плоские семантические классы (`.dashboard-*`, `.mm-btn`, `.settings-*`), без CSS-модулей и препроцессоров; тёмная палитра с золотым акцентом `#c9a227`.
- **Язык:** интерфейс, комментарии, логи и коммиты — русские.

## 10. Состояние репозитория (git)

- Ветка `main`, remote `origin` = `https://github.com/igor74r/magic-rpg.git`.
- `HEAD` — коммит документации; перед ним `8bcb534` (рефакторинг UI + починка) и `e74416d` (CI/скрипты), базовый — `60e3ff8` «патч».
- Рабочее дерево чистое. Локальный `main` впереди `origin/main` на 3 коммита: **push не выполнен**, у git в этом окружении нет учётных данных GitHub (`SEC_E_NO_CREDENTIALS`).
- Хронология: 13:16 — `HEAD`; 14:26–14:53 — скрипты, CI, распил `ui/overworld.js`; 15:15–15:26 — распил `ui/game.js`; 15:39 — неудачное слияние `effects.js`/`render.js` (проект перестал грузиться); 16:20 — `render.js` восстановлен из `HEAD`, импорты и `invSlotClick` починены; ~17:00 — три коммита.
- `core.autocrlf=true`: git предупреждает, что LF в рабочей копии будет заменён на CRLF при следующем касании.
- `.gitignore` отсутствует — риск случайно закоммитить артефакты.
- Stash пуст.

## 11. Известные риски и пробелы

1. **CI ещё не запускался:** workflow закоммичен (`e74416d`), но `origin/main` не обновлён — Actions включатся после push. Локально все три шага проходят.
2. **Нет тестовой инфраструктуры и линтера.** Нет `package.json`, версии инструментов не зафиксированы; проверки запускаются вручную. `check-imports` теперь валидирует и именованные экспорты, но не стиль/типы.
3. **Расхождение версий:** в `index.html` — `v0.12`, `CHANGELOG.md` заканчивается `v0.10`; `README.md` (8 строк) не описывает ни архитектуру, ни проверки, ни CI.
4. **Крупные модули и связанность:** `ui/overworld/render.js` (~800 строк после восстановления), `systems/overworld/combat.js` (~609 строк — расчёты, дроп, награды, достижения, звук), `ui/overworld/models.js` (~515 строк); правки в них рискованны без тестов.
5. **Мёртвый/избыточный код после распила:** `ui/overworld.js` импортирует неиспользуемый `getEffStats`; `ui/menu.js` дважды импортирует `systems/save.js` (валидно, но избыточно); `EFFECTS_DATA`/`MODIFIERS_LABEL` из `models.js` нужны только `combat-panel.js`.
6. **Побочные эффекты в «логике»:** `confirm()` внутри `systems/overworld.js`, обращение к `localStorage`/`Audio` из системных модулей — мешает тестируемости и переиспользованию.
7. **XSS/ломающая разметка:** 38 присваиваний `innerHTML` с интерполяцией данных; имя героя берётся из `<input>` и попадает в разметку без экранирования (риск при спецсимволах; внешнего ввода в проекте нет, поэтому риск ограничен).
8. **Нет `.gitignore`**, нет фиксации версии Node (в CI — 24, локально — 24.22.1).
9. **Звук:** 14.7 МБ MP3 грузятся статически; автовоспроизведение ограничено политикой браузера (разблокировка по первому клику реализована в `main.js`).
10. **Автосейв-интервал не сбрасывается при выходе** из overworld: `setInterval` живёт до перезагрузки страницы (дублей не будет из-за гварда `autosaveTimer`), это поведение унаследовано из `HEAD`.
11. **Ручная проверка в браузере не выполнена** (браузера в окружении нет): canvas-отрисовка проверена только на отсутствие исключений через DOM-заглушку.

## 12. Что пока неясно

- Кто и когда делает push в `origin/main` (CI включится после первого push) и как публикуется GitHub Pages?
- Целевые браузеры и приоритет мобильной версии (D-Pad и 3 breakpoint'а есть, но тестировались ли на реальных устройствах?).
- Нужен ли интеграционный harness в репозитории (сейчас он одноразовый, вне git) — или ограничиться `smoke-load` + ручным прогоном?
- Какой инструментарий тестов допустим: встроенный `node:test` без зависимостей, Playwright для DOM/canvas, или пока только smoke-скрипты?
- Нужен ли `package.json` (только для `scripts`/devDependencies) или проект должен остаться полностью без npm?
- Правила коммитов: сообщения по-русски («патч», «рефакторинг»), нужен ли более строгий формат?

## 13. Правила безопасной работы с этим репозиторием

- Не делать `git reset --hard`/`git clean -fd` без необходимости: локальные коммиты ещё не отправлены в `origin`.
- Перед правками в `ui/overworld/*` сверяться с историей: `render.js` восстановлен из `60e3ff8:ui/overworld.js`.
- Минимальные проверки после любой правки: `node --check` по изменённым файлам, `node scripts/check-imports.mjs`, `node scripts/smoke-load.mjs`, затем ручной прогон в браузере через `python -m http.server`.
- Не коммитить `audio/*.mp3` повторно и не добавлять секреты; `.env` в проекте нет и не требуется.

## 14. История изменений (30.10.2026, починка после распила)

Что было сделано:

- `ui/overworld/render.js` восстановлен из `HEAD` (монолитный `ui/overworld.js`) и адаптирован под новый `effects.js`: импортируются `VIEW_W/VIEW_H/getTheme/MOD_LABEL` и погодные функции; `lightning.flash` заменён на `getLightningFlash()`; `updateFireflies(dt, worldTime)` и `drawFireflies(ctx, worldTime)` приведены к сигнатурам `effects.js`; наружу экспортированы `renderNpcPanel`, `onCanvasMouseMove`, `hideMapTooltip`, `openPauseMenu`, `closePauseMenu`, `startAutosave`; в `initWeather` возвращён сброс визуального состояния (следы, кровь, трупы, тайлы).
- `ui/overworld/effects.js`: добавлен `getLightningFlash()`.
- `ui/overworld.js`: импортируется `isPaused` и `onCanvasMouseMove` (были потеряны при распиле), локальный дубль тултипа удалён (переехал в `render.js`), `MOD_LABEL` больше не нужен.
- `main.js`: `GameAPI.invSlotClick` подключён (импорт + фасад) — клики по слотам инвентаря снова работают.
- Временный дамп `HEAD` (`.head-overworld.tmp.js`) использовался только локально и удалён.
- `scripts/check-imports.mjs` дополнен проверкой именованных экспортов (на временном пробном файле проверено, что ловит и `UNRESOLVED MODULE`, и `MISSING EXPORT`).

Зафиксировано тремя коммитами: `e74416d` — CI и скрипты, `8bcb534` — рефакторинг UI и починка, третий — эта документация. Push в `origin` не выполнялся (нет credentials).

Проверено: `node --check` — 52/52, `node scripts/check-imports.mjs` — OK, `node scripts/smoke-load.mjs` — 12/12 PASS, интеграционный прогон (boot → герой → деревня → WASD → все вкладки → NPC → бой в лесу → победа → сохранение в слот 1) без исключений.

Не проверено: реальный браузер и canvas, мобильный D-Pad, звук/озвучка.
