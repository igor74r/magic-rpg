# 2D Tile Assets

Оригинальные SVG-атласы, созданные для «Осколков Кристалла Маны». Не требуют CDN, внешних запросов или сторонних библиотек.

- `terrain/atlas.svg`: 5 столбцов × 8 биомов; исходные тайлы 96×96, отображаются в игровом мире как 48×48.
- `props/atlas.svg`: 8×4 тематических набора; исходные спрайты 96×96, отображаются как 48×48. Содержит сундуки, кристаллы, алтари, фонари, мосты, порталы, кости и грибы.
- `dungeons/atlas.svg`: декоративный набор полов, стен, дверей, трещин и магических печатей (48×48).
- `manifest.json`: размеры исходных тайлов, размеры отображения, порядок столбцов и индексы биомов.

`ui/overworld/tile-atlas.js` загружает атласы лениво и масштабирует высокодетальные SVG до размера игровой сетки. Пока изображения не загружены или если браузер не может отрисовать SVG, Canvas-рендер использует процедурные тайлы как fallback. Все ресурсы локальные: без CDN, внешних запросов и сторонних библиотек.


## Surface finish update (2026-11-01)

- The active terrain atlas keeps its original 480×768 size, 5×8 layout, 96px source tiles and 48px in-game display size. Eight restrained, biome-specific grain overlays distinguish village soil, forest growth, worn ruins, shadow haze, swamp moisture, volcanic fissures, frost scratches and desert ripples.
- The active props atlas keeps its original 768×384 size and 8×4 layout. All 32 cells receive a subtle wear grain and inset edge finish without changing source coordinates.
- The dungeon atlas remains 480×192 (10×4, 48px cells). It is still an authored asset only: no runtime renderer currently samples it, so it is not yet visible in gameplay. Its integration requires a separate mapping pass rather than guessing how dungeon cells should replace existing map tiles.
- Original SVG tile geometry and manifest coordinates are preserved.
