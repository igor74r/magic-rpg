const ASSET_ROOT = new URL('../../assets/aurora/', import.meta.url);
const images = new Map();
function imageFor(name) {
  let image = images.get(name);
  if (image) return image;
  image = new Image();
  image.decoding = 'async';
  image.src = new URL(name + '.svg', ASSET_ROOT).href;
  images.set(name, image);
  return image;
}
export function drawAuroraGround(ctx, cameraX, cameraY, worldWidth, worldHeight) {
  const image = imageFor('ground');
  if (image.complete && image.naturalWidth) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, -cameraX, -cameraY, worldWidth, worldHeight);
    ctx.restore();
  } else {
    image.onload = () => {};
    ctx.fillStyle = '#526f4b';
    ctx.fillRect(-cameraX, -cameraY, worldWidth, worldHeight);
  }
}
export function drawAuroraBuilding(ctx, x, y, style = 'home') {
  const image = imageFor('building-' + (['hall','forge','healer','alchemy','market','tavern','home'].includes(style) ? style : 'home'));
  if (!image.complete || !image.naturalWidth) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.shadowColor = 'rgba(20,28,20,.3)';
  ctx.shadowBlur = 9;
  ctx.drawImage(image, x - 140, y - 220, 280, 240);
  ctx.restore();
  return true;
}
