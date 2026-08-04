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
  let pointerPrevious = null;
  let fieldSegments = [];
  let lastIdleFrame = 0;
  let introStartedAt = 0;

  const INTRO_DELAY_SPAN = 360;
  const INTRO_DELAY_JITTER = 80;
  const INTRO_CELL_DURATION = 220;
  const INTRO_LEAD_IN = 20;
  const INTRO_SLOW_START_CUTOFF = 1000;
  const FIELD_RADIUS_RATIO = 0.11;
  const FIELD_STRENGTH = 0.8;
  const FIELD_DECAY = 0.955;
  const PARTICLE_DISPERSE = 370;
  const PARTICLE_LIFT = 15;
  const PARTICLE_POINT_SIZE = 2;
  const FIELD_SEGMENT_LIMIT = 24;
  const FIELD_SEGMENT_LIFETIME = 1600;
  const IDLE_FRAME_INTERVAL = 32;
  const DEPLETION_TILE_SIZE = 2;
  const COLOR_FREE_CORE_RATIO = 0;
  const PARTICLE_COLOR_STEPS = 6;
  const PARTICLE_COLOR_LEVELS = Array.from(
    { length: PARTICLE_COLOR_STEPS },
    (_, index) => Math.round((index / (PARTICLE_COLOR_STEPS - 1)) * 255),
  );
  const PARTICLE_PALETTE = PARTICLE_COLOR_LEVELS.flatMap((red) => (
    PARTICLE_COLOR_LEVELS.flatMap((green) => (
      PARTICLE_COLOR_LEVELS.map((blue) => `rgb(${red}, ${green}, ${blue})`)
    ))
  ));
  const PARTICLE_ALPHA_LEVELS = [0.3, 0.5, 0.72, 0.92];

  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const smoothstep = (edge0, edge1, value) => {
    const normalized = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return normalized * normalized * (3 - 2 * normalized);
  };

  const distanceToSegment = (x, y, from, to) => {
    const segmentX = to.x - from.x;
    const segmentY = to.y - from.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection = lengthSquared > 0
      ? Math.max(0, Math.min(1, ((x - from.x) * segmentX + (y - from.y) * segmentY) / lengthSquared))
      : 0;
    return Math.hypot(x - (from.x + segmentX * projection), y - (from.y + segmentY * projection));
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
    sourceContext.filter = "saturate(1.2) brightness(1.12) contrast(1.04)";
    sourceContext.drawImage(
      image,
      (width - drawWidth) * 0.5,
      (height - drawHeight) * 0.5,
      drawWidth,
      drawHeight,
    );
    sourceContext.filter = "none";
    const pixels = sourceContext.getImageData(0, 0, width, height).data;
    cells.forEach((cell) => {
      const sampleX = Math.min(width - 1, cell.x * cellSize + Math.floor(cellSize * 0.5));
      const sampleY = Math.min(height - 1, cell.y * cellSize + Math.floor(cellSize * 0.5));
      const offset = (sampleY * width + sampleX) * 4;
      const red = Math.min(255, pixels[offset] + 24);
      const green = Math.min(255, pixels[offset + 1] + 24);
      const blue = Math.min(255, pixels[offset + 2] + 24);
      const quantize = (value) => Math.min(
        PARTICLE_COLOR_STEPS - 1,
        Math.round((value / 255) * (PARTICLE_COLOR_STEPS - 1)),
      );
      cell.particleColorIndex = (
        quantize(red) * PARTICLE_COLOR_STEPS * PARTICLE_COLOR_STEPS
        + quantize(green) * PARTICLE_COLOR_STEPS
        + quantize(blue)
      );
    });
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
    surface.dataset.pixelDisturbedTileSize = String(DEPLETION_TILE_SIZE);
    surface.dataset.pixelInteractionMode = "veyro-particle-image";
    surface.dataset.pixelFieldRadiusRatio = String(FIELD_RADIUS_RATIO);
    surface.dataset.pixelFieldRadius = String(Math.round(height * FIELD_RADIUS_RATIO));
    surface.dataset.pixelFieldStrength = String(FIELD_STRENGTH);
    surface.dataset.pixelFieldDecay = String(FIELD_DECAY);
    surface.dataset.pixelParticleDisperse = String(PARTICLE_DISPERSE);
    surface.dataset.pixelParticleLift = String(PARTICLE_LIFT);
    surface.dataset.pixelParticlePointSize = String(PARTICLE_POINT_SIZE);
    surface.dataset.pixelParticleColorMode = "source-rgb-lifted";
    surface.dataset.pixelParticleColorLift = "24";
    surface.dataset.pixelColorFreeCoreRatio = String(COLOR_FREE_CORE_RATIO);
    surface.dataset.pixelFieldEdge = "granular-depletion-no-core";
    surface.dataset.pixelVoidPaint = "none";
    surface.dataset.pixelFieldPath = "decaying-pointer-segment";
    surface.dataset.pixelParticleFlow = "coherent-noise";
    surface.dataset.pixelFieldCenterMode = "fixed-pointer";
    surface.dataset.pixelCenterOrbit = "0";
    surface.dataset.pixelFieldState = pointerEligible.matches ? "idle" : "disabled";
    surface.dataset.pixelMaxDisplacement = String(PARTICLE_DISPERSE);
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

  const regionForSegment = (segment, padding) => {
    if (!segment) return null;
    return clampRegion({
      left: Math.min(segment.from.x, segment.to.x) - padding,
      top: Math.min(segment.from.y, segment.to.y) - padding,
      right: Math.max(segment.from.x, segment.to.x) + padding,
      bottom: Math.max(segment.from.y, segment.to.y) + padding,
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

  const drawDisturbance = (now) => {
    const radius = height * FIELD_RADIUS_RATIO;
    fieldSegments = fieldSegments.filter((segment) => now - segment.createdAt < FIELD_SEGMENT_LIFETIME);

    const activeSegments = fieldSegments.map((segment) => ({
      ...segment,
      strength: Math.pow(FIELD_DECAY, ((now - segment.createdAt) / 1000) * 60),
    }));
    if (pointerAnchor) {
      activeSegments.push({
        from: pointerPrevious || pointerAnchor,
        to: pointerAnchor,
        strength: 1,
        isAnchor: true,
      });
    }

    const dirtyPadding = radius + PARTICLE_DISPERSE * 1.5 + PARTICLE_LIFT + cellSize;
    let currentDirty = null;
    activeSegments.forEach((segment) => {
      currentDirty = unionRegion(currentDirty, regionForSegment(segment, dirtyPadding));
    });
    const restoreRegion = clampRegion(unionRegion(previousDirty, currentDirty));
    if (restoreRegion) {
      context.clearRect(
        restoreRegion.left,
        restoreRegion.top,
        restoreRegion.right - restoreRegion.left,
        restoreRegion.bottom - restoreRegion.top,
      );
      if (!activeSegments.length) drawTextureRegion(restoreRegion);
    }
    previousDirty = currentDirty;

    if (!activeSegments.length || !sourceCanvas || !sourceContext) {
      surface.dataset.pixelDisturbedTiles = "0";
      surface.dataset.pixelExtractedTiles = "0";
      surface.dataset.pixelTrailPoints = "0";
      surface.dataset.pixelTrailSpan = "0";
      surface.dataset.pixelFieldState = "idle";
      surface.dataset.pixelFieldCenter = "";
      surface.dataset.pixelIdleMotion = "idle";
      return false;
    }

    const affected = new Map();
    activeSegments.forEach((segment) => {
      const sourceRegion = regionForSegment(segment, radius + cellSize);
      forEachCellInRegion(sourceRegion, (cell) => {
        const centerX = cell.x * cellSize + cellSize * 0.5;
        const centerY = cell.y * cellSize + cellSize * 0.5;
        const distance = distanceToSegment(centerX, centerY, segment.from, segment.to);
        if (distance >= radius) return;
        const level = Math.min(1, FIELD_STRENGTH * segment.strength * smoothstep(radius, 0, distance));
        const key = cell.y * columns + cell.x;
        const previous = affected.get(key);
        if (!previous) {
          affected.set(key, {
            cell,
            level,
          });
          return;
        }
        previous.level = Math.max(previous.level, level);
      });
    });

    const elapsed = now * 0.001;
    const particleBuckets = new Map();
    context.save();
    context.fillStyle = "#080b0e";
    affected.forEach(({ cell, level }) => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      const centerX = x + cellSize * 0.5;
      const centerY = y + cellSize * 0.5;
      const grain = hash(Math.floor(centerX / 3), Math.floor(centerY / 3));
      const eroded = smoothstep(0.02, 0.4, level * (0.72 + 0.62 * grain));
      // V3 keeps V2's granular source depletion but removes its filled
      // color-free core. The source remains visible between the tiny holes.
      context.globalAlpha = eroded * 0.96;
      context.fillRect(
        centerX - DEPLETION_TILE_SIZE * 0.5,
        centerY - DEPLETION_TILE_SIZE * 0.5,
        DEPLETION_TILE_SIZE,
        DEPLETION_TILE_SIZE,
      );

      const amplitude = level * level * (0.55 + 0.9 * cell.particleSeed);
      const waveX = Math.sin(centerX * 0.0107 + Math.cos(centerY * 0.0069 + elapsed * 0.19) * 1.7 + cell.seed * 5.2);
      const waveY = Math.cos(centerY * 0.0093 + Math.sin(centerX * 0.0077 - elapsed * 0.17) * 1.5 + cell.particleSeed * 4.8);
      const destinationX = centerX + waveX * amplitude * PARTICLE_DISPERSE;
      const destinationY = centerY + waveY * amplitude * PARTICLE_DISPERSE
        + amplitude * PARTICLE_LIFT * (0.35 + cell.particleSeed);
      const particleAlpha = smoothstep(0, 0.07, level) * (1 - smoothstep(0.5, 1, amplitude));
      if (particleAlpha <= 0.005) return;
      const particleSize = PARTICLE_POINT_SIZE;
      const alphaIndex = Math.min(
        PARTICLE_ALPHA_LEVELS.length - 1,
        Math.floor(particleAlpha * PARTICLE_ALPHA_LEVELS.length),
      );
      const colorIndex = cell.particleColorIndex;
      const bucketIndex = colorIndex * PARTICLE_ALPHA_LEVELS.length + alphaIndex;
      if (!particleBuckets.has(bucketIndex)) particleBuckets.set(bucketIndex, []);
      particleBuckets.get(bucketIndex).push(
        destinationX,
        destinationY,
        particleSize,
      );
    });
    particleBuckets.forEach((bucket, bucketIndex) => {
      const colorIndex = Math.floor(bucketIndex / PARTICLE_ALPHA_LEVELS.length);
      const alphaIndex = bucketIndex % PARTICLE_ALPHA_LEVELS.length;
      context.globalAlpha = PARTICLE_ALPHA_LEVELS[alphaIndex];
      context.fillStyle = PARTICLE_PALETTE[colorIndex];
      context.beginPath();
      for (let index = 0; index < bucket.length; index += 3) {
        context.moveTo(bucket[index] + bucket[index + 2] * 0.5, bucket[index + 1]);
        context.arc(bucket[index], bucket[index + 1], bucket[index + 2] * 0.5, 0, Math.PI * 2);
      }
      context.fill();
    });
    context.restore();

    if (pointerAnchor) pointerPrevious = { ...pointerAnchor };
    const trailSpan = fieldSegments.length
      ? Math.hypot(
        fieldSegments[fieldSegments.length - 1].to.x - fieldSegments[0].from.x,
        fieldSegments[fieldSegments.length - 1].to.y - fieldSegments[0].from.y,
      )
      : 0;
    surface.dataset.pixelDisturbedTiles = String(affected.size);
    surface.dataset.pixelExtractedTiles = String(affected.size);
    surface.dataset.pixelTrailPoints = String(fieldSegments.length);
    surface.dataset.pixelTrailSpan = String(Math.round(trailSpan));
    surface.dataset.pixelFieldState = "active";
    surface.dataset.pixelFieldCenter = pointerAnchor
      ? `${Math.round(pointerAnchor.x)},${Math.round(pointerAnchor.y)}`
      : "decaying";
    surface.dataset.pixelIdleMotion = "active";
    return affected.size > 0;
  };

  const renderInteractive = (now) => {
    frame = 0;
    if (reducedMotion.matches) {
      setStatic();
      return;
    }
    if (!complete || !visible || document.hidden || !pointerEligible.matches) {
      pointerAnchor = null;
      pointerPrevious = null;
      fieldSegments = [];
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
      pointerPrevious = null;
      surface.dataset.pixelFieldState = "idle";
      surface.dataset.pixelIdleMotion = "idle";
      if (!frame && previousDirty) frame = window.requestAnimationFrame(renderInteractive);
      return;
    }
    const nextPoint = { x, y };
    if (pointerAnchor && Math.hypot(x - pointerAnchor.x, y - pointerAnchor.y) >= 1) {
      fieldSegments.push({
        from: { ...pointerAnchor },
        to: nextPoint,
        createdAt: performance.now(),
      });
      if (fieldSegments.length > FIELD_SEGMENT_LIMIT) {
        fieldSegments.splice(0, fieldSegments.length - FIELD_SEGMENT_LIMIT);
      }
      pointerPrevious = { ...pointerAnchor };
    }
    pointerAnchor = nextPoint;
    surface.dataset.pixelPointer = "active";
    surface.dataset.pixelFieldState = "active";
    surface.dataset.pixelIdleMotion = "active";
    if (!frame) frame = window.requestAnimationFrame(renderInteractive);
  };

  const clearPointer = () => {
    pointerAnchor = null;
    pointerPrevious = null;
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
      fieldSegments = [];
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
    fieldSegments = [];
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
    fieldSegments = [];
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
