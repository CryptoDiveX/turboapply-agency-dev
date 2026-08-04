(() => {
  'use strict';

  const railControls = document.querySelectorAll('[data-rail-control]');

  const moveRail = (rail, direction) => {
    const firstCard = rail.firstElementChild;
    if (!(firstCard instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || '0');
    const distance = firstCard.getBoundingClientRect().width + gap;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollBy({
      left: direction === 'previous' ? -distance : distance,
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  railControls.forEach((control) => {
    control.addEventListener('click', () => {
      const name = control.getAttribute('data-rail-control');
      const direction = control.getAttribute('data-direction');
      const rail = document.querySelector(`[data-horizontal-rail="${name}"]`);
      if (!(rail instanceof HTMLElement) || !['previous', 'next'].includes(direction)) return;
      moveRail(rail, direction);
    });
  });

  const founderHangers = [...document.querySelectorAll('.founder-card-hanger')];
  const founderMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const founderAnimations = new Set();

  const settleFounderHangers = (state = 'settled') => {
    founderAnimations.forEach((animation) => animation.cancel());
    founderAnimations.clear();
    founderHangers.forEach((hanger) => {
      hanger.style.removeProperty('transform');
      hanger.dataset.founderPhysics = state;
    });
  };

  const runFounderPhysics = () => {
    if (!founderHangers.length || founderMotionQuery.matches) {
      settleFounderHangers('static');
      return;
    }

    const fixedStep = 1 / 60;
    const duration = 3000;
    const frames = Math.round(duration / (fixedStep * 1000)) + 1;
    const dropSpring = 35;
    const dropDamping = 8;
    const pendulumGravity = 18;
    const angularDamping = 2.6;
    const swingDelay = 0.6;
    founderHangers.forEach((hanger, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      let vertical = -132;
      let verticalVelocity = 0;
      let angle = 0;
      let angularVelocity = 0;
      let swingReleased = false;
      const keyframes = [];

      for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
        const progress = frameIndex / (frames - 1);
        const time = frameIndex * fixedStep;
        const settled = frameIndex === frames - 1;
        keyframes.push({
          offset: progress,
          transform: `translateY(${settled ? 0 : vertical.toFixed(3)}px) rotate(${settled ? 0 : (angle * 180 / Math.PI).toFixed(3)}deg)`
        });

        verticalVelocity += (-dropSpring * vertical - dropDamping * verticalVelocity) * fixedStep;
        vertical += verticalVelocity * fixedStep;
        if (!swingReleased && time >= swingDelay) {
          angularVelocity = direction * (0.65 + index * 0.07);
          swingReleased = true;
        }
        angularVelocity += (-pendulumGravity * Math.sin(angle) - angularDamping * angularVelocity) * fixedStep;
        angle += angularVelocity * fixedStep;
      }

      hanger.dataset.founderPhysics = 'active';
      hanger.dataset.founderPhysicsModel = 'veyro-delayed-swing';
      hanger.dataset.founderPhysicsDuration = String(duration);
      hanger.dataset.founderPhysicsStep = String(Number((fixedStep * 1000).toFixed(3)));
      hanger.dataset.founderPhysicsDropSettle = '700';
      hanger.dataset.founderPhysicsSwingStart = String(Math.round(swingDelay * 1000));
      hanger.dataset.founderPhysicsReferenceGravity = '-40';
      const animation = hanger.animate(keyframes, {
        duration,
        easing: 'linear',
        fill: 'both',
        iterations: 1
      });
      founderAnimations.add(animation);
      animation.addEventListener('finish', () => {
        founderAnimations.delete(animation);
        hanger.dataset.founderPhysics = 'settled';
      }, { once: true });
    });
  };

  runFounderPhysics();
  founderMotionQuery.addEventListener('change', () => {
    if (founderMotionQuery.matches) settleFounderHangers('static');
  });

  const form = document.querySelector('[data-about-contact-form]');
  if (!(form instanceof HTMLFormElement)) return;

  const pageUrl = form.querySelector('[data-contact-page-url]');
  if (pageUrl instanceof HTMLInputElement) pageUrl.value = window.location.href;

  form.addEventListener('submit', (event) => {
    const status = form.querySelector('[data-about-contact-status]');
    const secureForm = window.TurboApplyFormSecurity;

    if (!secureForm?.prepare(form)) {
      event.preventDefault();
      return;
    }

    const isPreview = ['localhost', '127.0.0.1', 'dev.turboapply.agency'].includes(window.location.hostname);
    const isVersionSnapshot = document.body.hasAttribute('data-about-version');
    if (isVersionSnapshot || (isPreview && form.hasAttribute('data-preview-submit-disabled'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.dataset.previewSubmitIntercepted = 'true';
      if (status) {
        const message = isVersionSnapshot
          ? 'Version preview validated. Lead delivery is disabled on About comparison routes.'
          : 'Preview validated. Lead delivery is disabled in source and local previews.';
        status.textContent = message;
        if (isVersionSnapshot) queueMicrotask(() => { status.textContent = message; });
      }
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = true;
      submit.textContent = 'sending…';
    }
  });
})();
