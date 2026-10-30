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


## Технологии

Canvas 2D, Web Audio API, Web Speech API, `localStorage` (3 слота сохранений, миграции схемы v1→v9),
GitHub Actions, GitHub Pages.

## Лицензия

Не указана.
