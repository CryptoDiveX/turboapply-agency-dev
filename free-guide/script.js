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

if (guideForm) {
  appendTrackingToSource();
  guideForm.addEventListener('submit', () => {
    if (submittedAt instanceof HTMLInputElement) {
      submittedAt.value = new Date().toISOString();
    }
    packGuideContext();
    setLeadStatus('Submitting your request…');
    guideForm.querySelector('.guide-submit')?.setAttribute('disabled', 'disabled');
  });
}
