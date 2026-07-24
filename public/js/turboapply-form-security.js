(() => {
  'use strict';

  const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
  const MESSENGER_PATTERN = /^(?:@(?=[A-Za-z0-9_]{5,32}$)(?=[A-Za-z0-9_]*[A-Za-z0-9])[A-Za-z0-9_]+|(?:telegram|whatsapp|signal|wechat)\s*[:@]\s*(?:[A-Za-z0-9][A-Za-z0-9_.-]{2,63}|\+?\d{7,15})|https:\/\/(?:t\.me\/(?=[A-Za-z0-9_]{5,32}\/?$)(?=[A-Za-z0-9_]*[A-Za-z0-9])[A-Za-z0-9_]{5,32}|wa\.me\/\d{7,15})\/?)$/i;
  const PHONE_CHARS = /^[+\d().\-\s#xextnsion]+$/i;
  const URL_PATTERN = /(?:https?:\/\/|www\.|\[url(?:=|\])|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|net|org|ca|io|co|to|ru|cn|info|biz|xyz|site|online|app|me|us|uk)\b)/i;
  const BB_CODE_URL_PATTERN = /\[url(?:=|\])/i;
  const TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];

  const field = (form, name) => form.elements.namedItem(name);
  const fieldValue = (form, name) => {
    const control = field(form, name);
    return control && 'value' in control ? String(control.value || '').trim() : '';
  };

  const setFieldValue = (form, name, value) => {
    const control = field(form, name);
    if (control && 'value' in control) control.value = value;
  };

  const canonicalHost = () => {
    const host = window.location.hostname.toLowerCase();
    if (host === 'www.turboapply.agency') return 'turboapply.agency';
    if (host === 'localhost' || host === '127.0.0.1') return 'dev.turboapply.agency';
    return host;
  };

  const isPreviewHost = () => {
    const host = window.location.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('dev.');
  };

  const newSubmissionKey = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues?.(bytes);
    if (bytes.some(Boolean)) return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const ensureHiddenField = (form, name) => {
    let control = field(form, name);
    if (control instanceof HTMLInputElement) return control;
    control = document.createElement('input');
    control.type = 'hidden';
    control.name = name;
    form.append(control);
    return control;
  };

  const stampMetadata = (form) => {
    const host = canonicalHost();
    ensureHiddenField(form, 'source').value = host;
    ensureHiddenField(form, 'submittedAt').value = new Date().toISOString();
    const idempotency = ensureHiddenField(form, 'submissionIdempotencyKey');
    if (!idempotency.value.trim()) idempotency.value = newSubmissionKey();

    const params = new URLSearchParams(window.location.search);
    TRACKING_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) ensureHiddenField(form, key).value = value.slice(0, 200);
    });

    if (
      host.startsWith('dev.') &&
      !form.hasAttribute('data-preview-submit-disabled') &&
      ['/submit-lead.php', '/api/contact'].includes(new URL(form.action, window.location.href).pathname)
    ) {
      form.action = 'https://turboapply.agency/submit-lead.php';
    }
  };

  const normalizedPhoneCandidate = (value, countryCode = '') => {
    const phone = String(value || '').trim();
    if (!phone || phone.startsWith('+') || !/^\+\d{1,3}$/.test(countryCode)) return phone;
    let digits = phone.replace(/\D/g, '');
    if (countryCode !== '+1') digits = digits.replace(/^0+/, '');
    return `${countryCode}${digits}`;
  };

  const parsePhone = (value, countryCode = '') => {
    const parser = window.libphonenumber?.parsePhoneNumberFromString;
    if (typeof parser !== 'function') return null;
    const candidate = normalizedPhoneCandidate(value, countryCode);
    try {
      return candidate.startsWith('+') ? parser(candidate) : parser(candidate, 'CA');
    } catch (_) {
      return null;
    }
  };

  const validatePhone = (value, countryCode = '') => {
    const phone = String(value || '').trim();
    if (!phone || !PHONE_CHARS.test(phone)) return false;
    const parsed = parsePhone(phone, countryCode);
    return Boolean(parsed?.isValid?.());
  };

  const formatPhone = (control) => {
    if (!(control instanceof HTMLInputElement) || !control.value.trim()) return;
    const countryCode = control.form ? fieldValue(control.form, 'countryCode') : '';
    const parsed = parsePhone(control.value, countryCode);
    if (!parsed?.isValid?.()) return;
    control.value = parsed.countryCallingCode === '1' ? parsed.formatNational() : parsed.formatInternational();
  };

  const validatePhoneOrMessenger = (value) => {
    const contact = String(value || '').trim();
    if (!contact || /[\r\n]/.test(contact) || contact.length > 254) return false;
    if (EMAIL_PATTERN.test(contact)) return false;
    if (/^[+\d(]/.test(contact) && PHONE_CHARS.test(contact)) return validatePhone(contact);
    return MESSENGER_PATTERN.test(contact);
  };

  const validateContact = (value) => EMAIL_PATTERN.test(String(value || '').trim()) || validatePhoneOrMessenger(value);

  const randomToken = (value) => {
    const text = String(value || '').trim();
    if (!/^[A-Za-z]{16,}$/.test(text)) return false;
    const upper = (text.match(/[A-Z]/g) || []).length;
    const lower = (text.match(/[a-z]/g) || []).length;
    const vowels = (text.match(/[AEIOUaeiou]/g) || []).length;
    let transitions = 0;
    for (let index = 1; index < text.length; index += 1) {
      if (/[A-Z]/.test(text[index]) !== /[A-Z]/.test(text[index - 1])) transitions += 1;
    }
    return upper >= 3 && lower >= 3 && transitions >= 7 && vowels / text.length <= 0.28;
  };

  const setError = (control, message) => {
    if (!control || typeof control.setCustomValidity !== 'function') return;
    control.setCustomValidity(message);
  };

  const clearErrors = (form) => {
    Array.from(form.elements).forEach((control) => {
      if (typeof control.setCustomValidity === 'function') control.setCustomValidity('');
    });
  };

  const validateForm = (form) => {
    // Honeypot values are deliberately preserved and ignored here so bots receive no frontend detection signal.
    clearErrors(form);
    const name = fieldValue(form, 'name');
    const messageControl = field(form, 'message') || field(form, 'challenge');
    const message = messageControl && 'value' in messageControl ? String(messageControl.value || '').trim() : '';
    const nameControl = field(form, 'name');
    const contactControl = field(form, 'contact');
    const emailControl = field(form, 'email');
    const phoneControl = field(form, 'phone');

    if (name && (name.length < 2 || name.length > 120)) setError(nameControl, 'Enter a name between 2 and 120 characters.');
    else if (URL_PATTERN.test(name)) setError(nameControl, 'Links are not allowed in the name field.');

    if (messageControl) {
      if (!message) setError(messageControl, 'Tell us briefly what you need help with.');
      else if (message.length < 8 || message.length > 1800) setError(messageControl, 'Use between 8 and 1800 characters.');
      else if (BB_CODE_URL_PATTERN.test(message)) setError(messageControl, 'URL markup is not accepted.');
      else if (randomToken(name) && randomToken(message)) setError(messageControl, 'Enter a meaningful goal or question.');
    }

    if (contactControl && 'value' in contactControl && !validatePhoneOrMessenger(contactControl.value)) {
      setError(contactControl, 'Enter a valid phone number or supported messenger handle.');
    }
    if (emailControl && 'value' in emailControl && String(emailControl.value || '').trim() && !EMAIL_PATTERN.test(String(emailControl.value || '').trim())) {
      setError(emailControl, 'Enter a valid email address.');
    }
    if (phoneControl && 'value' in phoneControl && !validatePhone(phoneControl.value, fieldValue(form, 'countryCode'))) {
      setError(phoneControl, 'Enter a valid phone number with country code.');
    }

    const valid = form.checkValidity();
    if (!valid) form.reportValidity();
    return valid;
  };

  const prepare = (form) => {
    if (!(form instanceof HTMLFormElement)) return false;
    stampMetadata(form);
    return validateForm(form);
  };

  const rotateIdempotencyKey = (form) => {
    if (!(form instanceof HTMLFormElement)) return;
    ensureHiddenField(form, 'submissionIdempotencyKey').value = newSubmissionKey();
  };

  const previewStatus = (form) => {
    let status = form.querySelector('[data-preview-delivery-status]');
    if (status) return status;
    status = document.createElement('p');
    status.hidden = true;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('data-preview-delivery-status', '');
    form.append(status);
    return status;
  };

  const bindForm = (form) => {
    if (!(form instanceof HTMLFormElement) || form.dataset.turboapplySecurityBound === 'true') return;
    form.dataset.turboapplySecurityBound = 'true';
    stampMetadata(form);
    form.addEventListener('submit', (event) => {
      if (!prepare(form)) {
        event.preventDefault();
        return;
      }
      const isVersionSnapshot = document.body.hasAttribute('data-about-version');
      if (isVersionSnapshot || (form.hasAttribute('data-preview-submit-disabled') && isPreviewHost())) {
        event.preventDefault();
        event.stopImmediatePropagation();
        form.dataset.previewSubmitIntercepted = 'true';
        const status = previewStatus(form);
        status.textContent = isVersionSnapshot
          ? 'Version preview validated. Lead delivery is disabled on About comparison routes.'
          : 'Preview validated. Lead delivery is disabled in source and local previews.';
        status.hidden = false;
      }
    }, { capture: true });
    form.addEventListener('input', (event) => {
      if (event.target && typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    });
    form.querySelectorAll('input[type="tel"]').forEach((control) => {
      control.addEventListener('blur', () => formatPhone(control));
    });
  };

  const init = (root = document) => {
    root.querySelectorAll('form[data-turboapply-secure-form]').forEach(bindForm);
  };

  window.TurboApplyFormSecurity = {
    init,
    prepare,
    stampMetadata,
    validateForm,
    validatePhone,
    validateContact,
    validatePhoneOrMessenger,
    rotateIdempotencyKey,
    newSubmissionKey,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
