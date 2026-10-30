# Осколки Кристалла Маны

[![CI](https://github.com/igor74r/magic-rpg/actions/workflows/ci.yml/badge.svg)](https://github.com/igor74r/magic-rpg/actions/workflows/ci.yml)
[🎮 Играть](https://igor74r.github.io/magic-rpg/)

Браузерная 2D-RPG с видом сверху: тёмное фэнтези, магия, три осколка древнего Кристалла.
Чистый JavaScript на ES-модулях — без фреймворков, сборки и зависимостей.

## Запуск

```bash
python -m http.server 8000
# открыть http://localhost:8000
```

Только через HTTP: ES-модули не работают при открытии `index.html` как `file://`.

## Проверки

```bash
node --check <file.js>              # синтаксис (CI прогоняет по всем *.js)
node scripts/check-imports.mjs      # модули резолвятся + именованные экспорты существуют
node scripts/check-gameapi.mjs      # все GameAPI.* из разметки есть в фасаде main.js
node scripts/smoke-load.mjs         # данные и чистая логика (12 проверок)
node scripts/smoke-boot.mjs         # boot main.js, overworld, бой (12 проверок)
```

`smoke-boot` поднимает приложение в Node с заглушками DOM/Canvas/Audio: создаёт героя, входит
в деревню, двигается, переключает вкладки, открывает NPC, проводит бой и сохраняется.
Это ловит ошибки, которые не видны при `node --check` (потерянные экспорты, `ReferenceError`).

Всё перечисленное запускает CI на Node 24 (`.github/workflows/ci.yml`).

## Структура

```
index.html          все экраны, inline onclick → window.GameAPI
main.js             entrypoint: wiring, boot, GameAPI, глобальные ошибки
css/                style.css (каркас) + theme.css (палитра «Витраж»)
data/               классы, предметы, заклинания, враги, локации, NPC, таланты, достижения
systems/            игровая логика (state, save, бой, прогрессия, overworld-подсистемы)
ui/                 DOM/Canvas-слой; ui/game.js — фасад, ui/overworld/ — спрайты, рендер и эффекты
audio/              музыка и звуки (MP3)
scripts/            проверки для CI
```

Подробная карта, соглашения и риски — в [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), история версий — в [CHANGELOG.md](CHANGELOG.md).

## Технологии

Canvas 2D, Web Audio API, Web Speech API, `localStorage` (3 слота сохранений, миграции схемы v1→v9),
GitHub Actions, GitHub Pages.

## Лицензия

Не указана.
