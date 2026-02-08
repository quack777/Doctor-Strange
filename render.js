function getCoverTransform(videoWidth, videoHeight, canvasWidth, canvasHeight) {
  const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
  const drawWidth = videoWidth * scale;
  const drawHeight = videoHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;
  return { scale, offsetX, offsetY, drawWidth, drawHeight };
}

function drawVideoCover(ctx, video, canvas, mirrorX) {
  if (video.readyState < 2) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const { offsetX, offsetY, drawWidth, drawHeight, scale } = getCoverTransform(
    vw,
    vh,
    canvas.width,
    canvas.height
  );

  ctx.save();
  if (mirrorX) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
  return { scale, offsetX, offsetY, vw, vh };
}

function drawTrail(ctx, points) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 159, 26, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPoint(ctx, point) {
  if (!point) return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 209, 102, 0.9)";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  if (!particles || particles.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.ttl);
    ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBase(ctx, canvas, video, mirrorX) {
  const info = drawVideoCover(ctx, video, canvas, mirrorX);
  if (!info) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return info;
}

function drawPortal(ctx, canvas, portalVideo, portal, mirrorX) {
  if (!portal) return;
  const { center, radius } = portal;

  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.clip();

  drawVideoCover(ctx, portalVideo, canvas, mirrorX);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#ff9f1a";
  ctx.lineWidth = Math.max(4, Math.min(8, radius * 0.08));
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function renderFrame({
  ctx,
  canvas,
  video,
  portalVideo,
  points,
  portal,
  lastPoint,
  mirrorX,
  particles
}) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseInfo = drawBase(ctx, canvas, video, mirrorX);
  drawPortal(ctx, canvas, portalVideo, portal, mirrorX);
  drawParticles(ctx, particles);
  drawTrail(ctx, points);
  drawPoint(ctx, lastPoint);

  return baseInfo;
}

export function mapNormalizedToCanvas(lm, video, canvas, mirrorX) {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const baseX = (mirrorX ? 1 - lm.x : lm.x) * vw;
  const baseY = lm.y * vh;

  const { offsetX, offsetY, scale } = getCoverTransform(vw, vh, canvas.width, canvas.height);
  return {
    x: baseX * scale + offsetX,
    y: baseY * scale + offsetY
  };
}
