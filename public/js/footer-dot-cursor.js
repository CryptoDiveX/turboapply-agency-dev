(() => {
  "use strict";

  const SELECTOR = "footer[data-footer-dot-cursor]";
  const QUERY = "(hover: hover) and (pointer: fine) and (min-width: 481px) and (prefers-reduced-motion: no-preference)";
  const DOT_COUNT = 20;
  const DOT_SIZE = 26;

  const initialize = () => {
    const footer = document.querySelector(SELECTOR);
    const capability = window.matchMedia(QUERY);
    if (!footer || !capability.matches || document.querySelector(".footer-dot-cursor")) return;

    const filter = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    filter.setAttribute("class", "footer-dot-cursor-filter");
    filter.setAttribute("aria-hidden", "true");
    filter.innerHTML = `
      <filter id="footer-dot-cursor-goo" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"></feGaussianBlur>
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"></feColorMatrix>
        <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
      </filter>`;

    const cursor = document.createElement("div");
    cursor.className = "footer-dot-cursor";
    cursor.setAttribute("aria-hidden", "true");

    const dots = Array.from({ length: DOT_COUNT }, (_, index) => {
      const element = document.createElement("span");
      const scale = 1 - index * 0.05;
      element.style.transform = `translate3d(${-DOT_SIZE / 2}px, ${-DOT_SIZE / 2}px, 0) scale(${scale})`;
      cursor.appendChild(element);
      return { element, x: 0, y: 0, scale };
    });

    document.body.append(filter, cursor);
    document.documentElement.classList.add("footer-dot-cursor-ready");

    let active = false;
    let frame = 0;
    const target = { x: 0, y: 0 };

    const render = () => {
      if (!active) {
        frame = 0;
        return;
      }

      dots.forEach((dot, index) => {
        const leader = index === 0 ? target : dots[index - 1];
        const easing = index === 0 ? 0.92 : Math.max(0.2, 0.36 - index * 0.006);
        dot.x += (leader.x - dot.x) * easing;
        dot.y += (leader.y - dot.y) * easing;
        dot.element.style.transform = `translate3d(${dot.x - DOT_SIZE / 2}px, ${dot.y - DOT_SIZE / 2}px, 0) scale(${dot.scale})`;
      });

      frame = window.requestAnimationFrame(render);
    };

    const seed = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      dots.forEach((dot) => {
        dot.x = target.x;
        dot.y = target.y;
      });
    };

    footer.addEventListener("pointerenter", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      seed(event);
      active = true;
      footer.classList.add("footer-dot-cursor-active");
      cursor.classList.add("is-visible");
      if (!frame) frame = window.requestAnimationFrame(render);
    });

    footer.addEventListener("pointermove", (event) => {
      if (!active) return;
      target.x = event.clientX;
      target.y = event.clientY;
    });

    const deactivate = () => {
      active = false;
      footer.classList.remove("footer-dot-cursor-active");
      cursor.classList.remove("is-visible");
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };

    footer.addEventListener("pointerleave", deactivate);
    window.addEventListener("blur", deactivate);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) deactivate();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
