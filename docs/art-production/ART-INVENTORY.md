# Арт-инвентаризация — Shards of the Rift

Ветка: `art-production/16bit-visual-refresh`  
База: `main`  
Снимок размеров: Git tree текущей `main`. Размеры указаны в байтах.  
Назначение — по имени/содержимому и проверенным импортам. «Используется» перечисляет подтверждённые точки подключения; отсутствие прямой ссылки не означает, что ресурс не загружается динамически.

## Сводка

| Каталог | Файлов | Байты |
|---|---:|---:|
| assets/ | 9 | 121529 |
| css/ | 6 | 271954 |
| data/ | 12 | 142509 |
| ui/ | 23 | 345217 |
| **Итого** | **50** | **881209** |

## assets/

| Файл | Размер | Назначение | Используется в |
|---|---:|---|---|
| assets/aurora/ground-atlas.png | 4411 | 8 тайлов земли Aurora, grass/path | ui/overworld/tile-atlas.js |
| assets/aurora/village-props-atlas.png | 3906 | 16 кадров декораций деревни | ui/overworld/sprites.js |
| assets/aurora/world-portal.png | 660 | Портал мира 64×64 | Overworld/Aurora; загрузку сверять в renderer |
| assets/branding/mana-crystal.png | 1768 | Иконка бренда | index.html favicon |
| assets/tiles/README.md | 1247 | Документация атласов | Разработчики |
| assets/tiles/manifest.json | 2385 | Размеры, сетки, биомные строки | ui/overworld/tile-atlas.js / atlas configuration |
| assets/tiles/terrain/atlas.png | 46442 | 5 столбцов × 8 строк, 96px | ui/overworld/tile-atlas.js |
| assets/tiles/dungeons/atlas.png | 15367 | 10×4, тайл 48px | Dungeon/terrain rendering |
| assets/tiles/props/atlas.png | 45343 | 8×4, тайл 96px | ui/overworld/tile-atlas.js / props rendering |

### Зафиксированные геометрические контракты

| Ресурс | Размер | Сетка |
|---|---:|---|
| terrain/atlas.png | 480×768 | 5×8, ячейка 96×96 |
| dungeons/atlas.png | 480×192 | 10×4, ячейка 48×48 |
| props/atlas.png | 768×384 | 8×4, ячейка 96×96 |
| aurora/ground-atlas.png | 768×96 | 8×1, ячейка 96×96 |
| aurora/village-props-atlas.png | 1024×64 | 16×1, кадр 64×64 |
| aurora/world-portal.png | 64×64 | 1 спрайт |

Terrain columns: grass, path, biome-object, liquid, rock.  
Terrain rows: village, forest, ruins, shadow, swamp, volcano, ice, desert.  
Пять сюжетных биомов для первичного художественного прохода: forest, ruins, shadow, swamp, volcano. Ice/desert и дополнительные theme IDs сохраняются и не удаляются.

## css/

| Файл | Размер | Назначение | Используется в |
|---|---:|---|---|
| css/style.css | 53999 | Базовые стили и layout | index.html, все экраны |
| css/theme.css | 16111 | Тема и цветовые токены | index.html, все экраны |
| css/rpg-overhaul.css | 86016 | RPG UI, HUD, панели | index.html; ui/header.js обновляет stylesheet |
| css/2d-art-direction.css | 23093 | Правила визуального оформления | index.html |
| css/dashboard-refresh.css | 44734 | Dashboard | index.html |
| css/experience-refresh.css | 48001 | Меню и игровые экраны | index.html |

Проверка шести CSS-файлов: 0 вхождений CSS `url()` в текущем срезе.

## data/

