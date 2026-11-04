// Free CC0 village artwork adapted for Aurora's dark-fantasy palette.
// Source: Forchild Basic Village Tileset (CC0 1.0).
// Images are pre-darkened offline; all sampling stays nearest-neighbour.
let natureImage = null;
let houseImage = null;
let houseReady = false;
let natureRequested = false;
let natureReady = false;
let natureFailed = false;
function requestNatureImage() {
  if (natureRequested || typeof Image === 'undefined') return;
  natureRequested = true;
  natureImage = new Image();
  natureImage.onload = () => { natureReady = true; };
  natureImage.onerror = () => { natureFailed = true; };
  natureImage.src = new URL('../../assets/aurora/village-pack/Trees_and_bushes-aurora.png', import.meta.url).href;
}
const FRAMES = Object.freeze({
  fence: { sx: 0, sy: 112, sw: 64, sh: 48, dw: 96, dh: 72 },
  oak: { sx: 0, sy: 0, sw: 48, sh: 64, dw: 72, dh: 96 },
  pine: { sx: 96, sy: 0, sw: 48, sh: 64, dw: 72, dh: 96 },
  bush: { sx: 0, sy: 64, sw: 24, sh: 32, dw: 54, dh: 72 },
  hedge: { sx: 48, sy: 64, sw: 24, sh: 32, dw: 78, dh: 52 },
  stump: { sx: 96, sy: 64, sw: 24, sh: 32, dw: 42, dh: 42 }
});
export function drawAuroraVillagePackNature(ctx, x, y, style) {
  const frame = FRAMES[style];
  if (!frame || natureFailed) return false;
  if (!natureRequested) requestNatureImage();
  if (style === 'fence') {
    if (!houseImage && typeof Image !== 'undefined') {
      houseImage = new Image();
      houseImage.onload = () => { houseReady = true; };
      houseImage.onerror = () => { natureFailed = true; };
      houseImage.src = new URL('../../assets/aurora/village-pack/House_tileset-aurora.png', import.meta.url).href;
    }
    if (!houseReady) return false;
  } else if (!natureReady) return false;
  const { sx, sy, sw, sh, dw, dh } = frame;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    if (style === 'fence') {
      ctx.drawImage(houseImage, sx, sy, sw, sh, Math.round(x - dw / 2), Math.round(y - dh + 8), dw, dh);
    } else if (style === 'hedge') {
      for (let i = -1; i <= 1; i++) {
        ctx.drawImage(natureImage, sx, sy, sw, sh,
          Math.round(x - dw / 2 + i * 24), Math.round(y - dh + 7), 28, dh);
      }
    } else {
      ctx.drawImage(natureImage, sx, sy, sw, sh,
        Math.round(x - dw / 2), Math.round(y - dh + 8), dw, dh);
    }
    return true;
  } finally {
    ctx.restore();
  }
}
