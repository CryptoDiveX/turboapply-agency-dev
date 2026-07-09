const splash = document.querySelector('#splash');
const site = document.querySelector('#site');
const scrambleWords = Array.from(document.querySelectorAll('[data-scramble-word]'));
const navLinks = Array.from(document.querySelectorAll('.side-nav a'));
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const mobileMenuLinks = Array.from(document.querySelectorAll('[data-mobile-menu-link]'));
const categoryButtons = Array.from(document.querySelectorAll('.category'));
const projectFeature = document.querySelector('.project-feature');
const projectSteps = Array.from(document.querySelectorAll('[data-project-step]'));
const projectsSection = document.querySelector('#projects');
const servicesSection = document.querySelector('#services');
const heroSection = document.querySelector('#about');
const heroStage = document.querySelector('.hero-stage');
const heroKeywords = Array.from(document.querySelectorAll('.hero-keyword'));
const heroWandReveal = document.querySelector('.hero-wand-reveal');
const heroWandRevealText = document.querySelector('.hero-wand-reveal p');
const projectTitle = document.querySelector('#project-title');
const projectDescription = document.querySelector('#project-description');
const projectImages = Array.from(document.querySelectorAll('[data-project-image]'));
const projectBg = document.querySelector('.project-bg');
const projectSticky = document.querySelector('.project-sticky');
const projectLink = document.querySelector('#project-link');
const projectBehanceLink = document.querySelector('#project-behance-link');
const contactSection = document.querySelector('#contact');
const contactCard = document.querySelector('.contact-card');
const contactForm = document.querySelector('[data-contact-form]');
const contactStatus = document.querySelector('[data-contact-status]');
const contactPageUrl = document.querySelector('[data-contact-page-url]');
const contactBookingRedirectUrl = 'https://turboapply.agency/book-meeting/?name=11';
const productionContactApiUrl = 'https://turboapply.agency/api/contact';

if (contactForm && window.location.hostname === 'dev.turboapply.agency') {
  contactForm.action = productionContactApiUrl;
}

const scrambleGlyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/*+-=_#@!?$%&|';
const scrambleTimers = new Set();
const splashBootDelayMs = 140;
const splashSettledHoldMs = 350;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroRevealStateByKeyword = new Map();
const heroScratchRadius = 34;
let heroCoinCursor = null;
let scratchAudio = null;
let scratchAudioEnabled = true;
let scratchAudioLastPlayedAt = 0;
let scratchAudioLastPoint = null;
let scratchAudioUnlockRequested = false;

const projectData = {
  recreational: {
    title: 'Ozero Grez',
    description: 'A website designed in the retro style for a recreational park in Novosibirsk',
    images: [
      'public/assets/figma/ozero-card-shot.png',
      'public/assets/figma/ozero-mobile-mock.png'
    ],
    alt: ['Park and Play Ozero Grez project preview', 'Ozero Grez full website page preview'],
    url: 'https://ozerogrez.ru',
    behanceUrl: 'https://www.behance.net/gallery/236717763/Retro-Design-for-Glamping-Park',
    behanceLabel: 'behance',
    background: 'public/assets/figma/ozero-section-bg.png'
  },
  martial: {
    title: 'World Top Martial Arts',
    description: 'A high-energy academy website for karate, kickboxing, MMA, grappling and self-defence training in Burnaby.',
    images: [
      'public/assets/martial-arts/wtma-desktop.webp',
      'public/assets/martial-arts/wtma-mobile.webp'
    ],
    alt: ['World Top Martial Arts desktop website preview', 'World Top Martial Arts mobile website preview'],
    url: 'https://wtma.ca',
    linkLabel: 'explore this site',
    background: 'public/assets/martial-arts/wtma-action-bg.jpg'
  },
  personal: {
    title: 'Psychologist Personal Site',
    description: 'A gentle therapy website with a warm editorial identity, soft illustrations and clear booking pathways.',
    images: [
      'public/assets/personal-site/liuba-hero.png',
      'public/assets/personal-site/liuba-mid.png',
      'public/assets/personal-site/liuba-end.png'
    ],
    alt: ['Liuba personal site hero and about sections', 'Liuba personal site topics and approach sections', 'Liuba personal site contact section'],
    url: 'https://rule-drawn-79741007.figma.site/',
    linkLabel: 'explore this site',
    background: 'public/assets/personal-site/professionals-lounge-bg.jpg'
  },
  health: {
    title: 'TurboApply Health',
    description: 'A clinic-focused website for calmer booking flows, practical automation and trustworthy patient journeys.',
    images: [
      'public/assets/health-site/health-hero.png',
      'public/assets/health-site/health-mobile-full.png',
      'public/assets/health-site/health-mid.png'
    ],
    alt: ['TurboApply Health desktop clinic website hero section', 'TurboApply Health phone website flow', 'TurboApply Health iPad service cards and care section'],
    url: 'https://health.turboapply.agency/',
    linkLabel: 'explore this site',
    background: 'public/assets/health-site/health-abstract-bg.jpg'
  },
  finance: {
    title: 'Nova Bank',
    description: 'A mobile banking app concept for fast transfers, clear spending insights and confident everyday money management.',
    images: [
      'public/assets/finance/nova-bank-hero.png',
      'public/assets/finance/nova-bank-screen-a.png',
      'public/assets/finance/nova-bank-screen-b.png'
    ],
    alt: ['Nova Bank mobile app overview from Behance', 'Nova Bank transfer and payment app screens', 'Nova Bank user flows and persona screens'],
    url: 'https://www.behance.net/gallery/231461891/Nova-Bank-Mobile-App',
    background: 'public/assets/finance/nova-bank-city-motion-bg.jpg'
  }
};

const projectKeys = categoryButtons.map((button) => button.dataset.project).filter(Boolean);
let activeProjectKey = projectKeys[0] || null;
let projectStepObserver = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeProgress(value, start, end) {
  if (end <= start) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start), 0, 1);
}

function easeOutCubic(value) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(start, end, progress) {
  return start + (end - start) * clamp(progress, 0, 1);
}

function syncServicesHubScrollTransition() {
  if (!servicesSection) return;

  if (prefersReducedMotion.matches) {
    servicesSection.style.setProperty('--services-chapter-opacity', '1');
    servicesSection.style.setProperty('--services-chapter-width', '100%');
    servicesSection.style.setProperty('--services-chapter-height', '100vh');
    servicesSection.style.setProperty('--services-chapter-top', '0px');
    servicesSection.style.setProperty('--services-chapter-radius', '0px');
    servicesSection.style.setProperty('--services-content-opacity', '1');
    servicesSection.style.setProperty('--services-content-y', '0px');
    servicesSection.style.setProperty('--services-content-scale', '1');
    servicesSection.style.setProperty('--services-content-blur', '0px');
    servicesSection.style.setProperty('--services-heading-opacity', '1');
    servicesSection.style.setProperty('--services-heading-blur', '0px');
    servicesSection.style.setProperty('--services-cards-opacity', '1');
    servicesSection.style.setProperty('--services-cards-blur', '0px');
    return;
  }

  const rect = servicesSection.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const enterAmount = viewportHeight - rect.top;
  const chapterProgress = easeInOut(normalizeProgress(
    enterAmount,
    viewportHeight * 0.04,
    viewportHeight * 1.0
  ));
  const headingProgress = easeOutCubic(normalizeProgress(chapterProgress, 0.58, 0.86));
  const cardsProgress = easeOutCubic(normalizeProgress(-rect.top, -12, viewportHeight * 0.10));

  const chapterWidth = lerp(viewportWidth * 0.70, viewportWidth, chapterProgress);
  const chapterHeight = lerp(viewportHeight * 0.43, viewportHeight, chapterProgress);
  const chapterTop = lerp(viewportHeight * 0.60, 0, chapterProgress);
  const chapterRadius = Math.round(lerp(34, 0, chapterProgress));
  const chapterOpacity = clamp(0.72 + chapterProgress * 0.28, 0, 1);
  const headingOpacity = clamp(headingProgress * 1.18, 0, 1);
  const headingBlur = (1 - headingProgress) * 7;
  const cardsOpacity = clamp(cardsProgress * 1.35, 0, 1);
  const cardsBlur = (1 - cardsProgress) * 10;

  servicesSection.style.setProperty('--services-chapter-opacity', chapterOpacity.toFixed(3));
  servicesSection.style.setProperty('--services-chapter-width', `${Math.round(chapterWidth)}px`);
  servicesSection.style.setProperty('--services-chapter-height', `${Math.round(chapterHeight)}px`);
  servicesSection.style.setProperty('--services-chapter-top', `${Math.round(chapterTop)}px`);
  servicesSection.style.setProperty('--services-chapter-radius', `${chapterRadius}px`);
  servicesSection.style.setProperty('--services-content-opacity', headingOpacity.toFixed(3));
  servicesSection.style.setProperty('--services-content-y', '0px');
  servicesSection.style.setProperty('--services-content-scale', '1');
  servicesSection.style.setProperty('--services-content-blur', `${headingBlur.toFixed(1)}px`);
  servicesSection.style.setProperty('--services-heading-opacity', headingOpacity.toFixed(3));
  servicesSection.style.setProperty('--services-heading-blur', `${headingBlur.toFixed(1)}px`);
  servicesSection.style.setProperty('--services-cards-opacity', cardsOpacity.toFixed(3));
  servicesSection.style.setProperty('--services-cards-blur', `${cardsBlur.toFixed(1)}px`);
}

function observeServicesHubScrollTransition() {
  if (!servicesSection) return;

  let ticking = false;
  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      syncServicesHubScrollTransition();
    });
  };

  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync);
  prefersReducedMotion.addEventListener?.('change', requestSync);
  syncServicesHubScrollTransition();
}

function syncContactScrollTransition() {
  if (!contactSection) return;

  if (prefersReducedMotion.matches) {
    contactSection.style.setProperty('--contact-chapter-opacity', '1');
    contactSection.style.setProperty('--contact-chapter-width', '100%');
    contactSection.style.setProperty('--contact-chapter-height', '100vh');
    contactSection.style.setProperty('--contact-chapter-top', '0px');
    contactSection.style.setProperty('--contact-chapter-radius', '0px');
    contactSection.style.setProperty('--contact-card-opacity', '1');
    contactSection.style.setProperty('--contact-card-y', '0px');
    contactSection.style.setProperty('--contact-card-scale', '1');
    contactSection.style.setProperty('--contact-card-blur', '0px');
    projectsSection?.style.setProperty('--project-exit-opacity', '1');
    projectsSection?.style.setProperty('--project-exit-blur', '0px');
    return;
  }

  const rect = contactSection.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const enterAmount = viewportHeight - rect.top;
  const chapterProgress = easeInOut(normalizeProgress(
    enterAmount,
    viewportHeight * 0.04,
    viewportHeight * 1.0
  ));
  const cardProgress = easeOutCubic(normalizeProgress(chapterProgress, 0.58, 1));
  const projectCoverProgress = easeInOut(normalizeProgress(chapterProgress, 0.08, 0.76));

  const chapterWidth = lerp(viewportWidth * 0.70, viewportWidth, chapterProgress);
  const chapterHeight = lerp(viewportHeight * 0.43, viewportHeight, chapterProgress);
  const chapterTop = lerp(viewportHeight * 0.60, 0, chapterProgress);
  const chapterRadius = Math.round(lerp(34, 0, chapterProgress));
  const chapterOpacity = clamp(0.72 + chapterProgress * 0.28, 0, 1);

  const y = Math.round(lerp(viewportHeight * 0.22, 0, cardProgress));
  const scale = 0.84 + cardProgress * 0.16;
  const opacity = clamp(cardProgress * 1.25, 0, 1);
  const blur = (1 - cardProgress) * 8;
  const projectExitOpacity = 1 - projectCoverProgress * 0.58;
  const projectExitBlur = projectCoverProgress * 10;

  contactSection.style.setProperty('--contact-chapter-opacity', chapterOpacity.toFixed(3));
  contactSection.style.setProperty('--contact-chapter-width', `${Math.round(chapterWidth)}px`);
  contactSection.style.setProperty('--contact-chapter-height', `${Math.round(chapterHeight)}px`);
  contactSection.style.setProperty('--contact-chapter-top', `${Math.round(chapterTop)}px`);
  contactSection.style.setProperty('--contact-chapter-radius', `${chapterRadius}px`);
  contactSection.style.setProperty('--contact-card-opacity', opacity.toFixed(3));
  contactSection.style.setProperty('--contact-card-y', `${y}px`);
  contactSection.style.setProperty('--contact-card-scale', scale.toFixed(3));
  contactSection.style.setProperty('--contact-card-blur', `${blur.toFixed(1)}px`);
  projectsSection?.style.setProperty('--project-exit-opacity', projectExitOpacity.toFixed(3));
  projectsSection?.style.setProperty('--project-exit-blur', `${projectExitBlur.toFixed(1)}px`);
}

function observeContactScrollTransition() {
  if (!contactSection) return;

  let ticking = false;
  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      syncContactScrollTransition();
    });
  };

  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync);
  prefersReducedMotion.addEventListener?.('change', requestSync);
  syncContactScrollTransition();
}

function syncProjectFeatureScrollTransition() {
  if (!projectsSection || !projectFeature) return;

  if (prefersReducedMotion.matches) {
    projectsSection.style.setProperty('--project-chapter-opacity', '1');
    projectsSection.style.setProperty('--project-chapter-width', '100%');
    projectsSection.style.setProperty('--project-chapter-height', '100vh');
    projectsSection.style.setProperty('--project-chapter-top', '0px');
    projectsSection.style.setProperty('--project-chapter-radius', '0px');
    projectsSection.style.setProperty('--project-categories-left', 'max(54px, 19.5vw)');
    projectsSection.style.setProperty('--project-categories-top', 'max(170px, 36vh)');
    projectsSection.style.setProperty('--project-categories-gap', '28px');
    projectsSection.style.setProperty('--project-category-size', 'clamp(46px, 4.2vw, 56px)');
    projectsSection.style.setProperty('--project-feature-opacity', '1');
    projectsSection.style.setProperty('--project-feature-y', '0px');
    projectsSection.style.setProperty('--project-feature-scale', '1');
    projectsSection.style.setProperty('--project-feature-blur', '0px');
    heroSection?.style.setProperty('--hero-stage-opacity', '1');
    heroSection?.style.setProperty('--hero-stage-blur', '0px');
    heroSection?.style.setProperty('--hero-content-opacity', '1');
    heroSection?.style.setProperty('--hero-content-blur', '0px');
    return;
  }

  const rect = projectsSection.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const enterAmount = viewportHeight - rect.top;
  const chapterProgress = easeInOut(normalizeProgress(
    enterAmount,
    viewportHeight * 0.04,
    viewportHeight * 1.0
  ));
  const categoryProgress = easeInOut(normalizeProgress(chapterProgress, 0.34, 1));
  const featureProgress = easeOutCubic(normalizeProgress(chapterProgress, 0.76, 1));

  const chapterWidth = lerp(viewportWidth * 0.70, viewportWidth, chapterProgress);
  const chapterHeight = lerp(viewportHeight * 0.43, viewportHeight, chapterProgress);
  const chapterTop = lerp(viewportHeight * 0.60, 0, chapterProgress);
  const chapterRadius = Math.round(lerp(34, 0, chapterProgress));
  const chapterOpacity = clamp(0.72 + chapterProgress * 0.28, 0, 1);

  const finalCategoryLeft = Math.max(54, viewportWidth * 0.195);
  const finalCategoryTop = Math.max(170, viewportHeight * 0.36);
  const startCategoryLeft = viewportWidth * 0.5 - 75;
  const startCategoryTop = viewportHeight * 0.40;
  const categoryLeft = lerp(startCategoryLeft, finalCategoryLeft, categoryProgress);
  const categoryTop = lerp(startCategoryTop, finalCategoryTop, categoryProgress);
  const categoryGap = lerp(20, 28, categoryProgress);
  const categorySize = lerp(38, 56, categoryProgress);

  const featureY = Math.round(lerp(viewportHeight * 0.18, 0, featureProgress));
  const featureScale = 0.88 + featureProgress * 0.12;
  const featureOpacity = clamp(featureProgress * 1.28, 0, 1);
  const featureBlur = (1 - featureProgress) * 8;
  const heroCoverProgress = easeInOut(normalizeProgress(chapterProgress, 0.06, 0.74));
  const heroStageOpacity = 1 - heroCoverProgress * 0.64;
  const heroStageBlur = heroCoverProgress * 12;
  const heroContentOpacity = 1 - heroCoverProgress * 0.86;
  const heroContentBlur = heroCoverProgress * 9;

  projectsSection.style.setProperty('--project-chapter-opacity', chapterOpacity.toFixed(3));
  projectsSection.style.setProperty('--project-chapter-width', `${Math.round(chapterWidth)}px`);
  projectsSection.style.setProperty('--project-chapter-height', `${Math.round(chapterHeight)}px`);
  projectsSection.style.setProperty('--project-chapter-top', `${Math.round(chapterTop)}px`);
  projectsSection.style.setProperty('--project-chapter-radius', `${chapterRadius}px`);
  projectsSection.style.setProperty('--project-categories-left', `${Math.round(categoryLeft)}px`);
  projectsSection.style.setProperty('--project-categories-top', `${Math.round(categoryTop)}px`);
  projectsSection.style.setProperty('--project-categories-gap', `${Math.round(categoryGap)}px`);
  projectsSection.style.setProperty('--project-category-size', `${Math.round(categorySize)}px`);
  projectsSection.style.setProperty('--project-feature-opacity', featureOpacity.toFixed(3));
  projectsSection.style.setProperty('--project-feature-y', `${featureY}px`);
  projectsSection.style.setProperty('--project-feature-scale', featureScale.toFixed(3));
  projectsSection.style.setProperty('--project-feature-blur', `${featureBlur.toFixed(1)}px`);
  heroSection?.style.setProperty('--hero-stage-opacity', heroStageOpacity.toFixed(3));
  heroSection?.style.setProperty('--hero-stage-blur', `${heroStageBlur.toFixed(1)}px`);
  heroSection?.style.setProperty('--hero-content-opacity', heroContentOpacity.toFixed(3));
  heroSection?.style.setProperty('--hero-content-blur', `${heroContentBlur.toFixed(1)}px`);
}

function observeProjectFeatureScrollTransition() {
  if (!projectsSection || !projectFeature) return;

  let ticking = false;
  const requestSync = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      syncProjectFeatureScrollTransition();
    });
  };

  window.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync);
  prefersReducedMotion.addEventListener?.('change', requestSync);
  syncProjectFeatureScrollTransition();
}

function rememberTimer(id) {
  scrambleTimers.add(id);
  return id;
}

function clearScrambleTimers() {
  scrambleTimers.forEach((id) => {
    window.clearTimeout(id);
    window.clearInterval(id);
  });
  scrambleTimers.clear();
}

function randomGlyph() {
  return scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)];
}

function buildSplashLetters() {
  let globalIndex = 0;
  return scrambleWords.flatMap((word) => {
    const target = word.dataset.scrambleWord || word.textContent.trim();
    word.textContent = '';
    word.setAttribute('aria-hidden', 'true');

    return Array.from(target).map((letter) => {
      const char = document.createElement('span');
      char.className = 'splash-char';
      char.dataset.final = letter.toUpperCase();
      char.dataset.index = String(globalIndex++);
      char.textContent = prefersReducedMotion.matches ? char.dataset.final : randomGlyph();
      word.appendChild(char);
      return char;
    });
  });
}

function startSplashTimers(chars) {
  splash?.classList.add('is-scrambling');
  let settled = 0;

  chars.forEach((char, index) => {
    const stagger = 80 + index * 28;
    const cycles = 5 + Math.floor(Math.random() * 5) + Math.floor(index / 8);

    rememberTimer(window.setTimeout(() => {
      let tick = 0;
      char.classList.add('is-glitching');

      const interval = rememberTimer(window.setInterval(() => {
        tick += 1;
        char.textContent = tick >= cycles ? char.dataset.final : randomGlyph();

        if (tick >= cycles) {
          window.clearInterval(interval);
          scrambleTimers.delete(interval);
          char.classList.remove('is-glitching');
          char.classList.add('is-settled');
          settled += 1;

          if (settled === chars.length) {
            rememberTimer(window.setTimeout(() => finishSplashIntro(chars), 100));
          }
        }
      }, 30));
    }, stagger));
  });
}

function finishSplashIntro(chars) {
  chars.forEach((char) => {
    char.textContent = char.dataset.final;
    char.classList.remove('is-glitching');
    char.classList.add('is-settled');
  });
  splash?.classList.add('is-ready');
  rememberTimer(window.setTimeout(enterSite, splashSettledHoldMs));
}

function runSplashScramble() {
  const chars = buildSplashLetters();
  if (!splash || !chars.length) {
    splash?.classList.add('is-ready');
    return;
  }

  if (prefersReducedMotion.matches) {
    splash?.classList.add('is-scrambling');
    finishSplashIntro(chars);
    return;
  }

  rememberTimer(window.setTimeout(() => startSplashTimers(chars), splashBootDelayMs));
}

function enterSite() {
  clearScrambleTimers();
  splash?.classList.add('is-exiting');
  site?.classList.remove('is-hidden');
}

function updateProject(key) {
  const isIntro = key === 'intro';
  const projectKey = isIntro ? 'recreational' : key;
  const data = projectData[projectKey];
  if (!data || key === activeProjectKey) return;

  activeProjectKey = key;
  projectsSection?.classList.toggle('is-project-intro', isIntro);
  categoryButtons.forEach((button) => {
    const active = !isIntro && button.dataset.project === projectKey;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });

  projectFeature?.classList.remove('is-switching');
  if (!isIntro && projectFeature && !prefersReducedMotion.matches) {
    void projectFeature.offsetWidth;
    projectFeature.classList.add('is-switching');
  }
  if (projectFeature) projectFeature.dataset.project = projectKey;
  if (projectSticky) projectSticky.dataset.project = projectKey;
  if (projectBg) {
    if (Array.isArray(data.backgroundLayers) && data.backgroundLayers.length) {
      projectBg.style.backgroundImage = data.backgroundLayers.map((src) => `url("${src}")`).join(', ');
    } else if (data.background) {
      projectBg.style.backgroundImage = `url("${data.background}")`;
    }
  }
  if (projectTitle) projectTitle.textContent = data.title;
  if (projectDescription) projectDescription.textContent = data.description;
  projectImages.forEach((image, index) => {
    const src = data.images[index];
    image.hidden = !src;
    if (!src) {
      image.removeAttribute('src');
      image.alt = '';
      return;
    }
    image.src = src;
    image.alt = data.alt[index] || data.title;
  });

  if (projectLink) {
    projectLink.textContent = data.linkLabel || 'explore this site';
    projectLink.href = data.url;
    const isHash = data.url.startsWith('#');
    projectLink.toggleAttribute('target', !isHash);
    projectLink.toggleAttribute('rel', !isHash);
    if (!isHash) projectLink.rel = 'noopener noreferrer';
  }
  if (projectBehanceLink) {
    const hasBehanceLink = Boolean(data.behanceUrl);
    projectBehanceLink.hidden = !hasBehanceLink;
    projectBehanceLink.textContent = data.behanceLabel || 'behance';
    if (hasBehanceLink) {
      projectBehanceLink.href = data.behanceUrl;
      projectBehanceLink.target = '_blank';
      projectBehanceLink.rel = 'noopener noreferrer';
    } else {
      projectBehanceLink.removeAttribute('href');
      projectBehanceLink.removeAttribute('target');
      projectBehanceLink.removeAttribute('rel');
    }
  }
}

function findCenteredProjectStep() {
  const viewportCenter = window.innerHeight / 2;
  return projectSteps
    .map((step) => {
      const rect = step.getBoundingClientRect();
      return {
        step,
        containsCenter: rect.top <= viewportCenter && rect.bottom >= viewportCenter,
        distance: Math.abs((rect.top + rect.bottom) / 2 - viewportCenter)
      };
    })
    .sort((a, b) => Number(b.containsCenter) - Number(a.containsCenter) || a.distance - b.distance)[0]?.step;
}

function syncProjectFromObservedSteps() {
  const centeredStep = findCenteredProjectStep();
  if (centeredStep) updateProject(centeredStep.dataset.projectStep);
}

function observeProjectSteps() {
  if (!projectSteps.length || typeof IntersectionObserver === 'undefined') return;
  projectStepObserver?.disconnect();
  projectStepObserver = new IntersectionObserver(syncProjectFromObservedSteps, {
    root: null,
    rootMargin: '-48% 0px -48% 0px',
    threshold: [0]
  });

  projectSteps.forEach((step) => projectStepObserver.observe(step));
  syncProjectFromObservedSteps();
}

function scrollToProject(project) {
  const projectKey = typeof project === 'number' ? projectKeys[project] : project;
  const step = projectSteps.find((candidate) => candidate.dataset.projectStep === projectKey);
  if (!projectsSection || !step) return;
  window.scrollTo({
    top: projectsSection.offsetTop + step.offsetTop,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
  });
}

function observeSections() {
  const sections = Array.from(document.querySelectorAll('[data-observe]'));
  if (!sections.length) return;

  const syncActiveSection = () => {
    const anchorY = window.innerHeight * 0.18;
    const matchingSections = sections
      .map((section) => ({ section, rect: section.getBoundingClientRect() }))
      .filter(({ rect }) => rect.top <= anchorY && rect.bottom >= anchorY);
    const current = matchingSections.at(-1)?.section.dataset.observe || sections[0].dataset.observe;

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.section === current);
    });
  };

  window.addEventListener('scroll', syncActiveSection, { passive: true });
  window.addEventListener('resize', syncActiveSection);
  syncActiveSection();
}

function getHeroRevealPlacement(keyword) {
  if (!heroStage || !heroWandReveal || !keyword) return null;
  const stageRect = heroStage.getBoundingClientRect();
  const keywordRect = keyword.getBoundingClientRect();
  const defaultWidth = heroWandReveal.offsetWidth || Math.min(270, window.innerWidth * 0.3);
  const width = keyword.classList.contains('hero-keyword-work')
    ? Math.min(defaultWidth, 205)
    : keyword.classList.contains('hero-keyword-ai') && window.innerWidth <= 1100
      ? Math.min(defaultWidth, 220)
      : defaultWidth;
  const height = heroWandReveal.offsetHeight || 78;
  const portraitRect = heroStage.querySelector('.portrait-wrap')?.getBoundingClientRect();
  const keywordStyles = window.getComputedStyle(keyword);
  const keywordPaddingBottom = Number.parseFloat(keywordStyles.paddingBottom) || 0;
  const keywordLeft = keywordRect.left - stageRect.left;
  const keywordRight = keywordRect.right - stageRect.left;
  const keywordBottom = keywordRect.bottom - stageRect.top - keywordPaddingBottom;
  const safeLeft = 28;
  const safeRight = stageRect.width - width;
  const isLeftOfPortrait = portraitRect && keywordRect.right <= portraitRect.left;
  const isRightAligned = isLeftOfPortrait || keywordLeft + width > stageRect.width;
  const rawLeft = isRightAligned
    ? keywordRight - width
    : keywordLeft;
  const left = clamp(rawLeft, safeLeft, safeRight);
  const top = clamp(keywordBottom + 5, 76, stageRect.height - height - 28);

  return {
    keyword,
    width,
    height,
    left,
    top,
    textAlign: isRightAligned ? 'right' : 'left',
    viewportLeft: stageRect.left + left,
    viewportTop: stageRect.top + top
  };
}

function getHeroRevealTarget(clientX, clientY) {
  if (!heroKeywords.length) return null;
  const overKeyword = heroKeywords.some((keyword) => {
    const rect = keyword.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  });
  if (overKeyword) return null;
  const hitPadding = window.matchMedia('(max-width: 640px)').matches ? 18 : 24;
  return heroKeywords
    .map((keyword) => getHeroRevealPlacement(keyword))
    .filter(Boolean)
    .map((placement) => {
      const right = placement.viewportLeft + placement.width;
      const bottom = placement.viewportTop + placement.height;
      const inside = clientX >= placement.viewportLeft - hitPadding &&
        clientX <= right + hitPadding &&
        clientY >= placement.viewportTop - hitPadding &&
        clientY <= bottom + hitPadding;
      const centerX = placement.viewportLeft + placement.width / 2;
      const centerY = placement.viewportTop + placement.height / 2;
      return { ...placement, inside, distance: Math.hypot(clientX - centerX, clientY - centerY) };
    })
    .filter(({ inside }) => inside)
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

function getHeroKeywordId(keyword) {
  if (!keyword) return '';
  return keyword.dataset.keywordId ||
    Array.from(keyword.classList).find((className) => className.startsWith('hero-keyword-') && className !== 'hero-keyword') ||
    keyword.textContent?.trim() ||
    '';
}

function getHeroRevealState(keyword) {
  if (!heroStage || !heroWandReveal || !keyword) return null;
  const keywordId = getHeroKeywordId(keyword);
  if (!keywordId) return null;
  let state = heroRevealStateByKeyword.get(keywordId);
  if (!state) {
    const reveal = heroWandReveal.cloneNode(true);
    const textNode = reveal.querySelector('p');
    reveal.classList.remove('is-visible');
    reveal.dataset.keywordId = keywordId;
    reveal.setAttribute('aria-hidden', 'true');
    textNode.textContent = keyword.dataset.info || '';
    heroStage.appendChild(reveal);
    state = { keyword, reveal, textNode, points: [] };
    heroRevealStateByKeyword.set(keywordId, state);
  }
  state.keyword = keyword;
  state.textNode.textContent = keyword.dataset.info || '';
  return state;
}

function positionHeroWandReveal(keyword, clientX, clientY, reveal = heroWandReveal, updateOrigin = true) {
  if (!reveal || !keyword) return null;
  const placement = getHeroRevealPlacement(keyword);
  if (!placement) return null;
  reveal.style.setProperty('--reveal-left', `${Math.round(placement.left)}px`);
  reveal.style.setProperty('--reveal-top', `${Math.round(placement.top)}px`);
  reveal.style.setProperty('--reveal-width', `${Math.round(placement.width)}px`);
  reveal.style.setProperty('--reveal-text-align', placement.textAlign);
  if (updateOrigin) {
    const originX = clamp(clientX - placement.viewportLeft, 24, placement.width - 24);
    const originY = clamp(clientY - placement.viewportTop, 24, placement.height - 24);
    reveal.style.setProperty('--light-origin-x', `${Math.round(originX)}px`);
    reveal.style.setProperty('--light-origin-y', `${Math.round(originY)}px`);
  }
  return placement;
}

function clearHeroScratchMask(state) {
  if (!state) return;
  state.points.splice(0, state.points.length);
  state.reveal.style.removeProperty('--scratch-mask');
}

function applyHeroScratchMask(state, placement, clientX, clientY, reset = false) {
  if (!state || !placement) return;
  if (reset) clearHeroScratchMask(state);
  const x = clamp(clientX - placement.viewportLeft, 0, placement.width);
  const y = clamp(clientY - placement.viewportTop, 0, placement.height);
  const last = state.points.at(-1);
  if (!last || Math.hypot(x - last.x, y - last.y) >= 9) {
    state.points.push({ x: Math.round(x), y: Math.round(y) });
  }
  const mask = state.points
    .flatMap((point, index) => {
      const radius = Math.round(heroScratchRadius + Math.min(index, 4) * 1.6);
      return [
        `radial-gradient(circle ${radius}px at ${point.x}px ${point.y}px, #000 0 82%, rgba(0,0,0,.95) 92%, transparent 100%)`,
        `radial-gradient(circle ${Math.round(radius * .72)}px at ${Math.max(0, point.x - 14)}px ${Math.min(placement.height, point.y + 8)}px, #000 0 78%, rgba(0,0,0,.92) 90%, transparent 100%)`
      ];
    })
    .join(', ');
  state.reveal.style.setProperty('--scratch-mask', mask);
}

function getHeroCoinCursor() {
  if (!heroStage) return null;
  if (!heroCoinCursor) {
    heroCoinCursor = document.createElement('span');
    heroCoinCursor.className = 'coin-cursor';
    heroCoinCursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(heroCoinCursor);
  }
  return heroCoinCursor;
}

function moveHeroCoinCursor(clientX, clientY) {
  const cursor = getHeroCoinCursor();
  if (!cursor) return;
  cursor.style.setProperty('--coin-x', `${Math.round(clientX)}px`);
  cursor.style.setProperty('--coin-y', `${Math.round(clientY)}px`);
  cursor.classList.add('is-visible');
}

function getScratchAudio() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!scratchAudio) {
    const context = new AudioContextConstructor();
    const master = context.createGain();
    master.gain.value = 0.42;
    master.connect(context.destination);
    scratchAudio = { context, master };
  }
  return scratchAudio;
}

function unlockScratchAudio() {
  const audio = getScratchAudio();
  if (!audio) return Promise.resolve(null);
  if (audio.context.state === 'suspended') {
    return audio.context.resume().then(() => audio).catch(() => audio);
  }
  return Promise.resolve(audio);
}

function playScratchPreview() {
  const audio = getScratchAudio();
  if (!audio || audio.context.state !== 'running') return;
  const now = audio.context.currentTime;
  const bell = audio.context.createOscillator();
  const bellGain = audio.context.createGain();
  const warm = audio.context.createOscillator();
  const warmGain = audio.context.createGain();

  bell.type = 'sine';
  bell.frequency.setValueAtTime(880, now);
  bell.frequency.exponentialRampToValueAtTime(1180, now + 0.11);
  bellGain.gain.setValueAtTime(0.0001, now);
  bellGain.gain.exponentialRampToValueAtTime(0.045, now + 0.018);
  bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  warm.type = 'triangle';
  warm.frequency.setValueAtTime(220, now);
  warm.frequency.exponentialRampToValueAtTime(185, now + 0.18);
  warmGain.gain.setValueAtTime(0.0001, now);
  warmGain.gain.exponentialRampToValueAtTime(0.02, now + 0.035);
  warmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  bell.connect(bellGain);
  warm.connect(warmGain);
  bellGain.connect(audio.master);
  warmGain.connect(audio.master);
  bell.start(now);
  warm.start(now);
  bell.stop(now + 0.24);
  warm.stop(now + 0.26);
}

function enableScratchAudioWithPreview() {
  scratchAudioEnabled = true;
  unlockScratchAudio().then(() => playScratchPreview());
}

function primeScratchAudio() {
  if (!scratchAudioEnabled || scratchAudioUnlockRequested) return;
  const audio = getScratchAudio();
  if (!audio || audio.context.state === 'running') return;

  scratchAudioUnlockRequested = true;
  unlockScratchAudio()
    .then(() => {
      if (audio.context.state !== 'running') scratchAudioUnlockRequested = false;
    })
    .catch(() => {
      scratchAudioUnlockRequested = false;
    });
}

function playCoinScratch(clientX, clientY, shouldResetReveal) {
  if (!scratchAudioEnabled) return;
  const audio = getScratchAudio();
  if (!audio) return;
  if (audio.context.state !== 'running') {
    primeScratchAudio();
    return;
  }

  const nowMs = performance.now();
  const distance = scratchAudioLastPoint
    ? Math.hypot(clientX - scratchAudioLastPoint.x, clientY - scratchAudioLastPoint.y)
    : 22;
  if (!shouldResetReveal && (nowMs - scratchAudioLastPlayedAt < 58 || distance < 7)) return;

  scratchAudioLastPlayedAt = nowMs;
  scratchAudioLastPoint = { x: clientX, y: clientY };

  const now = audio.context.currentTime;
  const duration = shouldResetReveal ? 0.2 : Math.min(0.26, 0.12 + distance / 650);
  const sampleRate = audio.context.sampleRate;
  const noiseLength = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = audio.context.createBuffer(1, noiseLength, sampleRate);
  const samples = buffer.getChannelData(0);

  let velvet = 0;
  let sparkle = 0;
  for (let index = 0; index < noiseLength; index += 1) {
    const white = Math.random() * 2 - 1;
    const tinyTap = Math.random() > 0.965 ? (Math.random() * 2 - 1) * 0.55 : 0;
    velvet = velvet * 0.94 + white * 0.06;
    sparkle = sparkle * 0.42 + tinyTap;
    const fadeIn = Math.min(1, index / (sampleRate * 0.026));
    const fadeOut = Math.min(1, (noiseLength - index) / (sampleRate * 0.1));
    const shimmerPulse = 0.72 + Math.sin((index / sampleRate) * Math.PI * 42) * 0.08;
    samples[index] = (velvet * 0.88 + sparkle * 0.12) * fadeIn * fadeOut * shimmerPulse;
  }

  const source = audio.context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 0.92 + Math.min(distance, 100) / 720;

  const lowCut = audio.context.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 210;

  const warmBody = audio.context.createBiquadFilter();
  warmBody.type = 'bandpass';
  warmBody.frequency.value = 780 + Math.random() * 260;
  warmBody.Q.value = 0.55 + Math.random() * 0.25;

  const silverAir = audio.context.createBiquadFilter();
  silverAir.type = 'peaking';
  silverAir.frequency.value = 2750 + Math.random() * 650;
  silverAir.Q.value = 1.1;
  silverAir.gain.value = 3.2;

  const softTop = audio.context.createBiquadFilter();
  softTop.type = 'highshelf';
  softTop.frequency.value = 4600;
  softTop.gain.value = -7.5;

  const noiseGain = audio.context.createGain();
  const noisePeak = Math.min(0.18, 0.07 + distance / 900);
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(noisePeak, now + 0.026);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const bell = audio.context.createOscillator();
  bell.type = 'sine';
  const bellStart = 720 + Math.random() * 110 + Math.min(distance, 90) * 0.95;
  bell.frequency.setValueAtTime(bellStart, now);
  bell.frequency.exponentialRampToValueAtTime(bellStart * 1.18, now + Math.min(0.16, duration));

  const bellGain = audio.context.createGain();
  const bellPeak = shouldResetReveal ? 0.034 : Math.min(0.026, 0.012 + distance / 4500);
  bellGain.gain.setValueAtTime(0.0001, now);
  bellGain.gain.exponentialRampToValueAtTime(bellPeak, now + 0.03);
  bellGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(duration + 0.03, 0.23));

  const warmTap = audio.context.createOscillator();
  warmTap.type = 'triangle';
  warmTap.frequency.setValueAtTime(170 + Math.random() * 35, now);
  warmTap.frequency.exponentialRampToValueAtTime(128 + Math.random() * 18, now + Math.min(0.14, duration));

  const tapGain = audio.context.createGain();
  tapGain.gain.setValueAtTime(0.0001, now);
  tapGain.gain.exponentialRampToValueAtTime(shouldResetReveal ? 0.026 : 0.014, now + 0.022);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(0.17, duration));

  source.connect(lowCut);
  lowCut.connect(warmBody);
  warmBody.connect(silverAir);
  silverAir.connect(softTop);
  softTop.connect(noiseGain);
  noiseGain.connect(audio.master);

  bell.connect(bellGain);
  bellGain.connect(audio.master);
  warmTap.connect(tapGain);
  tapGain.connect(audio.master);

  source.start(now);
  bell.start(now);
  warmTap.start(now);
  source.stop(now + duration + 0.03);
  bell.stop(now + Math.min(duration + 0.05, 0.25));
  warmTap.stop(now + Math.min(duration + 0.02, 0.18));
}

function resetCoinScratchSound() {
  scratchAudioLastPoint = null;
}

function showHeroWandReveal(keyword, clientX, clientY) {
  const state = getHeroRevealState(keyword);
  if (!state) return;
  const text = keyword.dataset.info || '';
  if (!text) return;
  const shouldResetReveal = !state.reveal.classList.contains('is-visible');
  const placement = positionHeroWandReveal(keyword, clientX, clientY, state.reveal, shouldResetReveal);
  if (!placement) return;
  applyHeroScratchMask(state, placement, clientX, clientY, shouldResetReveal);
  moveHeroCoinCursor(clientX, clientY);
  playCoinScratch(clientX, clientY, shouldResetReveal);
  heroStage?.classList.add('is-coin-cursor');
  heroKeywords.forEach((item) => item.classList.toggle('is-wand-active', item === keyword));
  if (shouldResetReveal) {
    state.reveal.classList.remove('is-visible');
    void state.reveal.offsetWidth;
  }
  state.reveal.removeAttribute('aria-hidden');
  state.reveal.classList.add('is-visible');
}

function releaseHeroCoinCursor() {
  heroStage?.classList.remove('is-coin-cursor');
  heroCoinCursor?.classList.remove('is-visible');
  resetCoinScratchSound();
  heroKeywords.forEach((keyword) => keyword.classList.remove('is-wand-active'));
}

function hideHeroWandReveal() {
  releaseHeroCoinCursor();
}

function setContactStatus(message, state = 'idle') {
  if (!contactStatus) return;
  contactStatus.textContent = message;
  contactStatus.dataset.state = state;
  contactForm?.setAttribute('data-state', state);
  contactCard?.classList.toggle('is-contact-sent', state === 'success');
}

function setMobileMenuOpen(isOpen) {
  if (!mobileMenuToggle || !mobileMenu) return;
  mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  mobileMenu.classList.toggle('is-open', isOpen);
  mobileMenu.toggleAttribute('hidden', !isOpen);
  mobileMenuToggle.closest('.topbar')?.classList.toggle('is-menu-open', isOpen);
}

function observeMobileMenu() {
  if (!mobileMenuToggle || !mobileMenu) return;

  setMobileMenuOpen(false);
  mobileMenuToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setMobileMenuOpen(mobileMenuToggle.getAttribute('aria-expanded') !== 'true');
  });
  mobileMenu.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  mobileMenuLinks.forEach((link) => {
    link.addEventListener('click', () => setMobileMenuOpen(false));
  });
  document.addEventListener('click', (event) => {
    if (mobileMenu.hidden) return;
    const target = event.target;
    if (target instanceof Node && (mobileMenu.contains(target) || mobileMenuToggle.contains(target))) return;
    setMobileMenuOpen(false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setMobileMenuOpen(false);
    mobileMenuToggle.focus();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) setMobileMenuOpen(false);
  });
}

function observeContactForm() {
  if (!contactForm) return;

  if (contactPageUrl) contactPageUrl.value = window.location.href;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (contactPageUrl) contactPageUrl.value = window.location.href;

    const submitButton = contactForm.querySelector('.contact-submit');
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    submitButton?.setAttribute('disabled', 'disabled');
    setContactStatus('Sending your request…', 'pending');

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        const errors = Array.isArray(result.errors) ? result.errors.join(', ') : result.error;
        throw new Error(errors || 'The request could not be sent.');
      }

      contactForm.reset();
      if (contactPageUrl) contactPageUrl.value = window.location.href;
      setContactStatus('Thank you — your request was sent. Redirecting to booking…', 'success');
      window.location.assign(contactBookingRedirectUrl);
    } catch (error) {
      setContactStatus(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });
}

function observeHeroWandReveal() {
  if (!heroSection || !heroStage || !heroWandReveal || !heroWandRevealText || !heroKeywords.length) return;
  heroSection.classList.add('has-wand-reveal');
  heroKeywords.forEach((keyword, index) => {
    keyword.dataset.keywordId = keyword.dataset.keywordId || `keyword-${index}`;
    keyword.addEventListener('focus', () => {
      requestAnimationFrame(() => {
        if (!keyword.matches(':focus-visible')) return;
        const placement = getHeroRevealPlacement(keyword);
        if (!placement) return;
        showHeroWandReveal(keyword, placement.viewportLeft + placement.width * 0.15, placement.viewportTop + placement.height * 0.5);
      });
    });
    keyword.addEventListener('blur', hideHeroWandReveal);
  });

  window.addEventListener('pointerdown', primeScratchAudio, { once: true, passive: true });
  window.addEventListener('touchstart', primeScratchAudio, { once: true, passive: true });
  window.addEventListener('keydown', primeScratchAudio, { once: true });

  heroStage.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const target = getHeroRevealTarget(event.clientX, event.clientY);
    if (!target) {
      releaseHeroCoinCursor();
      return;
    }
    showHeroWandReveal(target.keyword, event.clientX, event.clientY);
  }, { passive: true });
  heroStage.addEventListener('pointerleave', releaseHeroCoinCursor);
  heroStage.addEventListener('pointercancel', releaseHeroCoinCursor);
}

categoryButtons.forEach((button, index) => {
  const isActive = button.dataset.project === activeProjectKey;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', String(isActive));
  button.tabIndex = isActive ? 0 : -1;

  button.addEventListener('click', () => {
    if (projectSteps.length) scrollToProject(button.dataset.project);
    else updateProject(button.dataset.project);
  });

  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = clamp(index + direction, 0, projectKeys.length - 1);
    categoryButtons[nextIndex]?.focus();
    scrollToProject(nextIndex);
  });
});


const params = new URLSearchParams(window.location.search);
const requestedProject = params.get('project');
const shouldSkipSplash = params.get('preview') === 'site' || projectKeys.includes(requestedProject);
if (shouldSkipSplash) {
  splash?.classList.add('is-exiting');
  site?.classList.remove('is-hidden');
} else {
  runSplashScramble();
}

if (projectsSection && projectKeys.length) {
  projectsSection.style.setProperty('--project-count', String(projectKeys.length + 1));
  observeProjectSteps();
}

if (requestedProject && projectKeys.includes(requestedProject)) {
  window.requestAnimationFrame(() => {
    const targetStep = projectSteps.find((step) => step.dataset.projectStep === requestedProject);
    window.scrollTo({
      top: projectsSection.offsetTop + (targetStep?.offsetTop || 0),
      behavior: 'auto'
    });
  });
}

observeHeroWandReveal();
observeMobileMenu();
observeContactForm();
observeServicesHubScrollTransition();
observeContactScrollTransition();
observeProjectFeatureScrollTransition();
observeSections();
