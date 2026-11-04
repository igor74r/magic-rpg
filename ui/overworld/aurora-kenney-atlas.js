// Local Kenney Tiny Town sprite atlas for Aurora only.
// Source: Kenney Tiny Town 1.1, CC0-1.0. See the adjacent license file.
const COLUMNS = 12;
const ROWS = 11;
const TILE_SIZE = 16;
const STRIDE = 17; // 16px tile + 1px atlas spacing.

let atlasImage = null;

function getAtlas() {
  if (atlasImage || typeof Image === 'undefined') return atlasImage;
  atlasImage = new Image();
  atlasImage.src = new URL('../../assets/aurora/kenney-tiny-town-atlas.png', import.meta.url).href;
  return atlasImage;
}

export const AURORA_KENNEY_NATURE_TILE = Object.freeze({
  flowerbed: 2,
  pine: 4,
  oak: 5,
  bush: 6
});

export function drawAuroraKenneyTile(ctx, tileIndex, x, y, displaySize = 48) {
  if (!Number.isInteger(tileIndex) || tileIndex < 0 || tileIndex >= COLUMNS * ROWS) return false;
  const atlas = getAtlas();
  if (!atlas || !atlas.complete || !atlas.naturalWidth) return false;

  const sourceX = (tileIndex % COLUMNS) * STRIDE;
  const sourceY = Math.floor(tileIndex / COLUMNS) * STRIDE;
  const size = Math.max(TILE_SIZE, Math.round(displaySize));
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      atlas,
      sourceX, sourceY, TILE_SIZE, TILE_SIZE,
      Math.round(x - size / 2), Math.round(y - size + 8), size, size
    );
  } finally {
    ctx.restore();
  }
  return true;
}
