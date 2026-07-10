const guideForm = document.querySelector('[data-free-guide-form]');
const submittedAt = document.querySelector('[data-submitted-at]');
const leadStatus = document.querySelector('[data-lead-status]');
const guideChallenge = document.querySelector('[data-guide-challenge]');

function setLeadStatus(message) {
  if (!leadStatus) return;
  leadStatus.textContent = message;
}

function appendTrackingToSource() {
  if (!guideForm) return;
  const source = guideForm.querySelector('input[name="source"]');
  if (!(source instanceof HTMLInputElement)) return;

  const params = new URLSearchParams(window.location.search);
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
  const tracking = trackingKeys
    .map((key) => [key, params.get(key)])
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');

  if (tracking) source.value = `${source.value} | ${tracking}`;
}

function syncCountryCode() {
  if (!guideForm) return '+1';

  const countryCode = guideForm.querySelector('input[name="countryCode"]');
  const countryLabel = guideForm.querySelector('input[name="countryLabel"]');
  if (!(countryCode instanceof HTMLInputElement)) return '+1';

  const labelValue = countryLabel instanceof HTMLInputElement ? countryLabel.value.trim() : '';
  const codeMatch = labelValue.match(/\((\+\d+)\)/);
  const normalizedCode = codeMatch?.[1] || countryCode.value.trim() || '+1';
  countryCode.value = normalizedCode;
  return normalizedCode;
}

function normalizePhoneWithCountryCode() {
  if (!guideForm) return;

  const phone = guideForm.querySelector('input[name="phone"]');
  if (!(phone instanceof HTMLInputElement)) return;

  const rawPhone = phone.value.trim();
  if (!rawPhone) return;

  const normalizedCode = syncCountryCode();
  const normalizedPhone = rawPhone.startsWith('+') ? rawPhone : `${normalizedCode} ${rawPhone}`;
  phone.value = normalizedPhone.replace(/\s+/g, ' ').trim();
}

function packGuideContext() {
  if (!guideForm || !(guideChallenge instanceof HTMLInputElement)) return;

  const businessName = guideForm.querySelector('input[name="businessName"]');
  const monthlyRevenue = guideForm.querySelector('select[name="monthlyRevenue"]');
  const email = guideForm.querySelector('input[name="email"]');
  const phone = guideForm.querySelector('input[name="phone"]');

  const lines = ['Free guide request.'];
  if (businessName instanceof HTMLInputElement && businessName.value.trim()) {
    lines.push(`Business name: ${businessName.value.trim()}`);
  }
  if (monthlyRevenue instanceof HTMLSelectElement && monthlyRevenue.value.trim()) {
    lines.push(`Current monthly revenue: ${monthlyRevenue.value.trim()}`);
  }
  if (email instanceof HTMLInputElement && email.value.trim()) {
    lines.push(`Email: ${email.value.trim()}`);
  }
  if (phone instanceof HTMLInputElement && phone.value.trim()) {
    lines.push(`Phone: ${phone.value.trim()}`);
  }

  guideChallenge.value = lines.join('\n');
}

function getRedirectUrl() {
  if (!guideForm) return '/book-meeting/?source=free-guide&thankyou=1';

  const redirect = guideForm.querySelector('input[name="redirect"]');
  if (redirect instanceof HTMLInputElement && redirect.value.trim()) {
    return redirect.value.trim();
  }

  return '/book-meeting/?source=free-guide&thankyou=1';
}

function shouldUseDevPreviewRedirect() {
  return window.location.hostname === 'dev.turboapply.agency';
}

if (guideForm) {
  appendTrackingToSource();
  const countryLabel = guideForm.querySelector('input[name="countryLabel"]');
  if (countryLabel instanceof HTMLInputElement) {
    countryLabel.addEventListener('input', syncCountryCode);
    countryLabel.addEventListener('change', syncCountryCode);
  }
  guideForm.addEventListener('submit', (event) => {
    if (submittedAt instanceof HTMLInputElement) {
      submittedAt.value = new Date().toISOString();
    }
    normalizePhoneWithCountryCode();
    packGuideContext();
    setLeadStatus('Submitting your request…');
    guideForm.querySelector('.guide-submit')?.setAttribute('disabled', 'disabled');

    if (shouldUseDevPreviewRedirect()) {
      event.preventDefault();
      setLeadStatus('Opening the booking calendar…');
      window.location.assign(getRedirectUrl());
    }
  });
}
