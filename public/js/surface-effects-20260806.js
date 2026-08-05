(() => {
  'use strict';

  const VERSION = 'white-cover-pointer-20260806-2';
  const QUERY = '(hover: hover) and (pointer: fine) and (min-width: 769px) and (prefers-reduced-motion: no-preference)';
  const surfaces = [...document.querySelectorAll('[data-white-cover-pointer]')];
  const capability = window.matchMedia(QUERY);

  if (!surfaces.length) return;

  let pointer = null;
  let frame = 0;
  let x = -100;
  let y = -100;
  let activeSurface = null;

  const render = () => {
    frame = 0;
    if (!pointer) return;
    pointer.style.transform = `translate3d(${x - 41}px, ${y - 41}px, 0)`;
  };

  const move = (event) => {
    if (!pointer || !capability.matches || (event.pointerType && event.pointerType !== 'mouse')) return;
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  const deactivate = () => {
    if (activeSurface) activeSurface.dataset.whiteCoverPointerActive = 'false';
    activeSurface = null;
    if (pointer) pointer.classList.remove('is-visible');
  };

  const activate = (surface, event) => {
    if (!pointer || !capability.matches || (event.pointerType && event.pointerType !== 'mouse')) return;
    activeSurface = surface;
    move(event);
    surface.dataset.whiteCoverPointerActive = 'true';
    pointer.classList.add('is-visible');
  };

  const enable = () => {
    if (pointer || !capability.matches) return;
    pointer = document.createElement('div');
    pointer.className = 'white-cover-pointer';
    pointer.dataset.whiteCoverPointerVersion = VERSION;
    pointer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pointer);
    document.documentElement.classList.add('white-cover-pointer-ready');
  };

  const disable = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    deactivate();
    if (pointer) pointer.remove();
    pointer = null;
    x = -100;
    y = -100;
    document.documentElement.classList.remove('white-cover-pointer-ready');
  };

  const syncCapability = () => {
    if (capability.matches) enable();
    else disable();
  };

  surfaces.forEach((surface) => {
    surface.dataset.whiteCoverPointerVersion = VERSION;
    surface.dataset.whiteCoverPointerSize = '82';
    surface.dataset.whiteCoverPointerLifecycle = 'media-query';
    surface.addEventListener('pointerenter', (event) => activate(surface, event));
    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerleave', deactivate);
    surface.addEventListener('pointercancel', deactivate);
  });

  window.addEventListener('blur', deactivate);
  window.addEventListener('pagehide', disable);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) deactivate();
  });
  if (typeof capability.addEventListener === 'function') capability.addEventListener('change', syncCapability);
  else capability.addListener(syncCapability);
  syncCapability();
})();
