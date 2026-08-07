(() => {
  'use strict';

  const VERSION = 'web-surface-cursor-excludes-20260807-1';
  const DOT_SIZE = 40;
  const DOT_COUNT = 14;
  const surfaces = Array.from(document.querySelectorAll('[data-web-surface-cursor]'));
  const eligibilityQueries = [
    window.matchMedia('(hover: hover) and (pointer: fine)'),
    window.matchMedia('(min-width: 481px)'),
    window.matchMedia('(prefers-reduced-motion: no-preference)'),
  ];
  const isEligible = () => eligibilityQueries.every((query) => query.matches);
  const isExcludedTarget = (target) => (
    target instanceof Element && Boolean(target.closest('[data-web-surface-cursor-exclude]'))
  );

  if (surfaces.length === 0) return;

  let teardown = null;

  const mount = () => {
    if (document.querySelector('.web-surface-cursor')) return null;

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    filter.setAttribute('class', 'web-surface-cursor-filter');
    filter.setAttribute('aria-hidden', 'true');
    filter.innerHTML = `
      <filter id="web-surface-cursor-goo" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"></feGaussianBlur>
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"></feColorMatrix>
        <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
      </filter>`;

    const cursor = document.createElement('div');
    cursor.className = 'web-surface-cursor';
    cursor.dataset.webSurfaceCursorVersion = VERSION;
    cursor.setAttribute('aria-hidden', 'true');
    const dots = Array.from({ length: DOT_COUNT }, (_, dotIndex) => {
      const element = document.createElement('span');
      const scale = Math.max(0.22, 1 - dotIndex * 0.06);
      cursor.appendChild(element);
      return { element, x: 0, y: 0, scale };
    });

    document.body.append(filter, cursor);
    document.documentElement.classList.add('web-surface-cursor-ready');

    let activeSurface = null;
    let frame = 0;
    const target = { x: 0, y: 0 };

    const seed = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      dots.forEach((dot) => {
        dot.x = target.x;
        dot.y = target.y;
      });
    };

    const render = () => {
      if (!isEligible()) {
        frame = 0;
        queueMicrotask(synchronize);
        return;
      }
      if (!activeSurface) {
        frame = 0;
        return;
      }
      dots.forEach((dot, dotIndex) => {
        const leader = dotIndex === 0 ? target : dots[dotIndex - 1];
        const easing = dotIndex === 0 ? 0.92 : Math.max(0.2, 0.37 - dotIndex * 0.008);
        dot.x += (leader.x - dot.x) * easing;
        dot.y += (leader.y - dot.y) * easing;
        dot.element.style.transform = `translate3d(${dot.x - DOT_SIZE / 2}px, ${dot.y - DOT_SIZE / 2}px, 0) scale(${dot.scale})`;
      });
      frame = requestAnimationFrame(render);
    };

    const deactivate = () => {
      if (activeSurface) {
        activeSurface.classList.remove('web-surface-cursor-active');
        activeSurface.dataset.webSurfaceCursorActive = 'false';
      }
      activeSurface = null;
      cursor.classList.remove('is-visible');
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const surfaceHandlers = surfaces.map((surface) => {
      const enter = (event) => {
        if (!isEligible() || isExcludedTarget(event.target) || (event.pointerType && event.pointerType !== 'mouse')) return;
        if (activeSurface && activeSurface !== surface) {
          activeSurface.classList.remove('web-surface-cursor-active');
          activeSurface.dataset.webSurfaceCursorActive = 'false';
        }
        activeSurface = surface;
        seed(event);
        surface.classList.add('web-surface-cursor-active');
        surface.dataset.webSurfaceCursorActive = 'true';
        cursor.classList.add('is-visible');
        if (!frame) frame = requestAnimationFrame(render);
      };
      const move = (event) => {
        if (isExcludedTarget(event.target)) {
          if (activeSurface === surface) deactivate();
          return;
        }
        if (activeSurface !== surface) {
          enter(event);
          return;
        }
        target.x = event.clientX;
        target.y = event.clientY;
      };
      surface.addEventListener('pointerenter', enter);
      surface.addEventListener('pointermove', move);
      surface.addEventListener('pointerleave', deactivate);
      surface.addEventListener('pointercancel', deactivate);
      return { surface, enter, move };
    });

    const handleVisibility = () => {
      if (document.hidden) deactivate();
    };
    window.addEventListener('blur', deactivate);
    window.addEventListener('pointercancel', deactivate);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      deactivate();
      surfaceHandlers.forEach(({ surface, enter, move }) => {
        surface.removeEventListener('pointerenter', enter);
        surface.removeEventListener('pointermove', move);
        surface.removeEventListener('pointerleave', deactivate);
        surface.removeEventListener('pointercancel', deactivate);
      });
      window.removeEventListener('blur', deactivate);
      window.removeEventListener('pointercancel', deactivate);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.documentElement.classList.remove('web-surface-cursor-ready');
      cursor.remove();
      filter.remove();
    };
  };

  const synchronize = () => {
    if (isEligible() && !teardown) {
      teardown = mount();
    } else if (!isEligible() && teardown) {
      teardown();
      teardown = null;
    }
  };

  surfaces.forEach((surface) => {
    surface.dataset.webSurfaceCursorVersion = VERSION;
    surface.dataset.webSurfaceCursorDotSize = String(DOT_SIZE);
    surface.dataset.webSurfaceCursorDotCount = String(DOT_COUNT);
    surface.dataset.webSurfaceCursorMotion = 'website-hero-parity';
    surface.dataset.webSurfaceCursorActive = 'false';
  });
  eligibilityQueries.forEach((query) => query.addEventListener('change', synchronize));
  window.addEventListener('resize', synchronize, { passive: true });
  window.addEventListener('pagehide', () => {
    if (teardown) teardown();
    teardown = null;
  });
  synchronize();
})();
