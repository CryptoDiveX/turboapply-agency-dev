(() => {
  'use strict';

  const VERSION = 'reflection-cover-water-disturbance-20260813-1';
  const surfaces = [...document.querySelectorAll('[data-reflection-cover-demo]')];
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wideEnough = window.matchMedia('(min-width: 701px)');
  const motionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)');
  const queries = [finePointer, wideEnough, motionAllowed];
  const TAU = Math.PI * 2;

  if (!surfaces.length) return;

  const canAnimate = () => queries.every((query) => query.matches) && !navigator.connection?.saveData;

  const makeField = (columns, rows) => ({
    columns,
    rows,
    current: new Float32Array(columns * rows),
    previous: new Float32Array(columns * rows),
    velocity: new Float32Array(columns * rows),
  });

  const setup = (surface) => {
    const canvas = surface.querySelector('[data-reflection-cover-canvas]');
    const image = surface.querySelector('img');
    if (!canvas || !image) return null;

    const ctx = canvas.getContext('2d', { alpha: false });
    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d', { alpha: false });
    if (!ctx || !baseCtx) return null;

    surface.dataset.reflectionCoverVersion = VERSION;
    surface.dataset.reflectionWaterState = 'loading';
    surface.dataset.reflectionWaterMode = 'damped-heightmap-flow';

    let frame = 0;
    let running = false;
    let visible = false;
    let ready = false;
    let dpr = 1;
    let field = makeField(96, 54);
    const pointer = {
      x: 0.5,
      y: 0.5,
      px: 0.5,
      py: 0.5,
      active: false,
      lastPaintedAt: 0,
    };

    const coverSourceRect = (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = targetWidth / targetHeight;
      if (sourceRatio > targetRatio) {
        const width = sourceHeight * targetRatio;
        return { sx: (sourceWidth - width) / 2, sy: 0, sw: width, sh: sourceHeight };
      }
      const height = sourceWidth / targetRatio;
      return { sx: 0, sy: (sourceHeight - height) / 2, sw: sourceWidth, sh: height };
    };

    const size = () => {
      const rect = surface.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        base.width = width;
        base.height = height;
        const source = coverSourceRect(image.naturalWidth || image.width, image.naturalHeight || image.height, width, height);
        baseCtx.drawImage(image, source.sx, source.sy, source.sw, source.sh, 0, 0, width, height);
        const columns = Math.max(72, Math.min(132, Math.round(width / 12)));
        const rows = Math.max(40, Math.min(78, Math.round(height / 12)));
        field = makeField(columns, rows);
      }
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      return { width, height };
    };

    const injectDisturbance = (x, y, previousX, previousY, strength = 1) => {
      const { columns, rows, current } = field;
      const steps = Math.max(1, Math.ceil(Math.hypot(x - previousX, y - previousY) * 26));
      const radius = Math.max(3, Math.round(Math.min(columns, rows) * 0.055));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const gx = (previousX + (x - previousX) * t) * (columns - 1);
        const gy = (previousY + (y - previousY) * t) * (rows - 1);
        const minX = Math.max(1, Math.floor(gx - radius));
        const maxX = Math.min(columns - 2, Math.ceil(gx + radius));
        const minY = Math.max(1, Math.floor(gy - radius));
        const maxY = Math.min(rows - 2, Math.ceil(gy + radius));
        for (let yy = minY; yy <= maxY; yy += 1) {
          for (let xx = minX; xx <= maxX; xx += 1) {
            const dx = xx - gx;
            const dy = yy - gy;
            const distance = Math.sqrt(dx * dx + dy * dy) / radius;
            if (distance > 1) continue;
            const falloff = (1 - distance) * (1 - distance);
            const wake = Math.sin((1 - distance) * Math.PI) * falloff * strength;
            current[yy * columns + xx] += wake * (step === steps ? 0.9 : 0.42);
          }
        }
      }
      pointer.lastPaintedAt = performance.now();
    };

    const simulate = () => {
      const { columns, rows, current, velocity } = field;
      for (let y = 1; y < rows - 1; y += 1) {
        for (let x = 1; x < columns - 1; x += 1) {
          const index = y * columns + x;
          const laplacian = (
            current[index - 1] +
            current[index + 1] +
            current[index - columns] +
            current[index + columns]
          ) * 0.25 - current[index];
          velocity[index] = Math.max(-1.2, Math.min(1.2, (velocity[index] + laplacian * 0.28) * 0.928));
        }
      }
      for (let i = 0; i < current.length; i += 1) {
        current[i] = Math.max(-2.2, Math.min(2.2, (current[i] + velocity[i]) * 0.992));
      }
    };

    const sample = (x, y) => {
      const { columns, rows, current } = field;
      const gx = Math.max(1, Math.min(columns - 2, x));
      const gy = Math.max(1, Math.min(rows - 2, y));
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const tx = gx - x0;
      const ty = gy - y0;
      const a = current[y0 * columns + x0];
      const b = current[y0 * columns + x1];
      const c = current[y1 * columns + x0];
      const d = current[y1 * columns + x1];
      return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    };

    const drawDisplacedImage = (time) => {
      const { width, height } = size();
      const { columns, rows, current } = field;
      const tileW = width / columns;
      const tileH = height / rows;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(base, 0, 0);
      ctx.save();
      ctx.globalAlpha = 0.9;
      const step = Math.max(8, Math.round(Math.min(width, height) / 72));
      for (let y = 0; y < height; y += step) {
        const gy = (y / height) * (rows - 1);
        for (let x = 0; x < width; x += step) {
          const gx = (x / width) * (columns - 1);
          const h = sample(gx, gy);
          if (Math.abs(h) < 0.012) continue;
          const hx = sample(gx + 1, gy) - sample(gx - 1, gy);
          const hy = sample(gx, gy + 1) - sample(gx, gy - 1);
          const offsetX = Math.max(-16, Math.min(16, hx * width * 0.12));
          const offsetY = Math.max(-16, Math.min(16, hy * height * 0.12));
          const sx = Math.max(0, Math.min(width - step, x + offsetX));
          const sy = Math.max(0, Math.min(height - step, y + offsetY));
          ctx.drawImage(base, sx, sy, step, step, x, y, step + 0.5, step + 0.5);
        }
      }
      ctx.globalCompositeOperation = 'screen';
      const age = Math.min(1, (performance.now() - pointer.lastPaintedAt) / 1600);
      const glowAlpha = pointer.active ? 0.24 : Math.max(0, 0.18 * (1 - age));
      if (glowAlpha > 0) {
        const cx = pointer.x * width;
        const cy = pointer.y * height;
        const shimmer = Math.sin((time || 0) / 420) * 0.03;
        const radiusBase = Math.min(width, height) * (0.10 + shimmer);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * (0.26 + shimmer));
        gradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha * 0.95})`);
        gradient.addColorStop(0.30, `rgba(189, 245, 255, ${glowAlpha * 0.70})`);
        gradient.addColorStop(0.58, `rgba(250, 205, 255, ${glowAlpha * 0.50})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.globalAlpha = Math.min(0.55, glowAlpha * 1.8);
        ctx.lineWidth = Math.max(1.2, Math.min(width, height) * 0.0035);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.filter = `blur(${Math.max(0.7, Math.min(width, height) * 0.0015)}px)`;
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = radiusBase * (1 + ring * 0.48 + ((time || 0) % 900) / 900 * 0.18);
          ctx.beginPath();
          ctx.ellipse(cx, cy, radius * 1.24, radius * 0.72, -0.34, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();

      let energy = 0;
      for (let i = 0; i < current.length; i += 17) energy += Math.abs(current[i]);
      surface.dataset.reflectionDisturbanceEnergy = energy.toFixed(3);
      surface.dataset.reflectionPointerActive = pointer.active ? 'true' : 'false';
      surface.dataset.reflectionWaterColumns = String(columns);
      surface.dataset.reflectionWaterRows = String(rows);
    };

    const draw = (time) => {
      if (!running || !ready || !visible || !canAnimate()) {
        frame = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        surface.dataset.reflectionWaterState = canAnimate() ? 'idle' : 'static-fallback';
        return;
      }
      if (pointer.active) {
        const wobbleX = pointer.x + Math.sin(time / 620) * 0.003;
        const wobbleY = pointer.y + Math.cos(time / 700) * 0.003;
        injectDisturbance(wobbleX, wobbleY, pointer.x, pointer.y, 0.19);
      }
      simulate();
      drawDisplacedImage(time);
      surface.dataset.reflectionWaterState = 'running';
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || !ready || !visible || !canAnimate()) return;
      running = true;
      size();
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      surface.dataset.reflectionWaterState = ready ? 'idle' : 'loading';
    };

    const sync = () => (canAnimate() && visible && ready ? start() : stop());

    const move = (event) => {
      if (!canAnimate()) return;
      const rect = surface.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      injectDisturbance(x, y, pointer.x, pointer.y, 1);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      surface.style.setProperty('--reflection-x', `${Math.round(x * 100)}%`);
      surface.style.setProperty('--reflection-y', `${Math.round(y * 100)}%`);
      sync();
    };

    const leave = () => {
      pointer.active = false;
      surface.dataset.reflectionPointerActive = 'false';
    };

    const prepare = () => {
      if (!image.complete || image.naturalWidth <= 0) return;
      ready = true;
      surface.dataset.reflectionWaterReady = 'true';
      size();
      drawDisplacedImage(0);
      sync();
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    }, { threshold: 0.08 });
    observer.observe(surface);

    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerleave', leave, { passive: true });
    surface.addEventListener('pointercancel', leave, { passive: true });
    window.addEventListener('resize', () => { if (ready) { size(); sync(); } }, { passive: true });
    document.addEventListener('visibilitychange', sync);
    queries.forEach((query) => query.addEventListener('change', sync));

    if (image.complete) prepare(); else image.addEventListener('load', prepare, { once: true });

    surface.__reflectionWaterDisturbance = {
      version: VERSION,
      get ready() { return ready; },
      get running() { return running; },
      get mode() { return surface.dataset.reflectionWaterMode; },
      get energy() { return Number(surface.dataset.reflectionDisturbanceEnergy || 0); },
      get columns() { return field.columns; },
      get rows() { return field.rows; },
      disturbForQa(x = 0.5, y = 0.5, strength = 1) {
        injectDisturbance(x, y, pointer.x, pointer.y, strength);
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        for (let i = 0; i < 4; i += 1) simulate();
        drawDisplacedImage(performance.now());
        return Number(surface.dataset.reflectionDisturbanceEnergy || 0);
      },
    };

    return { stop };
  };

  const instances = surfaces.map(setup).filter(Boolean);
  window.__turboapplyReflectionWaterDisturbance = {
    version: VERSION,
    instances,
  };
  window.addEventListener('pagehide', () => instances.forEach((instance) => instance.stop()));
})();
