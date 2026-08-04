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
    surface.dataset.pixelFieldState = "disabled";
    return;
  }

  let frame = 0;
  let startTime = 0;
  let width = 0;
  let height = 0;
  let cellSize = 4;
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
  let previousDirty = null;
  let pointerAnchor = null;
  let pointerFlowAngle = Math.PI * 0.125;
  let lastIdleFrame = 0;
  let introStartedAt = 0;

  const INTRO_DELAY_SPAN = 360;
  const INTRO_DELAY_JITTER = 80;
  const INTRO_CELL_DURATION = 220;
  const INTRO_LEAD_IN = 20;
  const INTRO_SLOW_START_CUTOFF = 1000;
  const DISTURBANCE_RADIUS = 224;
  const MAX_DISPLACEMENT = 112;
  const EXTRACTION_VOID_RADIUS = 72;
  const GEOMETRIC_PATH_DIRECTIONS = 7;
  const GEOMETRIC_PATH_SEGMENTS = 3;
  const IDLE_FRAME_INTERVAL = 32;
  const DISTURBED_TILE_SIZE = 2;
  const FIELD_GLOW_COLOR = "#5c7c8a";

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
    sourceContext.filter = "grayscale(0.6) saturate(0.55) brightness(0.94) contrast(1.14)";
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
    cellSize = 4;
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
          delay: distance * INTRO_DELAY_SPAN + hash(x, y) * INTRO_DELAY_JITTER,
          seed,
          particleSeed: hash(x + 17, y + 23),
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
    surface.dataset.pixelCellSize = String(cellSize);
    surface.dataset.pixelDisturbedTileSize = String(DISTURBED_TILE_SIZE);
    surface.dataset.pixelInteractionMode = "geometric-extraction";
    surface.dataset.pixelDisturbanceRadius = String(DISTURBANCE_RADIUS);
    surface.dataset.pixelFieldRadius = String(DISTURBANCE_RADIUS);
    surface.dataset.pixelFieldGlow = FIELD_GLOW_COLOR;
    surface.dataset.pixelFieldEdge = "depleted-circle";
    surface.dataset.pixelVoidRadius = String(EXTRACTION_VOID_RADIUS);
    surface.dataset.pixelFieldPath = "polygonal";
    surface.dataset.pixelPathDirections = String(GEOMETRIC_PATH_DIRECTIONS);
    surface.dataset.pixelPathSegments = String(GEOMETRIC_PATH_SEGMENTS);
    surface.dataset.pixelFieldCenterMode = "fixed-pointer";
    surface.dataset.pixelCenterOrbit = "0";
    surface.dataset.pixelFieldState = "idle";
    surface.dataset.pixelMaxDisplacement = String(MAX_DISPLACEMENT);
    surface.dataset.pixelTrailPoints = "0";
    surface.dataset.pixelTrailSpan = "0";
    surface.dataset.pixelIntroBudget = String(INTRO_DELAY_SPAN + INTRO_DELAY_JITTER + INTRO_CELL_DURATION + INTRO_LEAD_IN);
    surface.dataset.pixelSlowStartCutoff = String(INTRO_SLOW_START_CUTOFF);
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

  const regionForPoint = (point) => {
    if (!point) return null;
    const padding = DISTURBANCE_RADIUS + MAX_DISPLACEMENT + cellSize;
    return clampRegion({
      left: point.x - padding,
      top: point.y - padding,
      right: point.x + padding,
      bottom: point.y + padding,
    });
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

  const drawExtractionVoid = (point) => {
    const gradient = context.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      EXTRACTION_VOID_RADIUS * 1.12,
    );
    gradient.addColorStop(0, "rgba(2, 4, 6, 0.99)");
    gradient.addColorStop(0.76, "rgba(2, 4, 6, 0.98)");
    gradient.addColorStop(0.92, "rgba(2, 4, 6, 0.82)");
    gradient.addColorStop(1, "rgba(2, 4, 6, 0)");
    context.save();
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(point.x, point.y, EXTRACTION_VOID_RADIUS * 1.12, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawDisturbance = (now) => {
    const fieldPoint = pointerAnchor ? { ...pointerAnchor } : null;
    const currentDirty = regionForPoint(fieldPoint);
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
    surface.dataset.pixelTrailPoints = "0";
    surface.dataset.pixelTrailSpan = "0";

    if (!fieldPoint || !currentDirty || !sourceCanvas || !sourceContext) {
      surface.dataset.pixelDisturbedTiles = "0";
      surface.dataset.pixelFieldState = "idle";
      surface.dataset.pixelFieldCenter = "";
      surface.dataset.pixelIdleMotion = "idle";
      return false;
    }

    drawExtractionVoid(fieldPoint);
    const segmentLength = MAX_DISPLACEMENT / GEOMETRIC_PATH_SEGMENTS;
    const pathVectors = Array.from({ length: GEOMETRIC_PATH_DIRECTIONS }, (_, index) => {
      const firstAngle = pointerFlowAngle + (index - (GEOMETRIC_PATH_DIRECTIONS - 1) * 0.5) * (Math.PI / 12);
      const turn = (index % 2 === 0 ? -1 : 1) * (Math.PI / 6);
      const secondAngle = firstAngle + turn;
      const thirdAngle = firstAngle;
      return {
        firstX: Math.cos(firstAngle),
        firstY: Math.sin(firstAngle),
        secondX: Math.cos(secondAngle),
        secondY: Math.sin(secondAngle),
        thirdX: Math.cos(thirdAngle),
        thirdY: Math.sin(thirdAngle),
      };
    });
    let disturbedTiles = 0;
    context.save();
    forEachCellInRegion(currentDirty, (cell) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      const centerX = x + cellSize * 0.5;
      const centerY = y + cellSize * 0.5;
      const offsetX = centerX - fieldPoint.x;
      const offsetY = centerY - fieldPoint.y;
      const distance = Math.hypot(offsetX, offsetY);
      if (distance >= EXTRACTION_VOID_RADIUS) return;

      disturbedTiles += 1;
      const pathIndex = Math.min(
        GEOMETRIC_PATH_DIRECTIONS - 1,
        Math.floor(cell.particleSeed * GEOMETRIC_PATH_DIRECTIONS),
      );
      const path = pathVectors[pathIndex];
      const phase = (now * 0.00034 + cell.seed) % 1;
      const travel = Math.sqrt(phase) * MAX_DISPLACEMENT;
      const firstTravel = Math.min(segmentLength, travel);
      const secondTravel = Math.min(segmentLength, Math.max(0, travel - segmentLength));
      const thirdTravel = Math.max(0, travel - segmentLength * 2);
      const normalX = -path.firstY;
      const normalY = path.firstX;
      const laneOffset = Math.max(
        -22,
        Math.min(22, (offsetX * normalX + offsetY * normalY) * 0.32),
      );
      const originX = fieldPoint.x + path.firstX * (EXTRACTION_VOID_RADIUS + 4) + normalX * laneOffset;
      const originY = fieldPoint.y + path.firstY * (EXTRACTION_VOID_RADIUS + 4) + normalY * laneOffset;
      const destinationX = originX
        + path.firstX * firstTravel
        + path.secondX * secondTravel
        + path.thirdX * thirdTravel;
      const destinationY = originY
        + path.firstY * firstTravel
        + path.secondY * secondTravel
        + path.thirdY * thirdTravel;
      const pulse = Math.sin(phase * Math.PI);

      context.globalAlpha = 0.24 + pulse * 0.76;
      context.drawImage(
        sourceCanvas,
        x,
        y,
        cellSize,
        cellSize,
        destinationX,
        destinationY,
        DISTURBED_TILE_SIZE,
        DISTURBED_TILE_SIZE,
      );
      context.globalAlpha = 0.14 + pulse * 0.48;
      context.fillStyle = cell.particleSeed > 0.84 ? "#e0f2f7" : "#a4cbd8";
      context.fillRect(destinationX, destinationY, DISTURBED_TILE_SIZE, DISTURBED_TILE_SIZE);
    });
    context.restore();
    context.globalAlpha = 1;
    surface.dataset.pixelDisturbedTiles = String(disturbedTiles);
    surface.dataset.pixelExtractedTiles = String(disturbedTiles);
    surface.dataset.pixelFieldState = "active";
    surface.dataset.pixelFieldCenter = `${Math.round(pointerAnchor.x)},${Math.round(pointerAnchor.y)}`;
    surface.dataset.pixelFieldFlowAngle = String(Math.round(pointerFlowAngle * 180 / Math.PI));
    surface.dataset.pixelIdleMotion = "active";
    return disturbedTiles > 0;
  };

  const renderInteractive = (now) => {
    frame = 0;
    if (reducedMotion.matches) {
      setStatic();
      return;
    }
    if (!complete || !visible || document.hidden || !pointerEligible.matches) {
      pointerAnchor = null;
      previousDirty = null;
      surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
      surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
      surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
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
      const progress = Math.min(1, Math.max(0, (elapsed - cell.delay) / INTRO_CELL_DURATION));
      if (progress >= 1) return;
      remaining += 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      const size = Math.max(0, cellSize * (1 - eased));
      const offset = (cellSize - size) * 0.5;
      context.globalAlpha = 0.98 - eased * 0.32;
      context.fillStyle = "rgba(3, 4, 5, 0.96)";
      context.fillRect(cell.x * cellSize + offset, cell.y * cellSize + offset, size + 0.5, size + 0.5);
      const particleSeed = cell.particleSeed;
      if (progress > 0.16 && progress < 0.92 && particleSeed > 0.78) {
        const pulse = Math.sin(progress * Math.PI);
        const particleSize = particleSeed > 0.92 ? 2 : 1;
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
    finishIntro("animated");
  };

  const finishIntro = (mode) => {
    complete = true;
    surface.dataset.pixelState = "complete";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIntroMode = mode;
    surface.dataset.pixelIntroElapsed = String(Math.max(0, Math.round(performance.now() - introStartedAt)));
    document.documentElement.classList.add("home-pixel-reveal-complete");
    drawTexture();
  };

  const start = () => {
    if (started || reducedMotion.matches || !visible) return;
    started = true;
    const imageReadyAt = performance.now();
    introStartedAt = imageReadyAt;
    configure();
    surface.dataset.pixelState = "running";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
    if (!pointerEligible.matches || imageReadyAt >= INTRO_SLOW_START_CUTOFF) {
      finishIntro("instant");
      return;
    }
    surface.dataset.pixelIntroMode = "animated";
    startTime = performance.now() + INTRO_LEAD_IN;
    frame = window.requestAnimationFrame(renderIntro);
  };

  const setPointerField = (clientX, clientY) => {
    if (!complete || !visible || document.hidden || reducedMotion.matches || !pointerEligible.matches) return;
    const x = clientX + window.scrollX - surfaceDocumentLeft;
    const y = clientY + window.scrollY - surfaceDocumentTop;
    if (x < 0 || x > width || y < 0 || y > height) {
      pointerAnchor = null;
      surface.dataset.pixelFieldState = "idle";
      surface.dataset.pixelIdleMotion = "idle";
      if (!frame && previousDirty) frame = window.requestAnimationFrame(renderInteractive);
      return;
    }
    if (pointerAnchor) {
      const deltaX = x - pointerAnchor.x;
      const deltaY = y - pointerAnchor.y;
      if (Math.hypot(deltaX, deltaY) >= 3) {
        const snap = Math.PI / 4;
        pointerFlowAngle = Math.round(Math.atan2(deltaY, deltaX) / snap) * snap;
      }
    }
    pointerAnchor = { x, y };
    surface.dataset.pixelPointer = "active";
    surface.dataset.pixelFieldState = "active";
    surface.dataset.pixelIdleMotion = "active";
    if (!frame) frame = window.requestAnimationFrame(renderInteractive);
  };

  const clearPointer = () => {
    pointerAnchor = null;
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
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
    previousDirty = null;
    clearPointer();
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
    surface.dataset.pixelPointer = "disabled";
    surface.dataset.pixelIdleMotion = "disabled";
    surface.dataset.pixelFieldState = "disabled";
  };

  const restoreMotion = () => {
    document.documentElement.classList.remove("home-pixel-reveal-static");
    configure();
    started = true;
    complete = true;
    surface.dataset.pixelState = "complete";
    surface.dataset.pixelPointer = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelIdleMotion = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
    drawTexture();
  };

  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) setStatic();
    else restoreMotion();
  };

  const handlePointerEligibilityChange = () => {
    previousDirty = null;
    clearPointer();
    if (!pointerEligible.matches) {
      cancelFrame();
      surface.dataset.pixelPointer = "disabled";
      surface.dataset.pixelIdleMotion = "disabled";
      surface.dataset.pixelFieldState = "disabled";
      if (!complete && started && !reducedMotion.matches) finishIntro("instant");
      else if (complete && !reducedMotion.matches) drawTexture();
    } else if (complete && !reducedMotion.matches) {
      surface.dataset.pixelPointer = "idle";
      surface.dataset.pixelIdleMotion = "idle";
      surface.dataset.pixelFieldState = "idle";
    }
  };

  window.addEventListener("pointermove", (event) => setPointerField(event.clientX, event.clientY), { passive: true });
  window.addEventListener("pointercancel", clearPointer, { passive: true });
  document.addEventListener("pointerleave", clearPointer, { passive: true });
  window.addEventListener("blur", clearPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelFrame();
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
      clearPointer();
      configure();
      if (complete) drawTexture();
      else if (!pointerEligible.matches) finishIntro("instant");
      else {
        introStartedAt = performance.now();
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
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
  }
})();
