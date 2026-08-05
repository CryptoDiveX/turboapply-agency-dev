(() => {
  'use strict';

  const VERSION = 'white-cover-pointer-20260806-1';
  const surfaces = [...document.querySelectorAll('[data-white-cover-pointer]')];
  const capability = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 769px) and (prefers-reduced-motion: no-preference)');

  if (!surfaces.length || !capability.matches) return;

  const pointer = document.createElement('div');
  pointer.className = 'white-cover-pointer';
  pointer.dataset.whiteCoverPointerVersion = VERSION;
  pointer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pointer);
  document.documentElement.classList.add('white-cover-pointer-ready');

  let frame = 0;
  let x = -100;
  let y = -100;
  let activeSurface = null;

  const render = () => {
    frame = 0;
    pointer.style.transform = `translate3d(${x - 41}px, ${y - 41}px, 0)`;
  };

  const move = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  const activate = (surface, event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    activeSurface = surface;
    move(event);
    surface.dataset.whiteCoverPointerActive = 'true';
    pointer.classList.add('is-visible');
  };

  const deactivate = () => {
    if (activeSurface) activeSurface.dataset.whiteCoverPointerActive = 'false';
    activeSurface = null;
    pointer.classList.remove('is-visible');
  };

  surfaces.forEach((surface) => {
    surface.dataset.whiteCoverPointerVersion = VERSION;
    surface.dataset.whiteCoverPointerSize = '82';
    surface.addEventListener('pointerenter', (event) => activate(surface, event));
    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerleave', deactivate);
    surface.addEventListener('pointercancel', deactivate);
  });

  window.addEventListener('blur', deactivate);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) deactivate();
  });
})();
