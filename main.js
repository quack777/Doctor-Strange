import { createHands } from "./hand.js";
import { detectCircle } from "./gesture.js";
import { renderFrame, mapNormalizedToCanvas } from "./render.js";

const video = document.getElementById("video");
const portalVideo = document.getElementById("portalVideo");
const canvas = document.getElementById("canvas");
const statusEl = document.getElementById("status");
const portalFile = document.getElementById("portalFile");
const portalInfo = document.getElementById("portalInfo");
const ctx = canvas.getContext("2d");

const state = {
  points: [],
  lastPoint: null,
  portal: null,
  gestureLocked: false,
  growPortal: false,
  particles: []
};

const MAX_POINTS = 60;
const MIRROR_X = true;

function setStatus(text) {
  statusEl.textContent = text;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width));
  canvas.height = Math.max(1, Math.floor(rect.height));
}

function addPoint(point) {
  state.points.push(point);
  state.lastPoint = point;
  if (state.points.length > MAX_POINTS) {
    state.points.shift();
  }
}

function clearPoints() {
  state.points = [];
  state.lastPoint = null;
}

function emitParticles(origin) {
  const count = 8;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const size = 1.5 + Math.random() * 3.5;
    const ttl = 0.25 + Math.random() * 0.35;
    const colorShift = Math.random() * 40;
    state.particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: ttl,
      ttl,
      size,
      r: 255,
      g: 170 + colorShift,
      b: 60
    });
  }
}

function updateParticles(dt) {
  const gravity = 220;
  for (const p of state.particles) {
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    },
    audio: false
  });
  video.srcObject = stream;
  await video.play();
  resizeCanvas();
}

function setupPortalVideo() {
  portalVideo.muted = true;
  portalVideo.loop = true;
  portalVideo.playsInline = true;

  portalFile.addEventListener("change", () => {
    const file = portalFile.files && portalFile.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    portalVideo.src = url;
    portalVideo.play().catch(() => {});
    portalInfo.textContent = file.name;
  });
}

function setupPortalGrow() {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      state.growPortal = true;
      e.preventDefault();
    }
    if (e.code === "Escape") {
      state.portal = null;
      state.gestureLocked = false;
      clearPoints();
      setStatus("Draw a circle with your index finger");
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      state.growPortal = false;
      e.preventDefault();
    }
  });
}

async function start() {
  setupPortalVideo();
  setupPortalGrow();

  try {
    await startWebcam();
    setStatus("Draw a circle with your index finger");
  } catch (err) {
    setStatus("Webcam access denied or unavailable.");
    return;
  }

  window.addEventListener("resize", resizeCanvas);

  const hands = createHands(
    (lm) => {
      const point = mapNormalizedToCanvas(lm, video, canvas, MIRROR_X);
      addPoint(point);
      emitParticles(point);
      if (!state.gestureLocked) {
        const portal = detectCircle(state.points);
        if (portal) {
          state.portal = portal;
          state.gestureLocked = true;
          setStatus("Portal created!");
        }
      }
    },
    () => {
      clearPoints();
      if (!state.gestureLocked) {
        setStatus("Hand not detected");
      }
    }
  );

  let processing = false;

  let lastTs = performance.now();
  async function loop(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if (video.readyState >= 2 && !processing) {
      processing = true;
      hands
        .send({ image: video })
        .catch(() => {})
        .finally(() => {
          processing = false;
        });
    }

    renderFrame({
      ctx,
      canvas,
      video,
      portalVideo,
      points: state.points,
      portal: state.portal,
      lastPoint: state.lastPoint,
      mirrorX: MIRROR_X,
      particles: state.particles
    });

    updateParticles(dt);

    if (state.portal && state.growPortal) {
      const growthPerSec = 180;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.6;
      state.portal.radius = Math.min(maxRadius, state.portal.radius + growthPerSec * dt);
    }

    requestAnimationFrame(loop);
  }

  loop(performance.now());
}

start();
