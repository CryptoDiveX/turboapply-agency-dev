(() => {
  'use strict';

  const VERSION = 'reflection-cover-animation-20260807-2';
  const surfaces = [...document.querySelectorAll('[data-reflection-cover-demo]')];
  const mediaQueries = [
    window.matchMedia('(hover: hover) and (pointer: fine)'),
    window.matchMedia('(min-width: 701px)'),
    window.matchMedia('(prefers-reduced-motion: no-preference)'),
  ];
  const eligible = () => mediaQueries.every((query) => query.matches) && !navigator.connection?.saveData;
  if (!surfaces.length) return;

  const setup = (surface) => {
    const canvas = surface.querySelector('[data-reflection-cover-canvas]');
    const image = surface.querySelector('img');
    const cursor = surface.querySelector('[data-reflection-cover-cursor]');
    const expand = surface.querySelector('[data-reflection-cover-expand]');
    if (!canvas || !image || !cursor || !expand) return null;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    surface.dataset.reflectionCoverVersion = VERSION;
    surface.dataset.reflectionCoverState = 'idle';
    surface.dataset.reflectionFullscreen = 'false';

    let frame = 0;
    let running = false;
    let visible = false;
    let inside = false;
    const pointer = { x: 0.5, y: 0.46, targetX: 0.5, targetY: 0.46 };

    const size = () => {
      const rect = surface.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      return { width, height };
    };

    const setPointerVars = () => {
      surface.style.setProperty('--reflection-x', `${Math.round(pointer.x * 1000) / 10}%`);
      surface.style.setProperty('--reflection-y', `${Math.round(pointer.y * 1000) / 10}%`);
      cursor.style.setProperty('--reflection-cursor-x', `${Math.round(pointer.x * 1000) / 10}%`);
      cursor.style.setProperty('--reflection-cursor-y', `${Math.round(pointer.y * 1000) / 10}%`);
    };

    const draw = (time) => {
      if (!running || !eligible() || !visible) {
        frame = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        surface.dataset.reflectionCoverState = eligible() ? 'idle' : 'static';
        return;
      }

      const { width, height } = size();
      pointer.x += (pointer.targetX - pointer.x) * 0.095;
      pointer.y += (pointer.targetY - pointer.y) * 0.095;
      setPointerVars();

      const phase = (time % 5600) / 5600;
      const wave = Math.sin(phase * Math.PI * 2);
      const drift = Math.cos(phase * Math.PI * 2);
      const play = surface.classList.contains('is-reflection-fullscreen') ? 1.18 : 1;
      const centerX = width * (0.16 + pointer.x * 0.72 + wave * 0.035);
      const centerY = height * (0.14 + pointer.y * 0.62 + drift * 0.024);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      const band = ctx.createLinearGradient(centerX - width * 0.42, centerY + height * 0.36, centerX + width * 0.40, centerY - height * 0.36);
      band.addColorStop(0.00, 'rgba(255,255,255,0)');
      band.addColorStop(0.36, 'rgba(255,255,255,0)');
      band.addColorStop(0.44, 'rgba(186,244,255,0.34)');
      band.addColorStop(0.50, 'rgba(255,255,255,0.62)');
      band.addColorStop(0.56, 'rgba(221,184,255,0.36)');
      band.addColorStop(0.64, 'rgba(255,225,250,0.22)');
      band.addColorStop(0.76, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.62 * play;
      ctx.fillStyle = band;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.42 + wave * 0.055);
      ctx.translate(-centerX, -centerY);
      ctx.filter = `blur(${Math.max(10, width * 0.015)}px)`;
      ctx.fillRect(-width * 0.12, -height * 0.18, width * 1.24, height * 1.36);
      ctx.restore();

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.42);
      halo.addColorStop(0, 'rgba(255,255,255,0.24)');
      halo.addColorStop(0.34, 'rgba(198,248,255,0.18)');
      halo.addColorStop(0.62, 'rgba(226,190,255,0.13)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.filter = 'blur(5px)';
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      surface.dataset.reflectionCoverState = inside ? 'playing' : 'idle';
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || !eligible() || !visible) return;
      running = true;
      cursor.hidden = false;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cursor.hidden = true;
      surface.dataset.reflectionCoverState = eligible() ? 'idle' : 'static';
    };

    const sync = () => (eligible() && visible ? start() : stop());

    const updateFromEvent = (event) => {
      const rect = surface.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.targetY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      inside = true;
      surface.classList.add('is-reflection-pointer-active');
      sync();
    };

    const leave = () => {
      inside = false;
      pointer.targetX = 0.5;
      pointer.targetY = 0.46;
      surface.classList.remove('is-reflection-pointer-active');
    };

    const setExpanded = (expanded) => {
      surface.classList.toggle('is-reflection-fullscreen', expanded);
      document.body.classList.toggle('is-reflection-cover-open', expanded);
      surface.dataset.reflectionFullscreen = expanded ? 'true' : 'false';
      expand.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      expand.textContent = expanded ? 'Close full screen' : 'Play full screen';
      expand.setAttribute('aria-label', expanded ? 'Close full screen reflection animation' : 'Expand reflection animation to full screen');
      size();
      sync();
      if (expanded) expand.focus({ preventScroll: true });
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    }, { threshold: 0.08 });
    observer.observe(surface);

    surface.addEventListener('pointermove', updateFromEvent, { passive: true });
    surface.addEventListener('pointerenter', updateFromEvent, { passive: true });
    surface.addEventListener('pointerleave', leave, { passive: true });
    surface.addEventListener('pointercancel', leave, { passive: true });
    expand.addEventListener('click', () => setExpanded(!surface.classList.contains('is-reflection-fullscreen')));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && surface.classList.contains('is-reflection-fullscreen')) setExpanded(false);
    });
    mediaQueries.forEach((query) => query.addEventListener('change', sync));
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('blur', leave);
    document.addEventListener('visibilitychange', sync);
    if (image.complete) sync(); else image.addEventListener('load', sync, { once: true });

    return { stop: () => { setExpanded(false); stop(); } };
  };

  const instances = surfaces.map(setup).filter(Boolean);
  window.__turboapplyReflectionCover = { version: VERSION, instances };
  window.addEventListener('pagehide', () => instances.forEach((instance) => instance.stop()));
})();
