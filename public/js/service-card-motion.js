(function () {
  'use strict';

  const overlays = {
    website: `
      <svg class="ta-motion-card__overlay" viewBox="0 0 1122 1402" aria-hidden="true" focusable="false">
        <defs>
          <filter id="ta-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ta-web-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff6db" stop-opacity=".13"/>
            <stop offset="1" stop-color="#a8e0ca" stop-opacity=".04"/>
          </linearGradient>
        </defs>
        <g class="ta-layer ta-layer--back ta-float-b" opacity=".7">
          <rect x="274" y="790" width="455" height="310" rx="24" fill="url(#ta-web-glass)" stroke="rgba(246,239,215,.28)" stroke-width="2"/>
          <circle cx="306" cy="825" r="6" class="ta-small-dot"/><circle cx="329" cy="825" r="6" class="ta-small-dot"/><circle cx="352" cy="825" r="6" class="ta-small-dot"/>
        </g>
        <g class="ta-layer ta-layer--mid ta-float-a">
          <rect x="465" y="714" width="558" height="356" rx="26" class="ta-glass"/>
          <rect x="466" y="714" width="556" height="62" rx="26" fill="rgba(6,47,35,.26)"/>
          <circle cx="500" cy="746" r="7" fill="#fff1cf" opacity=".9"/><circle cx="526" cy="746" r="7" fill="#fff1cf" opacity=".75"/><circle cx="552" cy="746" r="7" fill="#fff1cf" opacity=".65"/>
          <rect x="504" y="812" width="240" height="150" rx="24" class="ta-soft-fill"/>
          <rect x="780" y="815" width="172" height="21" rx="10" fill="rgba(205,234,221,.22)"/>
          <rect x="780" y="854" width="204" height="21" rx="10" fill="rgba(205,234,221,.16)"/>
          <rect x="780" y="895" width="148" height="63" rx="18" fill="rgba(205,234,221,.13)"/>
        </g>
        <g class="ta-layer ta-layer--front ta-float-c">
          <rect x="866" y="999" width="206" height="340" rx="44" class="ta-glass"/>
          <rect x="925" y="1000" width="88" height="24" rx="12" fill="rgba(4,35,27,.68)"/>
          <rect x="907" y="1066" width="126" height="115" rx="24" class="ta-soft-fill"/>
          <rect x="907" y="1212" width="126" height="18" rx="9" fill="rgba(218,241,228,.24)"/>
          <rect x="907" y="1244" width="101" height="18" rx="9" fill="rgba(218,241,228,.17)"/>
        </g>
        <path class="ta-route" d="M 34 1191 C 205 1114 221 1275 403 1212 C 563 1156 611 1275 772 1223"/>
        <circle cx="332" cy="1227" r="10" class="ta-node"/>
      </svg>`,

    health: `
      <svg class="ta-motion-card__overlay" viewBox="0 0 1122 1402" aria-hidden="true" focusable="false">
        <defs>
          <filter id="ta-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ta-health-arch" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#c8a8ff" stop-opacity=".18"/>
            <stop offset="1" stop-color="#d8fff3" stop-opacity=".08"/>
          </linearGradient>
        </defs>
        <g class="ta-layer ta-layer--back ta-float-b">
          <path d="M683 780V626c0-135 106-244 237-244s237 109 237 244v154" fill="none" stroke="url(#ta-health-arch)" stroke-width="62" opacity=".72"/>
          <path d="M704 785V633c0-121 96-219 215-219s215 98 215 219v152" fill="none" stroke="rgba(218,191,255,.24)" stroke-width="3"/>
        </g>
        <g class="ta-layer ta-layer--mid ta-float-a">
          <rect x="505" y="712" width="562" height="363" rx="28" class="ta-glass"/>
          <circle cx="540" cy="748" r="7" fill="#fff1e0" opacity=".9"/><circle cx="566" cy="748" r="7" fill="#fff1e0" opacity=".72"/><circle cx="592" cy="748" r="7" fill="#fff1e0" opacity=".55"/>
          <rect x="544" y="810" width="224" height="148" rx="25" fill="rgba(190,151,245,.10)" stroke="rgba(226,210,255,.24)" stroke-width="2"/>
          <rect x="803" y="816" width="196" height="20" rx="10" fill="rgba(222,236,228,.19)"/>
          <rect x="803" y="854" width="172" height="20" rx="10" fill="rgba(222,236,228,.15)"/>
          <rect x="803" y="895" width="77" height="62" rx="19" fill="rgba(184,146,241,.14)"/>
          <rect x="897" y="895" width="91" height="62" rx="19" fill="rgba(184,146,241,.10)"/>
        </g>
        <g class="ta-layer ta-layer--front ta-float-c">
          <rect x="420" y="827" width="177" height="336" rx="29" class="ta-soft-fill"/>
          <circle cx="462" cy="890" r="12" fill="rgba(192,233,215,.35)"/>
          <rect x="492" y="879" width="70" height="20" rx="10" fill="rgba(192,233,215,.21)"/>
          <circle cx="462" cy="949" r="12" fill="rgba(196,153,245,.34)"/>
          <rect x="492" y="938" width="70" height="20" rx="10" fill="rgba(196,153,245,.19)"/>
          <circle cx="462" cy="1008" r="12" fill="rgba(192,233,215,.31)"/>
          <rect x="492" y="997" width="70" height="20" rx="10" fill="rgba(192,233,215,.18)"/>
        </g>
        <path class="ta-wave ta-accent-line" opacity=".58" d="M 85 1245 C 248 1133 340 1335 509 1226 C 667 1124 761 1304 1030 1166"/>
        <circle cx="404" cy="1261" r="10" class="ta-node"/>
      </svg>`,

    email: `
      <svg class="ta-motion-card__overlay" viewBox="0 0 1122 1402" aria-hidden="true" focusable="false">
        <defs>
          <filter id="ta-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ta-mail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff1cf" stop-opacity=".28"/>
            <stop offset="1" stop-color="#d0e8dc" stop-opacity=".06"/>
          </linearGradient>
        </defs>
        <g class="ta-layer ta-layer--back ta-envelope-b" opacity=".62">
          <rect x="430" y="835" width="312" height="206" rx="27" fill="url(#ta-mail)" stroke="rgba(246,239,215,.22)" stroke-width="2"/>
          <path d="M448 857l138 111 138-111" fill="none" stroke="rgba(246,239,215,.28)" stroke-width="3"/>
        </g>
        <g class="ta-layer ta-layer--mid ta-envelope-a">
          <rect x="650" y="921" width="324" height="223" rx="31" class="ta-glass"/>
          <path d="M673 946l139 116 139-116" fill="none" stroke="rgba(255,245,221,.62)" stroke-width="4"/>
          <path d="M671 1121l111-94M952 1121l-111-94" fill="none" stroke="rgba(214,235,222,.28)" stroke-width="3"/>
        </g>
        <path class="ta-route" d="M 92 1120 C 251 1040 351 1217 505 1084 C 655 954 726 829 903 620"/>
        <circle cx="454" cy="1107" r="10" class="ta-node"/>
        <circle cx="733" cy="844" r="8" class="ta-node" opacity=".84"/>
        <g class="ta-layer ta-layer--front ta-plane">
          <path d="M840 568L1077 496L958 640L931 584L840 568Z" fill="#fff0cf" fill-opacity=".48" stroke="rgba(255,244,216,.9)" stroke-width="2.3"/>
          <path d="M931 584L1077 496L958 640Z" fill="#eacb91" fill-opacity=".30"/>
          <path d="M931 584L997 550" class="ta-accent-line" opacity=".74"/>
        </g>
      </svg>`,

    ai: `
      <svg class="ta-motion-card__overlay" viewBox="0 0 1122 1402" aria-hidden="true" focusable="false">
        <defs>
          <filter id="ta-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ta-bot-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff0c9" stop-opacity=".42"/>
            <stop offset="1" stop-color="#c5e8d7" stop-opacity=".12"/>
          </linearGradient>
        </defs>
        <g class="ta-layer ta-layer--back ta-float-b" opacity=".67">
          <rect x="513" y="689" width="286" height="161" rx="28" class="ta-glass"/>
          <circle cx="548" cy="724" r="6" fill="#fff0cd" opacity=".8"/><circle cx="573" cy="724" r="6" fill="#fff0cd" opacity=".62"/><circle cx="598" cy="724" r="6" fill="#fff0cd" opacity=".45"/>
          <rect x="548" y="765" width="112" height="17" rx="8" fill="rgba(207,232,218,.22)"/>
          <rect x="548" y="798" width="87" height="17" rx="8" fill="rgba(207,232,218,.16)"/>
        </g>
        <g class="ta-layer ta-layer--front ta-float-a">
          <rect x="654" y="735" width="377" height="320" rx="132" fill="url(#ta-bot-ring)" stroke="rgba(255,242,209,.46)" stroke-width="3" class="ta-bot-rim"/>
          <rect x="711" y="793" width="265" height="177" rx="86" fill="rgba(3,37,28,.78)" stroke="rgba(209,235,220,.25)" stroke-width="2"/>
          <rect x="790" y="846" width="23" height="67" rx="12" fill="#fff1cc" class="ta-eye"/>
          <rect x="874" y="846" width="23" height="67" rx="12" fill="#fff1cc" class="ta-eye"/>
        </g>
        <g class="ta-layer ta-layer--mid">
          <path class="ta-route" d="M 72 1212 H 237 Q 284 1212 284 1165 V 1042 Q 284 996 330 996 H 417 Q 463 996 463 1042 V 1115 Q 463 1161 509 1161 H 625"/>
          <path class="ta-route" d="M 226 1192 V 1080 Q 226 1037 269 1037 H 352" opacity=".56"/>
          <circle cx="233" cy="1212" r="10" class="ta-node"/>
          <circle cx="463" cy="1116" r="10" class="ta-node"/>
          <circle cx="352" cy="1037" r="9" class="ta-node" opacity=".78"/>
          <circle cx="625" cy="1161" r="9" class="ta-node" opacity=".78"/>
        </g>
      </svg>`
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function setPointerVars(card, clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const nx = (x / rect.width) * 2 - 1;
    const ny = (y / rect.height) * 2 - 1;

    card.style.setProperty('--ta-rx', `${(-ny * 2.8).toFixed(2)}deg`);
    card.style.setProperty('--ta-ry', `${(nx * 3.4).toFixed(2)}deg`);
    card.style.setProperty('--ta-shift-x', `${(nx * 10).toFixed(2)}px`);
    card.style.setProperty('--ta-shift-y', `${(ny * 10).toFixed(2)}px`);
    card.style.setProperty('--ta-glow-x', `${((nx + 1) * 50).toFixed(1)}%`);
    card.style.setProperty('--ta-glow-y', `${((ny + 1) * 50).toFixed(1)}%`);
  }

  function resetPointerVars(card) {
    card.style.setProperty('--ta-rx', '0deg');
    card.style.setProperty('--ta-ry', '0deg');
    card.style.setProperty('--ta-shift-x', '0px');
    card.style.setProperty('--ta-shift-y', '0px');
    card.style.setProperty('--ta-glow-x', '50%');
    card.style.setProperty('--ta-glow-y', '50%');
  }

  function enhanceCard(card) {
    if (card.dataset.taMotionReady === 'true') return;
    card.dataset.taMotionReady = 'true';

    const type = card.dataset.cardType;
    if (!overlays[type]) {
      console.warn(`[TurboApplyMotionCards] Unknown card type: ${type}`);
      return;
    }

    const media = card.querySelector('.ta-motion-card__media');
    if (!media) {
      console.warn('[TurboApplyMotionCards] Missing .ta-motion-card__media', card);
      return;
    }

    if (!media.querySelector('.ta-motion-card__overlay')) {
      media.insertAdjacentHTML('beforeend', overlays[type]);
    }

    const overlay = media.querySelector('.ta-motion-card__overlay');
    const glowFilter = overlay?.querySelector('#ta-soft-glow');
    if (glowFilter) {
      const glowFilterId = `ta-soft-glow-${type}`;
      glowFilter.id = glowFilterId;
      overlay.querySelectorAll('.ta-glass').forEach((element) => {
        element.style.filter = `url(#${glowFilterId})`;
      });
    }

    if (!media.querySelector('.ta-motion-card__sheen')) {
      media.insertAdjacentHTML('beforeend', '<span class="ta-motion-card__sheen" aria-hidden="true"></span>');
    }

    let frame = null;
    let lastEvent = null;
    let touchTimer = null;

    const onPointerMove = (event) => {
      if (reducedMotion.matches || !finePointer.matches) return;
      lastEvent = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setPointerVars(card, lastEvent.clientX, lastEvent.clientY);
        frame = null;
      });
    };

    const onPointerEnter = () => {
      if (!reducedMotion.matches) card.classList.add('is-active');
    };

    const onPointerLeave = (event) => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      lastEvent = null;
      if (event.pointerType !== 'mouse' && !finePointer.matches) return;
      card.classList.remove('is-active');
      resetPointerVars(card);
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse') return;
      window.clearTimeout(touchTimer);
      card.classList.add('is-active');
      touchTimer = window.setTimeout(() => card.classList.remove('is-active'), 1500);
    };

    card.addEventListener('pointermove', onPointerMove, { passive: true });
    card.addEventListener('pointerenter', onPointerEnter, { passive: true });
    card.addEventListener('pointerleave', onPointerLeave, { passive: true });
    card.addEventListener('pointerdown', onPointerDown, { passive: true });
    card.addEventListener('blur', () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      lastEvent = null;
      card.classList.remove('is-active');
      resetPointerVars(card);
    }, true);
  }

  function initTurboApplyMotionCards(root = document) {
    const cards = Array.from(root.querySelectorAll('[data-ta-motion-card]'));
    cards.forEach(enhanceCard);

    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ta-in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
      cards.forEach((card) => observer.observe(card));
    } else {
      cards.forEach((card) => card.classList.add('ta-in-view'));
    }

    return cards;
  }

  window.TurboApplyMotionCards = {
    init: initTurboApplyMotionCards,
    enhance: enhanceCard
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTurboApplyMotionCards());
  } else {
    initTurboApplyMotionCards();
  }
})();
