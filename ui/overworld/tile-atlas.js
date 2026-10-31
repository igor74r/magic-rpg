const TILE_SIZE = 48;
const BIOME_ROW = Object.freeze({
  village: 0, forest: 1, ruins: 2, shadow: 3,
  swamp: 4, graveyard: 3, volcano: 5, dragon: 5,
  ice: 6, 'ice-peaks': 6, desert: 7, wasteland: 7, 'dragon-lair': 5, library: 2,
  'briar-hollow': 1, 'sunken-necropolis': 2, 'obsidian-fields': 5,
  'frost-citadel': 6, 'void-crater': 3
});

let atlasImage = null;
let atlasRequested = false;
let atlasReady = false;
let atlasFailed = false;

function requestAtlas() {
  if (atlasRequested || typeof Image === 'undefined') return;
  atlasRequested = true;
  try {
    atlasImage = new Image();
    atlasImage.onload = () => { atlasReady = true; };
    atlasImage.onerror = () => { atlasFailed = true; atlasImage = null; };
    atlasImage.src = new URL('../../assets/tiles/terrain/atlas.svg', import.meta.url).href;
  } catch (error) {
    atlasFailed = true;
    atlasImage = null;
  }
}

/** Draws an atlas tile; returns false until loaded or when Canvas cannot draw it. */
export function drawAtlasTile(ctx, type, x, y, size, themeName) {
  if (!Number.isInteger(type) || type < 0 || type > 4) return false;
  const row = BIOME_ROW[themeName];
  if (!Number.isInteger(row) || atlasFailed) return false;
  if (!atlasRequested) requestAtlas();
  if (!atlasReady || !atlasImage) return false;
  try {
    ctx.drawImage(atlasImage, type * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE, x, y, size, size);
    return true;
  } catch (error) {
    atlasFailed = true;
    return false;
  }
}


let propsImage = null;
let propsRequested = false;
let propsReady = false;
let propsFailed = false;

function requestPropsAtlas() {
  if (propsRequested || typeof Image === 'undefined') return;
  propsRequested = true;

  try {
    propsImage = new Image();
    propsImage.onload = () => { propsReady = true; };
    propsImage.onerror = () => { propsFailed = true; propsImage = null; };
    propsImage.src = new URL('../../assets/tiles/props/atlas.svg', import.meta.url).href;
  } catch (error) {
    propsFailed = true;
    propsImage = null;
  }
}

/** Draws one of the 32 environment props (8 columns × 4 rows). */
export function drawAtlasProp(ctx, index, x, y, width = TILE_SIZE, height = TILE_SIZE) {
  if (!Number.isInteger(index) || index < 0 || index >= 32 || propsFailed) return false;
  if (!propsRequested) requestPropsAtlas();
  if (!propsReady || !propsImage) return false;

  const col = index % 8;
  const row = Math.floor(index / 8);

  try {
    ctx.drawImage(
      propsImage,
      col * TILE_SIZE,
      row * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
      x,
      y,
      width,
      height
    );
    return true;
  } catch (error) {
    propsFailed = true;
    return false;
  }
}
