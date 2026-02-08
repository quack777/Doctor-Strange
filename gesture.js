export function detectCircle(points) {
  if (points.length < 30) return null;

  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / points.length;
  const cy = sumY / points.length;

  const distances = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const r = distances.reduce((a, b) => a + b, 0) / distances.length;
  if (r === 0) return null;

  const variance = distances.reduce((acc, d) => acc + Math.pow(d - r, 2), 0) / distances.length;
  const std = Math.sqrt(variance);

  if (std / r < 0.2) {
    return { center: { x: cx, y: cy }, radius: r };
  }
  return null;
}
