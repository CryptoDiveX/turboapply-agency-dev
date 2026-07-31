(() => {
  "use strict";

  const surface = document.querySelector("[data-home-pixel-reveal]");
  const canvas = surface?.querySelector("[data-home-pixel-canvas]");
  const image = surface?.querySelector("img");
  if (!(surface instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(image instanceof HTMLImageElement)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const context = canvas.getContext("2d", { alpha: true });
  if (!context || reducedMotion.matches || saveData) {
    document.documentElement.classList.add("home-pixel-reveal-static");
    surface.dataset.pixelState = "static";
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

  const hash = (x, y) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
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

  const render = (now) => {
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
      frame = window.requestAnimationFrame(render);
      return;
    }
    complete = true;
    surface.dataset.pixelState = "complete";
    document.documentElement.classList.add("home-pixel-reveal-complete");
    drawTexture();
  };

  const start = () => {
    if (started) return;
    started = true;
    configure();
    surface.dataset.pixelState = "running";
    startTime = performance.now() + 120;
    frame = window.requestAnimationFrame(render);
  };

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    if (image.complete) start();
    else image.addEventListener("load", start, { once: true });
  }, { threshold: 0.12 });
  observer.observe(surface);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!started) return;
      if (frame) window.cancelAnimationFrame(frame);
      configure();
      if (complete) drawTexture();
      else {
        startTime = performance.now();
        frame = window.requestAnimationFrame(render);
      }
    }, 140);
  }, { passive: true });

  surface.dataset.pixelState = "ready";
})();
