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
    const duration = 1400;
    const frames = Math.round(duration / (fixedStep * 1000)) + 1;
    const dropDistance = 132;
    const impactTime = 0.36;
    const referenceGravity = 2130;
    const foldedStart = -86;
    const impactFold = 6;
    const impactBounce = 6;
    founderHangers.forEach((hanger, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const keyframes = [];

      for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
        const progress = frameIndex / (frames - 1);
        const time = frameIndex * fixedStep;
        const settled = frameIndex === frames - 1;
        let vertical;
        let foldAngle;
        let swingAngle;

        if (time < impactTime) {
          const fallProgress = time / impactTime;
          vertical = -dropDistance + 0.5 * referenceGravity * time * time;
          foldAngle = foldedStart * (1 - Math.pow(fallProgress, 3.4));
          swingAngle = direction * 2.6 * (1 - Math.pow(fallProgress, 1.8));
        } else {
          const sinceImpact = time - impactTime;
          vertical = impactBounce * Math.exp(-9 * sinceImpact) * Math.cos(22 * sinceImpact);
          foldAngle = impactFold * Math.exp(-10 * sinceImpact) * Math.cos(22 * sinceImpact);
          swingAngle = direction * 4.2 * Math.exp(-3.9 * sinceImpact) * Math.sin(12 * sinceImpact);
        }

        keyframes.push({
          offset: progress,
          transform: settled
            ? 'perspective(1400px) translateY(0px) rotateX(0deg) rotateZ(0deg)'
            : `perspective(1400px) translateY(${vertical.toFixed(3)}px) rotateX(${foldAngle.toFixed(3)}deg) rotateZ(${swingAngle.toFixed(3)}deg)`
        });
      }

      hanger.dataset.founderPhysics = 'active';
      hanger.dataset.founderPhysicsModel = 'reference-gravity-fold-release';
      hanger.dataset.founderPhysicsDuration = String(duration);
      hanger.dataset.founderPhysicsStep = String(Number((fixedStep * 1000).toFixed(3)));
      hanger.dataset.founderPhysicsDropSettle = String(Math.round(impactTime * 1000));
      hanger.dataset.founderPhysicsSwingStart = String(Math.round(impactTime * 1000));
      hanger.dataset.founderPhysicsReferenceGravity = String(referenceGravity);
      hanger.dataset.founderPhysicsDropDistance = String(dropDistance);
      hanger.dataset.founderPhysicsFoldStart = String(foldedStart);
      hanger.dataset.founderPhysicsImpactFold = String(impactFold);
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
