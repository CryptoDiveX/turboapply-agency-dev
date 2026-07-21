(() => {
  'use strict';

  const form = document.querySelector('[data-services-lead-form]');
  const status = document.querySelector('[data-services-lead-status]');
  if (!(form instanceof HTMLFormElement)) return;

  const host = window.location.hostname.toLowerCase();
  const isPreview = host === 'dev.turboapply.agency' || host === 'localhost' || host === '127.0.0.1';

  form.addEventListener('submit', (event) => {
    if (!window.TurboApplyFormSecurity?.prepare(form)) {
      event.preventDefault();
      return;
    }

    if (isPreview && form.hasAttribute('data-preview-submit-disabled')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.dataset.previewSubmitIntercepted = 'true';
      if (status) status.textContent = 'Preview validated. Lead delivery is disabled on DevNet and local previews.';
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    if (status) status.textContent = 'Sending your request…';
  });
})();