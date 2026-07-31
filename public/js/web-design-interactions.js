(() => {
  "use strict";

  const initializeProofRail = () => {
    const viewport = document.querySelector(".web-proof-viewport");
    const rail = viewport?.querySelector(".web-proof-rail");
    const previous = document.querySelector("[data-web-proof-previous]");
    const next = document.querySelector("[data-web-proof-next]");
    const cards = rail ? Array.from(rail.querySelectorAll(".web-proof-card")) : [];
    if (!viewport || !rail || !previous || !next || cards.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0;
    let scrollFrame = 0;

    const geometry = () => {
      const first = cards[0].getBoundingClientRect();
      const styles = getComputedStyle(rail);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const step = first.width + gap;
      const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / step));
      return { step, visible, max: Math.max(0, cards.length - visible) };
    };

    const update = () => {
      const { max } = geometry();
      index = Math.min(Math.max(index, 0), max);
      previous.disabled = index <= 0;
      next.disabled = index >= max;
      viewport.dataset.railIndex = String(index);
    };

    const move = (requestedIndex) => {
      const { step, max } = geometry();
      index = Math.min(Math.max(requestedIndex, 0), max);
      viewport.scrollTo({ left: index * step, behavior: reducedMotion.matches ? "auto" : "smooth" });
      update();
    };

    previous.addEventListener("click", () => move(index - 1));
    next.addEventListener("click", () => move(index + 1));
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(index + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        move(0);
      } else if (event.key === "End") {
        event.preventDefault();
        move(cards.length);
      }
    });
    viewport.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const { step } = geometry();
        if (step > 0) index = Math.round(viewport.scrollLeft / step);
        update();
      });
    }, { passive: true });
    window.addEventListener("resize", () => move(index), { passive: true });
    update();
  };

  const initializeWebsiteLossCalculator = () => {
    const calculator = document.querySelector("[data-website-loss-calculator]");
    if (!calculator) return;

    const averageValue = calculator.querySelector("[data-loss-average-value]");
    const monthlyOpportunities = calculator.querySelector("[data-loss-monthly-opportunities]");
    const monthlyOpportunitiesRange = calculator.querySelector("[data-loss-monthly-opportunities-range]");
    const lossRate = calculator.querySelector("[data-loss-rate]");
    const lossRateRange = calculator.querySelector("[data-loss-rate-range]");
    const conversion = calculator.querySelector("[data-loss-conversion]");
    const conversionRange = calculator.querySelector("[data-loss-conversion-range]");
    const annualOutput = calculator.querySelector("[data-loss-annual]");
    const monthlyOutput = calculator.querySelector("[data-loss-monthly]");
    const customerOutput = calculator.querySelector("[data-loss-customers]");
    const summaryRate = calculator.querySelector("[data-loss-summary-rate]");
    const summaryConversion = calculator.querySelector("[data-loss-summary-conversion]");
    const required = [averageValue, monthlyOpportunities, monthlyOpportunitiesRange, lossRate, lossRateRange, conversion, conversionRange, annualOutput, monthlyOutput, customerOutput, summaryRate, summaryConversion];
    if (required.some((element) => !element)) return;

    const currency = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    const clampInput = (input) => {
      const minimum = Number.parseFloat(input.min);
      const maximum = Number.parseFloat(input.max);
      const parsed = Number.parseFloat(input.value);
      const safe = Number.isFinite(parsed) ? parsed : (Number.isFinite(minimum) ? minimum : 0);
      return Math.min(Number.isFinite(maximum) ? maximum : safe, Math.max(Number.isFinite(minimum) ? minimum : safe, safe));
    };

    const calculate = () => {
      const average = clampInput(averageValue);
      const opportunities = clampInput(monthlyOpportunities);
      const lostShare = clampInput(lossRate) / 100;
      const customerShare = clampInput(conversion) / 100;
      const customers = opportunities * lostShare * customerShare;
      const monthlyRevenue = customers * average;
      const annualRevenue = monthlyRevenue * 12;

      annualOutput.textContent = currency.format(annualRevenue);
      monthlyOutput.textContent = currency.format(monthlyRevenue);
      customerOutput.textContent = customers >= 10 ? Math.round(customers).toLocaleString("en-US") : customers.toLocaleString("en-US", { maximumFractionDigits: 1 });
      summaryRate.textContent = `${Math.round(lostShare * 100)}%`;
      summaryConversion.textContent = `${Math.round(customerShare * 100)}%`;
      calculator.dataset.calculatorReady = "true";
    };

    const connectPair = (numberInput, rangeInput) => {
      numberInput.addEventListener("input", () => {
        const value = clampInput(numberInput);
        rangeInput.value = String(value);
        calculate();
      });
      numberInput.addEventListener("change", () => {
        const value = clampInput(numberInput);
        numberInput.value = String(value);
        rangeInput.value = String(value);
        calculate();
      });
      rangeInput.addEventListener("input", () => {
        numberInput.value = rangeInput.value;
        calculate();
      });
    };

    connectPair(monthlyOpportunities, monthlyOpportunitiesRange);
    connectPair(lossRate, lossRateRange);
    connectPair(conversion, conversionRange);
    averageValue.addEventListener("input", calculate);
    averageValue.addEventListener("change", () => {
      averageValue.value = String(clampInput(averageValue));
      calculate();
    });
    calculate();
  };

  const initializeStageProcess = () => {
    const grid = document.querySelector(".web-stage-process-grid");
    const cards = grid ? Array.from(grid.querySelectorAll("[data-web-stage-card]")) : [];
    const toggles = cards.map((card) => card.querySelector(".web-stage-card-toggle"));
    const hoverStages = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1280px)");
    if (!grid || cards.length !== 6 || toggles.some((toggle) => !toggle)) return;
    let mouseFocusedToggle = null;

    const activate = (requestedIndex, { focus = false } = {}) => {
      const index = Math.min(Math.max(requestedIndex, 0), cards.length - 1);
      cards.forEach((card, cardIndex) => {
        const active = cardIndex === index;
        card.dataset.stageActive = String(active);
        toggles[cardIndex].setAttribute("aria-expanded", String(active));
      });
      grid.dataset.stageIndex = String(index);
      if (focus) toggles[index].focus();
    };

    toggles.forEach((toggle, index) => {
      toggle.addEventListener("pointerdown", (event) => {
        mouseFocusedToggle = event.pointerType !== "touch" && hoverStages.matches ? toggle : null;
      });
      toggle.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch" && hoverStages.matches) activate(index);
      });
      toggle.addEventListener("focus", () => activate(index));
      toggle.addEventListener("blur", () => {
        if (mouseFocusedToggle === toggle) mouseFocusedToggle = null;
      });
      toggle.addEventListener("pointercancel", () => {
        if (mouseFocusedToggle === toggle) mouseFocusedToggle = null;
      });
      toggle.addEventListener("click", () => activate(index));
      toggle.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          activate(index - 1, { focus: true });
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          activate(index + 1, { focus: true });
        } else if (event.key === "Home") {
          event.preventDefault();
          activate(0, { focus: true });
        } else if (event.key === "End") {
          event.preventDefault();
          activate(cards.length - 1, { focus: true });
        } else if (event.key === "Escape") {
          event.preventDefault();
          activate(0, { focus: true });
        }
      });
    });

    grid.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch" || !hoverStages.matches) return;
      if (mouseFocusedToggle && document.activeElement === mouseFocusedToggle) {
        const focusedByMouse = mouseFocusedToggle;
        mouseFocusedToggle = null;
        focusedByMouse.blur();
        activate(0);
        return;
      }
      const focusedIndex = toggles.indexOf(document.activeElement);
      activate(focusedIndex >= 0 ? focusedIndex : 0);
    });
    grid.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!grid.contains(document.activeElement)) activate(0);
      });
    });
    activate(0);
  };

  const initializeSurfaceCursor = () => {
    const surfaces = Array.from(document.querySelectorAll("[data-web-surface-cursor]"));
    const eligibilityQueries = [
      window.matchMedia("(hover: hover) and (pointer: fine)"),
      window.matchMedia("(min-width: 481px)"),
      window.matchMedia("(prefers-reduced-motion: no-preference)"),
    ];
    const isEligible = () => eligibilityQueries.every((query) => query.matches);
    if (surfaces.length !== 2) return;

    let teardown = null;

    const mount = () => {
      if (document.querySelector(".web-surface-cursor")) return null;

      const dotSize = 40;
      const dotCount = 14;
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      filter.setAttribute("class", "web-surface-cursor-filter");
      filter.setAttribute("aria-hidden", "true");
      filter.innerHTML = `
        <filter id="web-surface-cursor-goo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"></feGaussianBlur>
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"></feColorMatrix>
          <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
        </filter>`;

      const cursor = document.createElement("div");
      cursor.className = "web-surface-cursor";
      cursor.setAttribute("aria-hidden", "true");
      const dots = Array.from({ length: dotCount }, (_, dotIndex) => {
        const element = document.createElement("span");
        const scale = Math.max(0.22, 1 - dotIndex * 0.06);
        cursor.appendChild(element);
        return { element, x: 0, y: 0, scale };
      });

      document.body.append(filter, cursor);
      document.documentElement.classList.add("web-surface-cursor-ready");

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
          dot.element.style.transform = `translate3d(${dot.x - dotSize / 2}px, ${dot.y - dotSize / 2}px, 0) scale(${dot.scale})`;
        });
        frame = requestAnimationFrame(render);
      };

      const deactivate = () => {
        if (activeSurface) activeSurface.classList.remove("web-surface-cursor-active");
        activeSurface = null;
        cursor.classList.remove("is-visible");
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };

      const surfaceHandlers = surfaces.map((surface) => {
        const enter = (event) => {
          if (!isEligible() || (event.pointerType && event.pointerType !== "mouse")) return;
          if (activeSurface && activeSurface !== surface) activeSurface.classList.remove("web-surface-cursor-active");
          activeSurface = surface;
          seed(event);
          surface.classList.add("web-surface-cursor-active");
          cursor.classList.add("is-visible");
          if (!frame) frame = requestAnimationFrame(render);
        };
        const move = (event) => {
          if (activeSurface !== surface) return;
          target.x = event.clientX;
          target.y = event.clientY;
        };
        surface.addEventListener("pointerenter", enter);
        surface.addEventListener("pointermove", move);
        surface.addEventListener("pointerleave", deactivate);
        surface.addEventListener("pointercancel", deactivate);
        return { surface, enter, move };
      });

      const handleVisibility = () => {
        if (document.hidden) deactivate();
      };
      window.addEventListener("blur", deactivate);
      window.addEventListener("pointercancel", deactivate);
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        deactivate();
        surfaceHandlers.forEach(({ surface, enter, move }) => {
          surface.removeEventListener("pointerenter", enter);
          surface.removeEventListener("pointermove", move);
          surface.removeEventListener("pointerleave", deactivate);
          surface.removeEventListener("pointercancel", deactivate);
        });
        window.removeEventListener("blur", deactivate);
        window.removeEventListener("pointercancel", deactivate);
        document.removeEventListener("visibilitychange", handleVisibility);
        document.documentElement.classList.remove("web-surface-cursor-ready");
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

    eligibilityQueries.forEach((query) => query.addEventListener("change", synchronize));
    window.addEventListener("resize", synchronize, { passive: true });
    synchronize();
  };

  const initialize = () => {
    initializeProofRail();
    initializeWebsiteLossCalculator();
    initializeStageProcess();
    initializeSurfaceCursor();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
