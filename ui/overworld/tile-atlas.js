const TILE_SIZE = 96;
const BIOME_ROW = Object.freeze({
  village: 0, forest: 1, ruins: 2, shadow: 3,
  swamp: 4, graveyard: 3, volcano: 5, dragon: 5,
  ice: 6, 'ice-peaks': 6, desert: 7, wasteland: 7, 'dragon-lair': 5, library: 2,
  'briar-hollow': 1, 'sunken-necropolis': 2, 'obsidian-fields': 5,
  'frost-citadel': 6, 'void-crater': 3
});


let auroraGroundImage = null;
let auroraGroundRequested = false;
let auroraGroundReady = false;
let auroraGroundFailed = false;

function requestAuroraGroundAtlas() {
  if (auroraGroundRequested || typeof Image === 'undefined') return;
  auroraGroundRequested = true;
  try {
    auroraGroundImage = new Image();
    auroraGroundImage.onload = () => { auroraGroundReady = true; };
    auroraGroundImage.onerror = () => { auroraGroundFailed = true; auroraGroundImage = null; };
    auroraGroundImage.src = new URL('../../assets/aurora/ground-atlas.png', import.meta.url).href;
  } catch (error) {
    auroraGroundFailed = true;
    auroraGroundImage = null;
  }
}

/** Draws authored Aurora grass (0) or cobblestone path (1) pixel tiles. */
export function drawAuroraGroundTile(ctx, type, x, y, size) {
  if ((type !== 0 && type !== 1) || auroraGroundFailed) return false;
  if (!auroraGroundRequested) requestAuroraGroundAtlas();
  if (!auroraGroundReady || !auroraGroundImage) return false;
  const previousSmoothing = ctx.imageSmoothingEnabled;
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(auroraGroundImage, type * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, x, y, size, size);
    return true;
  } catch (error) {
    auroraGroundFailed = true;
    return false;
  } finally {
    ctx.imageSmoothingEnabled = previousSmoothing;
  }
}

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
    atlasImage.src = new URL('../../assets/tiles/terrain/atlas.png', import.meta.url).href;
  } catch (error) {
    atlasFailed = true;
    atlasImage = null;
  }
}

/** Draws a 96px source tile downsampled to the game's 48px world grid. */
export function drawAtlasTile(ctx, type, x, y, size, themeName) {
  if (!Number.isInteger(type) || type < 0 || type > 4) return false;
  const row = BIOME_ROW[themeName];
  if (!Number.isInteger(row) || atlasFailed) return false;
  if (!atlasRequested) requestAtlas();
  if (!atlasReady || !atlasImage) return false;
  try {
    // Smoothing is configured once by the renderer for the whole terrain pass.
    // Avoid save/restore and state changes for every single tile.
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
    propsImage.src = new URL('../../assets/tiles/props/atlas.png', import.meta.url).href;
  } catch (error) {
    propsFailed = true;
    propsImage = null;
  }
}

/** Draws one of the 32 environment props (8 columns Г— 4 rows). */
export function drawAtlasProp(ctx, index, x, y, width = 48, height = 48) {
  if (!Number.isInteger(index) || index < 0 || index >= 32 || propsFailed) return false;
  if (!propsRequested) requestPropsAtlas();
  if (!propsReady || !propsImage) return false;
  const col = index % 8;
  const row = Math.floor(index / 8);
  try {
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    
    ctx.drawImage(propsImage, col * 96, row * 96, 96, 96, x, y, width, height);
    ctx.imageSmoothingEnabled = previousSmoothing;
    return true;
  } catch (error) {
    propsFailed = true;
    return false;
  }
}

