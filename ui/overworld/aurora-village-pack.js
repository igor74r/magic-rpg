// Free CC0 village artwork adapted for Aurora's dark-fantasy palette.
// Source: Forchild Basic Village Tileset (CC0 1.0).
// Images are pre-darkened offline; all sampling stays nearest-neighbour.
let natureImage = null;
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
  oak: { sx: 0, sy: 0, sw: 48, sh: 64, dw: 72, dh: 96 },
  pine: { sx: 96, sy: 0, sw: 48, sh: 64, dw: 72, dh: 96 },
  bush: { sx: 0, sy: 64, sw: 24, sh: 32, dw: 68, dh: 60 }
});
export function drawAuroraVillagePackNature(ctx, x, y, style) {
  const frame = FRAMES[style];
  if (!frame || natureFailed) return false;
  if (!natureRequested) requestNatureImage();
  if (!natureReady) return false;
  const { sx, sy, sw, sh, dw, dh } = frame;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(natureImage, sx, sy, sw, sh,
      Math.round(x - dw / 2), Math.round(y - dh + 8), dw, dh);
    return true;
  } finally {
    ctx.restore();
  }
}