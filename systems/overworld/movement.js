// Frame-rate independent overworld movement helpers.
// deltaFrames is measured in 60 FPS frames (the render loop's normalized dt).
export function getMovementDelta(dx, dy, deltaFrames = 1, speed = 3.2) {
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length === 0) return { x: 0, y: 0 };
  const frames = Number.isFinite(deltaFrames) ? Math.max(0, Math.min(3, deltaFrames)) : 1;
  const distance = speed * frames;
  return { x: (dx / length) * distance, y: (dy / length) * distance };
}
