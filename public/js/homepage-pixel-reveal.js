(() => {
  "use strict";

  const surface = document.querySelector("[data-home-pixel-reveal]");
  const canvas = surface?.querySelector("[data-home-pixel-canvas]");
  const image = surface?.querySelector("img");
  if (!(surface instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(image instanceof HTMLImageElement)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerEligible = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const saveData = Boolean(navigator.connection?.saveData);
  const context = canvas.getContext("2d", { alpha: true });
  if (!context || saveData) {
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
    surface.dataset.pixelPointer = "disabled";
    return;
  }

  let frame = 0;
  let startTime = 0;
  let width = 0;
  let height = 0;
  let cellSize = 14;
  let cells = [];
  let started = false;
  let complete = false;
  let visible = true;
  let resizeTimer = 0;
  let lastTrailPoint = null;
  let trail = [];

  const TRAIL_LIFETIME = 720;
  const MIN_PAINTED_FRAMES = 4;
  const DISTURBANCE_RADIUS = 110;
  const MAX_TRAIL_POINTS = 18;

  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const cancelFrame = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const configure = () => {
    const box = surface.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    cellSize = width < 640 ? 18 : width < 980 ? 16 : 14;

    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const originX = columns * 0.72;
    const originY = rows * 0.42;
    const furthest = Math.hypot(Math.max(originX, columns - originX), Math.max(originY, rows - originY)) || 1;
    cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const distance = Math.hypot(x - originX, y - originY) / furthest;
        cells.push({ x, y, delay: distance * 1450 + hash(x, y) * 220 });
      }
    }
    surface.dataset.pixelCells = String(cells.length);
  };

  const drawTexture = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(4, 5, 6, 0.2)";
    cells.forEach((cell) => {
      if (hash(cell.x + 9, cell.y + 3) < 0.84) return;
      const size = hash(cell.x + 4, cell.y + 11) > 0.72 ? 2 : 1;
      context.fillRect(cell.x * cellSize + cellSize * 0.5, cell.y * cellSize + cellSize * 0.5, size, size);
    });
  };

  const imageCoverGeometry = () => {
    const naturalWidth = image.naturalWidth || width;
    const naturalHeight = image.naturalHeight || height;
    const scale = Math.max(width / naturalWidth, height / naturalHeight);
    return {
      scale,
      cropX: (naturalWidth - width / scale) * 0.5,
      cropY: (naturalHeight - height / scale) * 0.5,
    };
  };

  const drawDisturbance = (now) => {
    trail.forEach((point) => {
      if (point.paintedFrames < MIN_PAINTED_FRAMES && now - point.time >= TRAIL_LIFETIME) point.time = now;
    });
    trail = trail.filter((point) => point.paintedFrames < MIN_PAINTED_FRAMES || now - point.time < TRAIL_LIFETIME);
    drawTexture();
    if (!trail.length) return false;

    const cover = imageCoverGeometry();
    const sourceSize = cellSize / cover.scale;
    let disturbedTiles = 0;
    context.save();
    context.filter = "saturate(0.95) brightness(0.92) contrast(1.16)";

    cells.forEach((cell) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      const centerX = x + cellSize * 0.5;
      const centerY = y + cellSize * 0.5;
      let influence = 0;

      trail.forEach((point) => {
        const life = Math.max(0, 1 - (now - point.time) / TRAIL_LIFETIME);
        const radius = DISTURBANCE_RADIUS * (0.72 + life * 0.28);
        const distance = Math.hypot(centerX - point.x, centerY - point.y);
        if (distance < radius) influence = Math.max(influence, (1 - distance / radius) * life);
      });
      if (influence < 0.035) return;
      disturbedTiles += 1;

      const seed = hash(cell.x + 31, cell.y + 47);
      const angle = seed * Math.PI * 2;
      const displacement = influence * (10 + seed * 32);
      const dx = Math.cos(angle) * displacement;
      const dy = Math.sin(angle) * displacement;
      const sourceX = cover.cropX + x / cover.scale;
      const sourceY = cover.cropY + y / cover.scale;

      context.globalAlpha = Math.min(0.7, influence * 0.68);
      context.fillStyle = "#030405";
      context.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
      context.globalAlpha = Math.min(1, 0.34 + influence * 0.9);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        x + dx,
        y + dy,
        cellSize + 0.75,
        cellSize + 0.75,
      );
    });

    surface.dataset.pixelDisturbedTiles = String(disturbedTiles);
    if (disturbedTiles > 0) {
      const paintedAt = performance.now();
      trail.forEach((point) => {
        if (!point.painted) point.time = paintedAt;
        point.painted = true;
        point.paintedFrames += 1;
      });
    }
    context.restore();
    context.globalAlpha = 1;
    return true;
  };

  const renderInteractive = (now) => {
    frame = 0;
    if (reducedMotion.matches) {
      setStatic();
      return;
    }
    if (!complete || !visible || document.hidden || !pointerEligible.matches) {
      trail = [];
      surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
      if (complete && !reducedMotion.matches) drawTexture();
      return;
    }

    const active = drawDisturbance(now);
    surface.dataset.pixelPointer = active ? "active" : "idle";
    if (active) frame = window.requestAnimationFrame(renderInteractive);
  };

  const renderIntro = (now) => {
    frame = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;

    const elapsed = now - startTime;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(3, 4, 5, 0.96)";
    let remaining = 0;

    cells.forEach((cell) => {
      const progress = Math.min(1, Math.max(0, (elapsed - cell.delay) / 460));
      if (progress >= 1) return;
      remaining += 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      const size = Math.max(0, cellSize * (1 - eased));
      const offset = (cellSize - size) * 0.5;
      context.globalAlpha = 0.98 - eased * 0.32;
      context.fillStyle = "rgba(3, 4, 5, 0.96)";
      context.fillRect(cell.x * cellSize + offset, cell.y * cellSize + offset, size + 0.5, size + 0.5);
      const particleSeed = hash(cell.x + 17, cell.y + 23);
      if (progress > 0.16 && progress < 0.92 && particleSeed > 0.78) {
        const pulse = Math.sin(progress * Math.PI);
        const particleSize = particleSeed > 0.92 ? 3 : 2;
        context.globalAlpha = pulse * (particleSeed > 0.88 ? 0.54 : 0.38);
        context.fillStyle = particleSeed > 0.88 ? "#f0a86f" : "#78b7be";
        context.fillRect(
          cell.x * cellSize + cellSize * 0.5 - particleSize * 0.5,
          cell.y * cellSize + cellSize * 0.5 - particleSize * 0.5,
          particleSize,
          particleSize,
        );
      }
    });
    context.globalAlpha = 1;

    if (remaining > 0) {
      frame = window.requestAnimationFrame(renderIntro);
      return;
    }
    complete = true;
    surface.dataset.pixelState = "complete";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    document.documentElement.classList.add("home-pixel-reveal-complete");
    drawTexture();
  };

  const start = () => {
    if (started || reducedMotion.matches || !visible) return;
    started = true;
    configure();
    surface.dataset.pixelState = "running";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    startTime = performance.now() + 120;
    frame = window.requestAnimationFrame(renderIntro);
  };

  const addTrailPoint = (clientX, clientY) => {
    if (!complete || !visible || document.hidden || reducedMotion.matches || !pointerEligible.matches) return;
    const box = surface.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    if (x < 0 || x > box.width || y < 0 || y > box.height) {
      lastTrailPoint = null;
      return;
    }
    if (lastTrailPoint && Math.hypot(x - lastTrailPoint.x, y - lastTrailPoint.y) < 5) return;

    const point = { x, y, time: performance.now(), painted: false, paintedFrames: 0 };
    trail.push(point);
    if (trail.length > MAX_TRAIL_POINTS) trail.splice(0, trail.length - MAX_TRAIL_POINTS);
    lastTrailPoint = point;
    surface.dataset.pixelPointer = "active";
    if (!frame) frame = window.requestAnimationFrame(renderInteractive);
  };

  const clearPointer = () => {
    lastTrailPoint = null;
  };

  const observer = new IntersectionObserver((entries) => {
    const entry = entries.find((item) => item.target === surface);
    visible = Boolean(entry?.isIntersecting);
    if (!visible) {
      cancelFrame();
      trail = [];
      clearPointer();
      surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
      return;
    }
    if (!started) {
      if (image.complete) start();
      else image.addEventListener("load", start, { once: true });
    } else if (!complete && !frame && !reducedMotion.matches) {
      startTime = performance.now();
      frame = window.requestAnimationFrame(renderIntro);
    } else if (complete) {
      drawTexture();
    }
  }, { rootMargin: "80px", threshold: 0.01 });
  observer.observe(surface);

  const setStatic = () => {
    cancelFrame();
    trail = [];
    clearPointer();
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
    surface.dataset.pixelPointer = "disabled";
  };

  const restoreMotion = () => {
    document.documentElement.classList.remove("home-pixel-reveal-static");
    configure();
    started = true;
    complete = true;
    surface.dataset.pixelState = "complete";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    drawTexture();
  };

  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) setStatic();
    else restoreMotion();
  };

  const handlePointerEligibilityChange = () => {
    trail = [];
    clearPointer();
    if (!pointerEligible.matches) {
      cancelFrame();
      surface.dataset.pixelPointer = "disabled";
      if (complete && !reducedMotion.matches) drawTexture();
    } else if (complete && !reducedMotion.matches) {
      surface.dataset.pixelPointer = "idle";
    }
  };

  window.addEventListener("pointermove", (event) => addTrailPoint(event.clientX, event.clientY), { passive: true });
  window.addEventListener("pointercancel", clearPointer, { passive: true });
  document.addEventListener("pointerleave", clearPointer, { passive: true });
  window.addEventListener("blur", clearPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelFrame();
      trail = [];
      clearPointer();
    } else if (complete && visible && !reducedMotion.matches) {
      drawTexture();
    }
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!started || reducedMotion.matches) return;
      cancelFrame();
      configure();
      if (complete) drawTexture();
      else {
        startTime = performance.now();
        frame = window.requestAnimationFrame(renderIntro);
      }
    }, 140);
  }, { passive: true });

  reducedMotion.addEventListener("change", handleReducedMotionChange);
  pointerEligible.addEventListener("change", handlePointerEligibilityChange);

  if (reducedMotion.matches) setStatic();
  else {
    surface.dataset.pixelState = "ready";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
  }
})();
