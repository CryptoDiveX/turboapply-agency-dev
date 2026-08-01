(() => {
  "use strict";

  const surface = document.querySelector("[data-home-pixel-reveal]");
  const canvas = surface?.querySelector("[data-home-pixel-canvas]");
  const image = surface?.querySelector("img");
  if (!(surface instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(image instanceof HTMLImageElement)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerEligible = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const saveData = Boolean(navigator.connection?.saveData);
  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context || saveData) {
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
    surface.dataset.pixelPointer = "disabled";
    surface.dataset.pixelIdleMotion = "disabled";
    return;
  }

  let frame = 0;
  let startTime = 0;
  let width = 0;
  let height = 0;
  let cellSize = 16;
  let columns = 0;
  let rows = 0;
  let cells = [];
  let started = false;
  let complete = false;
  let visible = true;
  let resizeTimer = 0;
  let surfaceDocumentLeft = 0;
  let surfaceDocumentTop = 0;
  let sourceCanvas = null;
  let sourceContext = null;
  let lastTrailPoint = null;
  let pendingPoint = null;
  let previousDirty = null;
  let trail = [];
  let pointerAnchor = null;
  let lastIdleFrame = 0;

  const TRAIL_LIFETIME = 520;
  const DISTURBANCE_RADIUS = 96;
  const MAX_TRAIL_POINTS = 3;
  const MIN_TRAIL_DISTANCE = 18;
  const MAX_DISPLACEMENT = 42;
  const IDLE_ORBIT_X = 18;
  const IDLE_ORBIT_Y = 14;
  const IDLE_FRAME_INTERVAL = 32;

  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const cancelFrame = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const createSourceCanvas = () => {
    sourceCanvas = typeof OffscreenCanvas === "function"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceContext = sourceCanvas.getContext("2d", { alpha: false });
    if (!sourceContext) return;

    const naturalWidth = image.naturalWidth || width;
    const naturalHeight = image.naturalHeight || height;
    const scale = Math.max(width / naturalWidth, height / naturalHeight);
    const drawWidth = naturalWidth * scale;
    const drawHeight = naturalHeight * scale;
    sourceContext.filter = "saturate(0.95) brightness(0.92) contrast(1.16)";
    sourceContext.drawImage(
      image,
      (width - drawWidth) * 0.5,
      (height - drawHeight) * 0.5,
      drawWidth,
      drawHeight,
    );
    sourceContext.filter = "none";
  };

  const configure = () => {
    const box = surface.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    surfaceDocumentLeft = box.left + window.scrollX;
    surfaceDocumentTop = box.top + window.scrollY;

    // Pixel-art squares stay crisp at one backing-store pixel per CSS pixel.
    // This mirrors the reference's 1x particle canvas and avoids a 4x Retina raster cost.
    canvas.width = width;
    canvas.height = height;
    context.setTransform(1, 0, 0, 1, 0, 0);
    cellSize = width < 640 ? 18 : 16;
    columns = Math.ceil(width / cellSize);
    rows = Math.ceil(height / cellSize);

    const originX = columns * 0.72;
    const originY = rows * 0.42;
    const furthest = Math.hypot(Math.max(originX, columns - originX), Math.max(originY, rows - originY)) || 1;
    cells = new Array(columns * rows);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const distance = Math.hypot(x - originX, y - originY) / furthest;
        const seed = hash(x + 31, y + 47);
        const angle = seed * Math.PI * 2;
        cells[y * columns + x] = {
          x,
          y,
          delay: distance * 1450 + hash(x, y) * 220,
          seed,
          cos: Math.cos(angle),
          sin: Math.sin(angle),
          texture: hash(x + 9, y + 3) >= 0.84,
          textureSize: hash(x + 4, y + 11) > 0.72 ? 2 : 1,
        };
      }
    }
    createSourceCanvas();
    previousDirty = null;
    surface.dataset.pixelCells = String(cells.length);
    surface.dataset.pixelBackingScale = "1";
  };

  const clampRegion = (region) => {
    if (!region) return null;
    const left = Math.max(0, Math.floor(region.left));
    const top = Math.max(0, Math.floor(region.top));
    const right = Math.min(width, Math.ceil(region.right));
    const bottom = Math.min(height, Math.ceil(region.bottom));
    if (right <= left || bottom <= top) return null;
    return { left, top, right, bottom };
  };

  const unionRegion = (first, second) => {
    if (!first) return second ? { ...second } : null;
    if (!second) return { ...first };
    return {
      left: Math.min(first.left, second.left),
      top: Math.min(first.top, second.top),
      right: Math.max(first.right, second.right),
      bottom: Math.max(first.bottom, second.bottom),
    };
  };

  const regionForPoints = (points) => {
    let region = null;
    const padding = DISTURBANCE_RADIUS + MAX_DISPLACEMENT + cellSize;
    points.forEach((point) => {
      region = unionRegion(region, {
        left: point.x - padding,
        top: point.y - padding,
        right: point.x + padding,
        bottom: point.y + padding,
      });
    });
    return clampRegion(region);
  };

  const forEachCellInRegion = (region, callback) => {
    if (!region) return;
    const minColumn = Math.max(0, Math.floor(region.left / cellSize));
    const maxColumn = Math.min(columns - 1, Math.ceil(region.right / cellSize));
    const minRow = Math.max(0, Math.floor(region.top / cellSize));
    const maxRow = Math.min(rows - 1, Math.ceil(region.bottom / cellSize));
    for (let row = minRow; row <= maxRow; row += 1) {
      const offset = row * columns;
      for (let column = minColumn; column <= maxColumn; column += 1) callback(cells[offset + column]);
    }
  };

  const drawTextureRegion = (region) => {
    context.fillStyle = "rgba(4, 5, 6, 0.2)";
    forEachCellInRegion(region, (cell) => {
      if (!cell.texture) return;
      context.fillRect(
        cell.x * cellSize + cellSize * 0.5,
        cell.y * cellSize + cellSize * 0.5,
        cell.textureSize,
        cell.textureSize,
      );
    });
  };

  const drawTexture = () => {
    context.clearRect(0, 0, width, height);
    drawTextureRegion({ left: 0, top: 0, right: width, bottom: height });
    previousDirty = null;
  };

  const commitPendingPoint = (now) => {
    if (!pendingPoint) return;
    const pending = pendingPoint;
    pendingPoint = null;
    const last = trail[trail.length - 1];
    if (last && Math.hypot(pending.x - last.x, pending.y - last.y) < MIN_TRAIL_DISTANCE) {
      last.x = pending.x;
      last.y = pending.y;
      last.time = now;
      last.painted = false;
      lastTrailPoint = last;
      return;
    }
    const point = { x: pending.x, y: pending.y, time: now, painted: false };
    trail.push(point);
    while (trail.length > MAX_TRAIL_POINTS) trail.shift();
    lastTrailPoint = point;
  };

  const drawDisturbance = (now) => {
    commitPendingPoint(now);
    trail = trail.filter((point) => !point.painted || now - point.time < TRAIL_LIFETIME);

    const idlePoint = pointerAnchor ? {
      x: pointerAnchor.x + Math.cos(now * 0.0017) * IDLE_ORBIT_X,
      y: pointerAnchor.y + Math.sin(now * 0.0013) * IDLE_ORBIT_Y,
      idle: true,
    } : null;
    const activePoints = idlePoint ? [...trail, idlePoint] : trail;
    const currentDirty = regionForPoints(activePoints);
    const restoreRegion = clampRegion(unionRegion(previousDirty, currentDirty));
    if (restoreRegion) {
      context.clearRect(
        restoreRegion.left,
        restoreRegion.top,
        restoreRegion.right - restoreRegion.left,
        restoreRegion.bottom - restoreRegion.top,
      );
      drawTextureRegion(restoreRegion);
    }
    previousDirty = currentDirty;
    if (!activePoints.length || !currentDirty || !sourceCanvas || !sourceContext) {
      surface.dataset.pixelDisturbedTiles = "0";
      surface.dataset.pixelIdleMotion = pointerAnchor ? "active" : "idle";
      return Boolean(pointerAnchor);
    }

    let disturbedTiles = 0;
    trail.forEach((point) => { point.touched = false; });
    context.save();
    forEachCellInRegion(currentDirty, (cell) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      const centerX = x + cellSize * 0.5;
      const centerY = y + cellSize * 0.5;
      let influence = 0;

      activePoints.forEach((point) => {
        const life = point.idle
          ? 0.72 + (Math.sin(now * 0.0021 + cell.seed * Math.PI * 2) + 1) * 0.09
          : (point.painted ? Math.max(0, 1 - (now - point.time) / TRAIL_LIFETIME) : 1);
        const radius = point.idle
          ? DISTURBANCE_RADIUS * (0.9 + Math.sin(now * 0.0015) * 0.08)
          : DISTURBANCE_RADIUS * (0.76 + life * 0.24);
        const distance = Math.hypot(centerX - point.x, centerY - point.y);
        if (distance >= radius) return;
        const pointInfluence = (1 - distance / radius) * life;
        if (!point.idle && pointInfluence > 0.035) point.touched = true;
        influence = Math.max(influence, pointInfluence);
      });
      if (influence < 0.035) return;
      disturbedTiles += 1;

      const displacement = influence * (10 + cell.seed * 32);
      const temporalAngle = pointerAnchor ? Math.sin(now * 0.0012 + cell.seed * 5) * 0.22 : 0;
      const dx = (cell.cos * Math.cos(temporalAngle) - cell.sin * Math.sin(temporalAngle)) * displacement;
      const dy = (cell.sin * Math.cos(temporalAngle) + cell.cos * Math.sin(temporalAngle)) * displacement;
      context.globalAlpha = Math.min(0.7, influence * 0.68);
      context.fillStyle = "#030405";
      context.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
      context.globalAlpha = Math.min(1, 0.34 + influence * 0.9);
      context.drawImage(
        sourceCanvas,
        x,
        y,
        cellSize,
        cellSize,
        x + dx,
        y + dy,
        cellSize + 0.75,
        cellSize + 0.75,
      );
    });

    const paintedAt = performance.now();
    trail.forEach((point) => {
      if (!point.painted && point.touched) point.time = paintedAt;
      if (point.touched) point.painted = true;
      delete point.touched;
    });
    context.restore();
    context.globalAlpha = 1;
    surface.dataset.pixelDisturbedTiles = String(disturbedTiles);
    surface.dataset.pixelIdleMotion = pointerAnchor ? "active" : "idle";
    return disturbedTiles > 0 || trail.some((point) => !point.painted) || Boolean(pointerAnchor);
  };

  const renderInteractive = (now) => {
    frame = 0;
    if (reducedMotion.matches) {
      setStatic();
      return;
    }
    if (!complete || !visible || document.hidden || !pointerEligible.matches) {
      trail = [];
      pendingPoint = null;
      pointerAnchor = null;
      previousDirty = null;
      surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
      surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
      if (complete && !reducedMotion.matches) drawTexture();
      return;
    }

    if (pointerAnchor && now - lastIdleFrame < IDLE_FRAME_INTERVAL) {
      frame = window.requestAnimationFrame(renderInteractive);
      return;
    }
    lastIdleFrame = now;
    const active = drawDisturbance(now);
    surface.dataset.pixelPointer = active ? "active" : "idle";
    if (active || pendingPoint) frame = window.requestAnimationFrame(renderInteractive);
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
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    document.documentElement.classList.add("home-pixel-reveal-complete");
    drawTexture();
  };

  const start = () => {
    if (started || reducedMotion.matches || !visible) return;
    started = true;
    configure();
    surface.dataset.pixelState = "running";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    startTime = performance.now() + 120;
    frame = window.requestAnimationFrame(renderIntro);
  };

  const addTrailPoint = (clientX, clientY) => {
    if (!complete || !visible || document.hidden || reducedMotion.matches || !pointerEligible.matches) return;
    const x = clientX + window.scrollX - surfaceDocumentLeft;
    const y = clientY + window.scrollY - surfaceDocumentTop;
    if (x < 0 || x > width || y < 0 || y > height) {
      pointerAnchor = null;
      lastTrailPoint = null;
      surface.dataset.pixelIdleMotion = "idle";
      if (!frame && previousDirty) frame = window.requestAnimationFrame(renderInteractive);
      return;
    }
    pointerAnchor = { x, y };
    pendingPoint = { x, y };
    surface.dataset.pixelPointer = "active";
    surface.dataset.pixelIdleMotion = "active";
    if (!frame) frame = window.requestAnimationFrame(renderInteractive);
  };

  const clearPointer = () => {
    pointerAnchor = null;
    lastTrailPoint = null;
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    if (complete && visible && !document.hidden && !reducedMotion.matches && !frame && previousDirty) {
      frame = window.requestAnimationFrame(renderInteractive);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    const entry = entries.find((item) => item.target === surface);
    visible = Boolean(entry?.isIntersecting);
    if (!visible) {
      cancelFrame();
      trail = [];
      pendingPoint = null;
      previousDirty = null;
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
    pendingPoint = null;
    previousDirty = null;
    clearPointer();
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
    surface.dataset.pixelPointer = "disabled";
    surface.dataset.pixelIdleMotion = "disabled";
  };

  const restoreMotion = () => {
    document.documentElement.classList.remove("home-pixel-reveal-static");
    configure();
    started = true;
    complete = true;
    surface.dataset.pixelState = "complete";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    drawTexture();
  };

  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) setStatic();
    else restoreMotion();
  };

  const handlePointerEligibilityChange = () => {
    trail = [];
    pendingPoint = null;
    previousDirty = null;
    clearPointer();
    if (!pointerEligible.matches) {
      cancelFrame();
      surface.dataset.pixelPointer = "disabled";
      surface.dataset.pixelIdleMotion = "disabled";
      if (complete && !reducedMotion.matches) drawTexture();
    } else if (complete && !reducedMotion.matches) {
      surface.dataset.pixelPointer = "idle";
      surface.dataset.pixelIdleMotion = "idle";
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
      pendingPoint = null;
      previousDirty = null;
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
      trail = [];
      pendingPoint = null;
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
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
  }
})();
