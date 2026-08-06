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
      const card = hanger.querySelector('.founder-card');
      if (card instanceof HTMLElement) card.style.removeProperty('transform');
      hanger.dataset.founderPhysics = state;
    });
  };

  const runFounderPhysics = () => {
    if (!founderHangers.length || founderMotionQuery.matches) {
      settleFounderHangers('static');
      return;
    }

    const fixedStep = 1 / 60;
    const duration = 1200;
    const dropDistance = 80;
    const impactTime = 0.28;
    const swingAmplitude = 7.8;
    const swingDecay = 4.6;
    const swingFrequency = 13;
    const referenceGravity = Number((2 * dropDistance / (impactTime * impactTime)).toFixed(3));
    const frameTimes = [];
    for (let time = 0; time < duration / 1000; time += fixedStep) frameTimes.push(time);
    frameTimes.push(impactTime, duration / 1000);
    const uniqueFrameTimes = [...new Set(frameTimes.map((time) => Number(time.toFixed(6))))].sort((a, b) => a - b);
    founderHangers.forEach((hanger, index) => {
      const card = hanger.querySelector('.founder-card');
      const dropStrap = hanger.querySelector('.founder-card-drop-strap');
      const dropStrapInner = dropStrap?.querySelector('span');
      if (!(card instanceof HTMLElement) || !(dropStrap instanceof HTMLElement) || !(dropStrapInner instanceof HTMLElement)) return;
      const direction = index % 2 === 0 ? 1 : -1;
      const restTilt = Number.parseFloat(getComputedStyle(hanger).getPropertyValue('--hanger-tilt')) || 0;
      const keyframes = [];
      const dropStrapKeyframes = [];
      const dropStrapFoldKeyframes = [];

      uniqueFrameTimes.forEach((time, frameIndex) => {
        const progress = time / (duration / 1000);
        const settled = frameIndex === uniqueFrameTimes.length - 1;
        let vertical;
        let swingAngle;

        if (time <= impactTime) {
          vertical = -dropDistance + Math.min(dropDistance, 0.5 * referenceGravity * time * time);
          swingAngle = restTilt;
        } else {
          const sinceImpact = time - impactTime;
          vertical = 0;
          swingAngle = restTilt + direction * swingAmplitude * Math.exp(-swingDecay * sinceImpact) * Math.sin(swingFrequency * sinceImpact);
        }

        keyframes.push({
          offset: progress,
          transform: settled
            ? `translateY(0px) rotateZ(${restTilt.toFixed(3)}deg)`
            : `translateY(${vertical.toFixed(3)}px) rotateZ(${swingAngle.toFixed(3)}deg)`
        });
        const fallProgress = time <= impactTime
          ? Math.max(0, Math.min(1, (vertical + dropDistance) / dropDistance))
          : 1;
        dropStrapKeyframes.push({
          offset: progress,
          transform: settled ? 'translateX(-50%) translateY(0px)' : `translateX(-50%) translateY(${vertical.toFixed(3)}px)`
        });
        dropStrapFoldKeyframes.push({
          offset: progress,
          transform: settled ? 'scaleY(1)' : `scaleY(${Math.max(0.08, fallProgress).toFixed(4)})`
        });
      });

      hanger.dataset.founderPhysics = 'active';
      hanger.dataset.founderPhysicsModel = 'fixed-upper-strap-card-fast-drop-foldout-tether-stronger-swing';
      hanger.dataset.founderPhysicsOwner = 'card-plus-foldout-tether';
      hanger.dataset.founderPhysicsStraps = 'upper-fixed-lower-foldout';
      hanger.dataset.founderPhysicsDuration = String(duration);
      hanger.dataset.founderPhysicsStep = String(Number((fixedStep * 1000).toFixed(3)));
      hanger.dataset.founderPhysicsDropSettle = String(Math.round(impactTime * 1000));
      hanger.dataset.founderPhysicsSwingStart = String(Math.round(impactTime * 1000));
      hanger.dataset.founderPhysicsReferenceGravity = String(referenceGravity);
      hanger.dataset.founderPhysicsDropDistance = String(dropDistance);
      hanger.dataset.founderPhysicsSwingAmplitude = String(swingAmplitude);
      hanger.dataset.founderPhysicsSwingDecay = String(swingDecay);
      hanger.dataset.founderPhysicsSwingFrequency = String(swingFrequency);
      hanger.dataset.founderPhysicsPreImpactSwing = '0';
      hanger.dataset.founderPhysicsTetherLength = '28';
      hanger.dataset.founderPhysicsTetherFoldStart = '0.08';
      hanger.dataset.founderPhysicsTetherFinalOverlap = '0';
      const animation = card.animate(keyframes, {
        duration,
        easing: 'linear',
        fill: 'both',
        iterations: 1
      });
      const dropStrapAnimation = dropStrap.animate(dropStrapKeyframes, {
        duration,
        easing: 'linear',
        fill: 'both',
        iterations: 1
      });
      const dropStrapFoldAnimation = dropStrapInner.animate(dropStrapFoldKeyframes, {
        duration,
        easing: 'linear',
        fill: 'both',
        iterations: 1
      });
      const ownedAnimations = [animation, dropStrapAnimation, dropStrapFoldAnimation];
      ownedAnimations.forEach((ownedAnimation) => founderAnimations.add(ownedAnimation));
      animation.addEventListener('finish', () => {
        ownedAnimations.forEach((ownedAnimation) => {
          founderAnimations.delete(ownedAnimation);
          ownedAnimation.cancel();
        });
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
