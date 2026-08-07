(() => {
  "use strict";

  const section = document.querySelector("[data-resource-guides]");
  const viewport = section?.querySelector("[data-resource-guide-viewport]");
  const rail = section?.querySelector("[data-resource-guide-rail]");
  const previous = section?.querySelector("[data-resource-guide-previous]");
  const next = section?.querySelector("[data-resource-guide-next]");
  const expand = section?.querySelector("[data-resource-guide-expand]");
  const controls = section?.querySelector(".resource-guide-controls");
  const categoryTabs = section ? Array.from(section.querySelectorAll("[data-resource-category-tab]")) : [];
  const cards = rail ? Array.from(rail.querySelectorAll(".resource-card")) : [];
  if (!section || !viewport || !rail || !previous || !next || !expand || !controls || cards.length < 2) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0;
  let expanded = false;
  let frame = 0;
  let categoryLock = "";

  const geometry = () => {
    const first = cards[0].getBoundingClientRect();
    const styles = getComputedStyle(rail);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const step = first.width + gap;
    const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / step));
    return { step, visible, max: Math.max(0, cards.length - visible) };
  };

  const updateTabs = () => {
    if (!categoryTabs.length) return;
    const activeCategory = categoryLock || cards[index]?.dataset.resourceCardCategory || cards[0]?.dataset.resourceCardCategory || "";
    categoryTabs.forEach((tab) => {
      tab.setAttribute("aria-pressed", String(tab.dataset.resourceCategoryTab === activeCategory));
    });
  };

  const update = () => {
    const { max } = geometry();
    index = Math.min(Math.max(index, 0), max);
    previous.disabled = expanded || index <= 0;
    next.disabled = expanded || index >= max;
    viewport.dataset.railIndex = String(index);
    updateTabs();
  };

  const move = (requestedIndex) => {
    if (expanded) return;
    const { step, max } = geometry();
    index = Math.min(Math.max(requestedIndex, 0), max);
    viewport.scrollTo({ left: index * step, behavior: reducedMotion.matches ? "auto" : "smooth" });
    update();
  };

  const setExpanded = (value) => {
    expanded = value;
    section.dataset.guidesExpanded = String(expanded);
    expand.setAttribute("aria-expanded", String(expanded));
    expand.textContent = expanded ? "Show fewer guides" : "See all guides";
    controls.hidden = expanded;
    viewport.tabIndex = expanded ? -1 : 0;
    viewport.scrollTo({ left: 0, behavior: "auto" });
    index = 0;
    update();
  };

  previous.addEventListener("click", () => {
    categoryLock = "";
    move(index - 1);
  });
  next.addEventListener("click", () => {
    categoryLock = "";
    move(index + 1);
  });
  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const requestedCategory = tab.dataset.resourceCategoryTab;
      const requestedIndex = cards.findIndex((card) => card.dataset.resourceCardCategory === requestedCategory);
      if (requestedIndex >= 0) {
        categoryLock = requestedCategory;
        move(requestedIndex);
      }
    });
  });
  expand.addEventListener("click", () => setExpanded(!expanded));
  viewport.addEventListener("keydown", (event) => {
    if (expanded) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      categoryLock = "";
      move(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      categoryLock = "";
      move(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      categoryLock = "";
      move(0);
    } else if (event.key === "End") {
      event.preventDefault();
      categoryLock = "";
      move(cards.length);
    }
  });
  viewport.addEventListener("scroll", () => {
    if (expanded || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const { step } = geometry();
      if (step > 0) index = Math.round(viewport.scrollLeft / step);
      update();
    });
  }, { passive: true });
  window.addEventListener("resize", () => move(index), { passive: true });

  section.classList.add("is-resource-rail-ready");
  controls.hidden = false;
  expand.hidden = false;
  setExpanded(false);
})();