| Файл | Размер | Назначение | Подтверждённые потребители |
|---|---:|---|---|
| data/achievements.js | 5283 | Достижения | ui/menu.js, ui/quests.js |
| data/chronicles.js | 8786 | Хроники | ui/chronicles.js |
| data/classes.js | 6193 | Классы | ui/character.js, ui/header.js, ui/inventory.js, ui/menu.js |
| data/enemies.js | 19978 | Противники | ui/quests.js, ui/menu.js, overworld models/render |
| data/items.js | 25421 | Предметы и редкости | ui/inventory.js, ui/npcs.js, ui/shop.js, ui/village.js |
| data/locations.js | 14332 | Локации, биомы и карты | ui/header.js, ui/menu.js, ui/dashboard.js, overworld renderer |
| data/npcs.js | 6618 | NPC и бонусы услуг | ui/npcs.js, ui/inventory.js |
| data/passives.js | 15740 | Пассивные умения | ui/passives.js |
| data/shop.js | 962 | Ассортимент магазина | ui/shop.js |
| data/spells.js | 2452 | Заклинания | ui/spells.js, ui/inventory.js |
| data/story.js | 31062 | Сюжет и миссии | ui/quests.js, ui/dashboard.js, ui/npcs.js |
| data/talents.js | 5682 | Таланты | Модули талантов; точку импорта сверять перед изменениями |

Данные в `data/` не редактировать в рамках арт-прохода: ID, ключи, порядок миссий и тексты являются игровыми контрактами.

## ui/

| Файл | Размер | Назначение | Сцена/потребитель |
|---|---:|---|---|
| ui/character.js | 7440 | Выбор и создание героя | Экран выбора класса |
| ui/chronicles.js | 1958 | Хроники | Экран хроник |
| ui/dashboard.js | 8229 | Dashboard | Меню/главный экран |
| ui/game.js | 1239 | Обвязка игрового экрана | Игровой экран |
| ui/header.js | 20403 | HUD и верхняя панель | HUD |
| ui/inventory.js | 43115 | Инвентарь и экипировка | Инвентарь |
| ui/menu.js | 28673 | Главное меню и достижения | Меню |
| ui/npcs.js | 29233 | NPC, торговля, кузница, диалоги | Aurora / сервисные окна |
| ui/overworld.js | 17651 | Вход и управление overworld | Мир |
| ui/overworld/aurora-art.js | 12880 | Пиксельная архитектура | Aurora |
| ui/overworld/combat-panel.js | 12359 | Боевая панель | Бой |
| ui/overworld/depth-order.js | 1137 | Depth sorting | Overworld |
| ui/overworld/effects.js | 15270 | Частицы и визуальные эффекты | Мир/бой |
| ui/overworld/models.js | 2067 | Модели и адаптеры | Overworld |
| ui/overworld/render.js | 54569 | Canvas 2D renderer | Все биомы |
| ui/overworld/sprites.js | 29530 | Герои, NPC, существа и пропсы | Overworld |
| ui/overworld/tile-atlas.js | 12578 | Загрузка/отрисовка атласов | Биомы/Aurora |
| ui/passives.js | 11510 | Интерфейс пассивных умений | Дерево талантов |
| ui/quests.js | 24419 | Сюжетные и ежедневные задания | Доска заданий |
| ui/screens.js | 968 | Общие операции экранов | Все экраны |
| ui/shop.js | 5649 | Магазин | Торговля |
| ui/spells.js | 2114 | Заклинания | Панель магии |
| ui/village.js | 2226 | Деревня | Aurora |

## Критические ограничения

- Не переименовывать и не перемещать файлы в assets/, audio/, css/, ui/.
- Не менять размеры, сетку, padding, UV-порядок и привязки атласов.
- PNG сохранять с полноценным alpha и декодируемыми IDAT.
- Не изменять systems/, scripts/, main.js, data/, сюжетные тексты, TTS и DOM-контракт доски заданий.
- Не менять item IDs и class IDs.
- Не удалять test-artifacts/visual-review; добавлять новые скриншоты.
- Бюджет суммарного веса assets/: не более +15% от базовых 121529 байт, если не утверждено иное.
- Визуальные изменения проверять после каждого блока тестами проекта.
