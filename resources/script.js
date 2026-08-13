(() => {
  "use strict";

  const section = document.querySelector("[data-resource-guides]");
  const rail = section?.querySelector("[data-resource-guide-rail]");
  const categoryTabs = section ? Array.from(section.querySelectorAll("[data-resource-category-tab]")) : [];
  const more = section?.querySelector("[data-resource-guide-more]");
  const cards = rail ? Array.from(rail.querySelectorAll(".resource-card")) : [];
  if (!section || !rail || !categoryTabs.length || !more || !cards.length) return;

  const visibleLimit = Number.parseInt(section.dataset.resourceCategoryLimit || "4", 10) || 4;
  let activeCategory = categoryTabs[0]?.dataset.resourceCategoryTab || cards[0]?.dataset.resourceCardCategory || "";
  let expandedCategory = "";

  const cardsForCategory = (category) => cards.filter((card) => card.dataset.resourceCardCategory === category);

  const update = () => {
    const categoryCards = cardsForCategory(activeCategory);
    const isExpanded = expandedCategory === activeCategory;
    let visibleCount = 0;

    cards.forEach((card) => {
      const belongsToCategory = card.dataset.resourceCardCategory === activeCategory;
      const withinLimit = isExpanded || visibleCount < visibleLimit;
      card.hidden = !belongsToCategory || !withinLimit;
      if (belongsToCategory) visibleCount += 1;
    });

    categoryTabs.forEach((tab) => {
      const selected = tab.dataset.resourceCategoryTab === activeCategory;
      tab.setAttribute("aria-pressed", String(selected));
    });

    const hasMore = categoryCards.length > visibleLimit && !isExpanded;
    more.hidden = !hasMore;
    more.setAttribute("aria-expanded", String(isExpanded));
    more.textContent = "See More";
    section.dataset.activeResourceCategory = activeCategory;
    section.dataset.resourceCategoryExpanded = String(isExpanded);
  };

  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.resourceCategoryTab || activeCategory;
      expandedCategory = "";
      update();
    });
  });

  more.addEventListener("click", () => {
    expandedCategory = activeCategory;
    update();
  });

  section.classList.add("is-resource-tabs-ready");
  update();
})();
