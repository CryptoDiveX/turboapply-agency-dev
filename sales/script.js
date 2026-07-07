const hasGsap = window.gsap && window.ScrollTrigger;

const splitWords = () => {
  document.querySelectorAll(".reveal-text").forEach((node) => {
    const words = node.textContent.trim().split(/\s+/);
    node.textContent = "";
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = `${word}${index === words.length - 1 ? "" : " "}`;
      node.appendChild(span);
    });
  });
};

const initFallbackReveals = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.style.opacity = entry.isIntersecting ? "1" : "0.16";
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll(".word").forEach((word) => observer.observe(word));
};

const initMagneticCards = () => {
  document.querySelectorAll(".magnetic-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
};

const initAgentAccordion = () => {
  document.querySelectorAll(".agent-row").forEach((row) => {
    const button = row.querySelector(".agent-question");
    button?.addEventListener("click", () => {
      const isOpen = row.classList.contains("is-open");
      document.querySelectorAll(".agent-row").forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector(".agent-question")?.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        row.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
};

const extractEmailAddress = (value) => {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
};

const buildBookingUrl = (bookingUrl, { name, contact }) => {
  const target = new URL(bookingUrl || '/book-meeting', window.location.origin);
  const email = extractEmailAddress(contact);

  if (name) target.searchParams.set('name', name);
  if (email) target.searchParams.set('email', email);

  return target.toString();
};

const initAuditForm = () => {
  const form = document.querySelector(".audit-form");
  if (!form) return;

  const bookingUrl = form.dataset.bookingUrl || "/book-meeting/";
  const error = form.querySelector(".audit-error");
  const button = form.querySelector(".audit-circle");

  const ensureRedirectInput = () => {
    let redirectInput = form.querySelector('input[name="redirect"]');
    if (!redirectInput) {
      redirectInput = document.createElement("input");
      redirectInput.type = "hidden";
      redirectInput.name = "redirect";
      form.prepend(redirectInput);
    }
    return redirectInput;
  };

  form.addEventListener("submit", () => {
    error?.classList.remove("is-visible");

    const payload = new FormData(form);
    const name = String(payload.get("name") || "").trim();
    const contact = String(payload.get("contact") || "").trim();
    const targetUrl = buildBookingUrl(bookingUrl, { name, contact });

    ensureRedirectInput().value = targetUrl;

    if (button) {
      button.disabled = true;
      button.textContent = "Opening Calendly";
    }
  });
};

const initFooterTags = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll(".footer-tag").forEach((tag) => {
    const baseTilt = Number(tag.dataset.tilt || 0);
    tag.style.setProperty("--tilt", baseTilt);
    tag.style.setProperty("--float-x", "0px");
    tag.style.setProperty("--float-y", "0px");
    tag.style.setProperty("--float-rot", "0");
    tag.style.setProperty("--push-x", "0px");
    tag.style.setProperty("--push-y", "0px");

    let hoverTween;

    const startShuffle = () => {
      tag.classList.add("is-active");
      if (!window.gsap) return;

      hoverTween?.kill();
      hoverTween = gsap.to(tag, {
        "--float-x": `${baseTilt > 0 ? -24 : 24}px`,
        "--float-y": `${baseTilt % 2 === 0 ? -18 : 18}px`,
        "--float-rot": `${baseTilt > 0 ? -8 : 8}`,
        duration: 0.52,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    };

    const stopShuffle = () => {
      tag.classList.remove("is-active");
      hoverTween?.kill();
      hoverTween = null;

      if (window.gsap) {
        gsap.to(tag, {
          "--float-x": "0px",
          "--float-y": "0px",
          "--float-rot": "0",
          "--push-x": "0px",
          "--push-y": "0px",
          duration: 0.36,
          ease: "power2.out"
        });
      } else {
        tag.style.setProperty("--float-x", "0px");
        tag.style.setProperty("--float-y", "0px");
        tag.style.setProperty("--float-rot", "0");
        tag.style.setProperty("--push-x", "0px");
        tag.style.setProperty("--push-y", "0px");
      }
    };

    tag.addEventListener("pointerenter", startShuffle);

    tag.addEventListener("pointermove", (event) => {
      const rect = tag.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tag.style.setProperty("--push-x", `${x * 34}px`);
      tag.style.setProperty("--push-y", `${y * 26}px`);
    });

    tag.addEventListener("pointerleave", () => {
      stopShuffle();
    });
  });
};

const initDataReveal = () => {
  const panel = document.querySelector(".data-reveal");
  if (!panel) return;

  const tokens = [
    "WEBSITE",
    "HOMEPAGE",
    "CONTACT FORM",
    "BOOKING",
    "LIVE CHAT",
    "EMAIL",
    "INBOX",
    "GOOGLE ADS",
    "META ADS",
    "SEO",
    "CONTENT",
    "SOCIAL",
    "CAMPAIGNS",
    "TRACKING",
    "PIXELS",
    "UTM LINKS",
    "CRM",
    "LEADS",
    "CONTACTS",
    "ACCOUNTS",
    "COLD EMAIL",
    "LEAD ROUTING",
    "LEAD SCORING",
    "CALENDAR",
    "SCHEDULING",
    "APPOINTMENTS",
    "PROPOSALS",
    "QUOTES",
    "INVOICES",
    "DATABASE",
    "DASHBOARD",
    "REPORTING",
    "ANALYTICS",
    "CUSTOMER DATA"
  ];
  const text = Array.from({ length: 1600 }, (_, index) => {
    const token = tokens[(index * 7 + index) % tokens.length];
    return index % 34 === 0 ? `\n${token}` : token;
  }).join(" ");

  panel.querySelectorAll(".data-field").forEach((field) => {
    field.textContent = text;
  });

  panel.addEventListener("pointermove", (event) => {
    const rect = panel.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    panel.style.setProperty("--mx", `${x}%`);
    panel.style.setProperty("--my", `${y}%`);
  });
};

const initServiceStory = () => {
  const section = document.querySelector(".service-story");
  if (!section) return;

  const rows = Array.from(section.querySelectorAll(".service-story-row"));
  if (!rows.length || !hasGsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  const fixed = section.querySelector(".service-story-fixed");
  if (fixed) {
    ScrollTrigger.matchMedia({
      "(min-width: 981px)": () => {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          pin: fixed,
          pinSpacing: false,
          anticipatePin: 1
        });
      }
    });
  }

  rows.forEach((row) => {
    const line = row.querySelector(".service-story-line");
    gsap.fromTo(
      row,
      { opacity: 0.38, y: 78 },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: row,
          start: "top 86%",
          end: "top 38%",
          scrub: true
        }
      }
    );

    if (line) {
      gsap.fromTo(
        line,
        { scaleX: 0.28 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: row,
            start: "top 90%",
            end: "top 52%",
            scrub: true
          }
        }
      );
    }
  });
};

const initGsap = () => {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-copy > *", {
    y: 34,
    opacity: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out"
  });

  gsap.from(".hero-image", {
    scale: 0.86,
    opacity: 0,
    duration: 1.1,
    ease: "power3.out"
  });

  gsap.to(".reveal-text .word", {
    opacity: 1,
    stagger: 0.045,
    ease: "none",
    scrollTrigger: {
      trigger: ".intro",
      start: "top 70%",
      end: "bottom 30%",
      scrub: true
    }
  });

  gsap.utils.toArray(".image-card").forEach((card) => {
    gsap.fromTo(
      card,
      { scale: 0.88, opacity: 0.55 },
      {
        scale: 1,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          end: "center 45%",
          scrub: true
        }
      }
    );
  });

  gsap.from(".service-feature-card", {
    y: 90,
    opacity: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".services-motion",
      start: "top 68%"
    }
  });

  gsap.to(".service-feature-card", {
    yPercent: (index) => [2, -1.5, 1.5][index] || 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".services-motion",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });

  gsap.from(".agent-row", {
    x: 80,
    opacity: 0,
    stagger: 0.12,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".agents-faq",
      start: "top 62%"
    }
  });
};

splitWords();
initMagneticCards();
initAuditForm();
initAgentAccordion();
initFooterTags();
initDataReveal();
initServiceStory();

if (hasGsap) {
  initGsap();
} else {
  initFallbackReveals();
}
