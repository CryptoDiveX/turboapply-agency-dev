const guideForm = document.querySelector('[data-free-guide-form]');
const submittedAt = document.querySelector('[data-submitted-at]');
const leadStatus = document.querySelector('[data-lead-status]');
const guideChallenge = document.querySelector('[data-guide-challenge]');

const COUNTRY_OPTIONS = [{"name":"Canada / United States","code":"+1","region":"CA-US"},{"name":"Afghanistan","code":"+93","region":"AF"},{"name":"Albania","code":"+355","region":"AL"},{"name":"Algeria","code":"+213","region":"DZ"},{"name":"American Samoa","code":"+1","region":"AS"},{"name":"Andorra","code":"+376","region":"AD"},{"name":"Angola","code":"+244","region":"AO"},{"name":"Anguilla","code":"+1","region":"AI"},{"name":"Antigua and Barbuda","code":"+1","region":"AG"},{"name":"Argentina","code":"+54","region":"AR"},{"name":"Armenia","code":"+374","region":"AM"},{"name":"Aruba","code":"+297","region":"AW"},{"name":"Ascension Island","code":"+247","region":"AC"},{"name":"Australia","code":"+61","region":"AU"},{"name":"Austria","code":"+43","region":"AT"},{"name":"Azerbaijan","code":"+994","region":"AZ"},{"name":"Bahamas","code":"+1","region":"BS"},{"name":"Bahrain","code":"+973","region":"BH"},{"name":"Bangladesh","code":"+880","region":"BD"},{"name":"Barbados","code":"+1","region":"BB"},{"name":"Belarus","code":"+375","region":"BY"},{"name":"Belgium","code":"+32","region":"BE"},{"name":"Belize","code":"+501","region":"BZ"},{"name":"Benin","code":"+229","region":"BJ"},{"name":"Bermuda","code":"+1","region":"BM"},{"name":"Bhutan","code":"+975","region":"BT"},{"name":"Bolivia","code":"+591","region":"BO"},{"name":"Bosnia and Herzegovina","code":"+387","region":"BA"},{"name":"Botswana","code":"+267","region":"BW"},{"name":"Brazil","code":"+55","region":"BR"},{"name":"British Indian Ocean Territory","code":"+246","region":"IO"},{"name":"British Virgin Islands","code":"+1","region":"VG"},{"name":"Brunei","code":"+673","region":"BN"},{"name":"Bulgaria","code":"+359","region":"BG"},{"name":"Burkina Faso","code":"+226","region":"BF"},{"name":"Burundi","code":"+257","region":"BI"},{"name":"Cabo Verde","code":"+238","region":"CV"},{"name":"Cambodia","code":"+855","region":"KH"},{"name":"Cameroon","code":"+237","region":"CM"},{"name":"Caribbean Netherlands","code":"+599","region":"BQ"},{"name":"Cayman Islands","code":"+1","region":"KY"},{"name":"Central African Republic","code":"+236","region":"CF"},{"name":"Chad","code":"+235","region":"TD"},{"name":"Chile","code":"+56","region":"CL"},{"name":"China","code":"+86","region":"CN"},{"name":"Christmas Island","code":"+61","region":"CX"},{"name":"Cocos (Keeling) Islands","code":"+61","region":"CC"},{"name":"Colombia","code":"+57","region":"CO"},{"name":"Comoros","code":"+269","region":"KM"},{"name":"Cook Islands","code":"+682","region":"CK"},{"name":"Costa Rica","code":"+506","region":"CR"},{"name":"Croatia","code":"+385","region":"HR"},{"name":"Cuba","code":"+53","region":"CU"},{"name":"Curaçao","code":"+599","region":"CW"},{"name":"Cyprus","code":"+357","region":"CY"},{"name":"Czechia","code":"+420","region":"CZ"},{"name":"Democratic Republic of the Congo","code":"+243","region":"CD"},{"name":"Denmark","code":"+45","region":"DK"},{"name":"Djibouti","code":"+253","region":"DJ"},{"name":"Dominica","code":"+1","region":"DM"},{"name":"Dominican Republic","code":"+1","region":"DO"},{"name":"Ecuador","code":"+593","region":"EC"},{"name":"Egypt","code":"+20","region":"EG"},{"name":"El Salvador","code":"+503","region":"SV"},{"name":"Equatorial Guinea","code":"+240","region":"GQ"},{"name":"Eritrea","code":"+291","region":"ER"},{"name":"Estonia","code":"+372","region":"EE"},{"name":"Eswatini","code":"+268","region":"SZ"},{"name":"Ethiopia","code":"+251","region":"ET"},{"name":"Falkland Islands","code":"+500","region":"FK"},{"name":"Faroe Islands","code":"+298","region":"FO"},{"name":"Fiji","code":"+679","region":"FJ"},{"name":"Finland","code":"+358","region":"FI"},{"name":"France","code":"+33","region":"FR"},{"name":"French Guiana","code":"+594","region":"GF"},{"name":"French Polynesia","code":"+689","region":"PF"},{"name":"Gabon","code":"+241","region":"GA"},{"name":"Gambia","code":"+220","region":"GM"},{"name":"Georgia","code":"+995","region":"GE"},{"name":"Germany","code":"+49","region":"DE"},{"name":"Ghana","code":"+233","region":"GH"},{"name":"Gibraltar","code":"+350","region":"GI"},{"name":"Greece","code":"+30","region":"GR"},{"name":"Greenland","code":"+299","region":"GL"},{"name":"Grenada","code":"+1","region":"GD"},{"name":"Guadeloupe","code":"+590","region":"GP"},{"name":"Guam","code":"+1","region":"GU"},{"name":"Guatemala","code":"+502","region":"GT"},{"name":"Guernsey","code":"+44","region":"GG"},{"name":"Guinea","code":"+224","region":"GN"},{"name":"Guinea-Bissau","code":"+245","region":"GW"},{"name":"Guyana","code":"+592","region":"GY"},{"name":"Haiti","code":"+509","region":"HT"},{"name":"Honduras","code":"+504","region":"HN"},{"name":"Hong Kong","code":"+852","region":"HK"},{"name":"Hungary","code":"+36","region":"HU"},{"name":"Iceland","code":"+354","region":"IS"},{"name":"India","code":"+91","region":"IN"},{"name":"Indonesia","code":"+62","region":"ID"},{"name":"Iran","code":"+98","region":"IR"},{"name":"Iraq","code":"+964","region":"IQ"},{"name":"Ireland","code":"+353","region":"IE"},{"name":"Isle of Man","code":"+44","region":"IM"},{"name":"Israel","code":"+972","region":"IL"},{"name":"Italy","code":"+39","region":"IT"},{"name":"Ivory Coast","code":"+225","region":"CI"},{"name":"Jamaica","code":"+1","region":"JM"},{"name":"Japan","code":"+81","region":"JP"},{"name":"Jersey","code":"+44","region":"JE"},{"name":"Jordan","code":"+962","region":"JO"},{"name":"Kazakhstan","code":"+7","region":"KZ"},{"name":"Kenya","code":"+254","region":"KE"},{"name":"Kiribati","code":"+686","region":"KI"},{"name":"Kosovo","code":"+383","region":"XK"},{"name":"Kuwait","code":"+965","region":"KW"},{"name":"Kyrgyzstan","code":"+996","region":"KG"},{"name":"Laos","code":"+856","region":"LA"},{"name":"Latvia","code":"+371","region":"LV"},{"name":"Lebanon","code":"+961","region":"LB"},{"name":"Lesotho","code":"+266","region":"LS"},{"name":"Liberia","code":"+231","region":"LR"},{"name":"Libya","code":"+218","region":"LY"},{"name":"Liechtenstein","code":"+423","region":"LI"},{"name":"Lithuania","code":"+370","region":"LT"},{"name":"Luxembourg","code":"+352","region":"LU"},{"name":"Macao","code":"+853","region":"MO"},{"name":"Madagascar","code":"+261","region":"MG"},{"name":"Malawi","code":"+265","region":"MW"},{"name":"Malaysia","code":"+60","region":"MY"},{"name":"Maldives","code":"+960","region":"MV"},{"name":"Mali","code":"+223","region":"ML"},{"name":"Malta","code":"+356","region":"MT"},{"name":"Marshall Islands","code":"+692","region":"MH"},{"name":"Martinique","code":"+596","region":"MQ"},{"name":"Mauritania","code":"+222","region":"MR"},{"name":"Mauritius","code":"+230","region":"MU"},{"name":"Mayotte","code":"+262","region":"YT"},{"name":"Mexico","code":"+52","region":"MX"},{"name":"Micronesia, Federated States of","code":"+691","region":"FM"},{"name":"Moldova","code":"+373","region":"MD"},{"name":"Monaco","code":"+377","region":"MC"},{"name":"Mongolia","code":"+976","region":"MN"},{"name":"Montenegro","code":"+382","region":"ME"},{"name":"Montserrat","code":"+1","region":"MS"},{"name":"Morocco","code":"+212","region":"MA"},{"name":"Mozambique","code":"+258","region":"MZ"},{"name":"Myanmar","code":"+95","region":"MM"},{"name":"Namibia","code":"+264","region":"NA"},{"name":"Nauru","code":"+674","region":"NR"},{"name":"Nepal","code":"+977","region":"NP"},{"name":"Netherlands","code":"+31","region":"NL"},{"name":"New Caledonia","code":"+687","region":"NC"},{"name":"New Zealand","code":"+64","region":"NZ"},{"name":"Nicaragua","code":"+505","region":"NI"},{"name":"Niger","code":"+227","region":"NE"},{"name":"Nigeria","code":"+234","region":"NG"},{"name":"Niue","code":"+683","region":"NU"},{"name":"Norfolk Island","code":"+672","region":"NF"},{"name":"North Korea","code":"+850","region":"KP"},{"name":"North Macedonia","code":"+389","region":"MK"},{"name":"Northern Mariana Islands","code":"+1","region":"MP"},{"name":"Norway","code":"+47","region":"NO"},{"name":"Oman","code":"+968","region":"OM"},{"name":"Pakistan","code":"+92","region":"PK"},{"name":"Palau","code":"+680","region":"PW"},{"name":"Palestine","code":"+970","region":"PS"},{"name":"Panama","code":"+507","region":"PA"},{"name":"Papua New Guinea","code":"+675","region":"PG"},{"name":"Paraguay","code":"+595","region":"PY"},{"name":"Peru","code":"+51","region":"PE"},{"name":"Philippines","code":"+63","region":"PH"},{"name":"Poland","code":"+48","region":"PL"},{"name":"Portugal","code":"+351","region":"PT"},{"name":"Puerto Rico","code":"+1","region":"PR"},{"name":"Qatar","code":"+974","region":"QA"},{"name":"Republic of the Congo","code":"+242","region":"CG"},{"name":"Romania","code":"+40","region":"RO"},{"name":"Russia","code":"+7","region":"RU"},{"name":"Rwanda","code":"+250","region":"RW"},{"name":"Réunion","code":"+262","region":"RE"},{"name":"Saint Barthélemy","code":"+590","region":"BL"},{"name":"Saint Helena, Ascension and Tristan da Cunha","code":"+290","region":"SH"},{"name":"Saint Kitts and Nevis","code":"+1","region":"KN"},{"name":"Saint Lucia","code":"+1","region":"LC"},{"name":"Saint Martin (French part)","code":"+590","region":"MF"},{"name":"Saint Pierre and Miquelon","code":"+508","region":"PM"},{"name":"Saint Vincent and the Grenadines","code":"+1","region":"VC"},{"name":"Samoa","code":"+685","region":"WS"},{"name":"San Marino","code":"+378","region":"SM"},{"name":"Sao Tome and Principe","code":"+239","region":"ST"},{"name":"Saudi Arabia","code":"+966","region":"SA"},{"name":"Senegal","code":"+221","region":"SN"},{"name":"Serbia","code":"+381","region":"RS"},{"name":"Seychelles","code":"+248","region":"SC"},{"name":"Sierra Leone","code":"+232","region":"SL"},{"name":"Singapore","code":"+65","region":"SG"},{"name":"Sint Maarten (Dutch part)","code":"+1","region":"SX"},{"name":"Slovakia","code":"+421","region":"SK"},{"name":"Slovenia","code":"+386","region":"SI"},{"name":"Solomon Islands","code":"+677","region":"SB"},{"name":"Somalia","code":"+252","region":"SO"},{"name":"South Africa","code":"+27","region":"ZA"},{"name":"South Korea","code":"+82","region":"KR"},{"name":"South Sudan","code":"+211","region":"SS"},{"name":"Spain","code":"+34","region":"ES"},{"name":"Sri Lanka","code":"+94","region":"LK"},{"name":"Sudan","code":"+249","region":"SD"},{"name":"Suriname","code":"+597","region":"SR"},{"name":"Svalbard and Jan Mayen","code":"+47","region":"SJ"},{"name":"Sweden","code":"+46","region":"SE"},{"name":"Switzerland","code":"+41","region":"CH"},{"name":"Syria","code":"+963","region":"SY"},{"name":"Taiwan","code":"+886","region":"TW"},{"name":"Tajikistan","code":"+992","region":"TJ"},{"name":"Tanzania","code":"+255","region":"TZ"},{"name":"Thailand","code":"+66","region":"TH"},{"name":"Timor-Leste","code":"+670","region":"TL"},{"name":"Togo","code":"+228","region":"TG"},{"name":"Tokelau","code":"+690","region":"TK"},{"name":"Tonga","code":"+676","region":"TO"},{"name":"Trinidad and Tobago","code":"+1","region":"TT"},{"name":"Tristan da Cunha","code":"+290","region":"TA"},{"name":"Tunisia","code":"+216","region":"TN"},{"name":"Turkey","code":"+90","region":"TR"},{"name":"Turkmenistan","code":"+993","region":"TM"},{"name":"Turks and Caicos Islands","code":"+1","region":"TC"},{"name":"Tuvalu","code":"+688","region":"TV"},{"name":"U.S. Virgin Islands","code":"+1","region":"VI"},{"name":"Uganda","code":"+256","region":"UG"},{"name":"Ukraine","code":"+380","region":"UA"},{"name":"United Arab Emirates","code":"+971","region":"AE"},{"name":"United Kingdom","code":"+44","region":"GB"},{"name":"Uruguay","code":"+598","region":"UY"},{"name":"Uzbekistan","code":"+998","region":"UZ"},{"name":"Vanuatu","code":"+678","region":"VU"},{"name":"Vatican City","code":"+39","region":"VA"},{"name":"Venezuela","code":"+58","region":"VE"},{"name":"Vietnam","code":"+84","region":"VN"},{"name":"Wallis and Futuna","code":"+681","region":"WF"},{"name":"Western Sahara","code":"+212","region":"EH"},{"name":"Yemen","code":"+967","region":"YE"},{"name":"Zambia","code":"+260","region":"ZM"},{"name":"Zimbabwe","code":"+263","region":"ZW"},{"name":"Åland Islands","code":"+358","region":"AX"}];

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

function countryLabel(country) {
  return `${country.name} (${country.code})`;
}

function normalizeCountrySearch(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9+]+/g, ' ');
}

function setupCountrySearch() {
  if (!guideForm) return;

  const combo = guideForm.querySelector('[data-country-combobox]');
  const input = guideForm.querySelector('input[name="countryLabel"]');
  const hiddenCode = guideForm.querySelector('input[name="countryCode"]');
  const results = guideForm.querySelector('[data-country-results]');
  if (!(combo instanceof HTMLElement) || !(input instanceof HTMLInputElement) || !(hiddenCode instanceof HTMLInputElement) || !(results instanceof HTMLElement)) return;

  let activeIndex = -1;
  let visibleCountries = [];

  const setExpanded = (expanded) => {
    input.setAttribute('aria-expanded', String(expanded));
    results.hidden = !expanded;
  };

  const selectCountry = (country) => {
    input.value = countryLabel(country);
    hiddenCode.value = country.code;
    setExpanded(false);
    activeIndex = -1;
  };

  const renderResults = () => {
    const query = normalizeCountrySearch(input.value);
    visibleCountries = COUNTRY_OPTIONS.filter((country) => {
      const haystack = normalizeCountrySearch(`${country.name} ${country.code} ${country.region}`);
      return query === '' || haystack.includes(query);
    });

    results.innerHTML = '';
    if (!visibleCountries.length) {
      const empty = document.createElement('div');
      empty.className = 'guide-country-empty';
      empty.textContent = 'No countries found';
      results.append(empty);
      setExpanded(true);
      return;
    }

    visibleCountries.forEach((country, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'guide-country-option';
      option.id = `guide-country-option-${index}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(index === activeIndex));
      option.textContent = countryLabel(country);
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('click', () => selectCountry(country));
      results.append(option);
    });

    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `guide-country-option-${activeIndex}`);
    } else {
      input.removeAttribute('aria-activedescendant');
    }
    setExpanded(true);
  };

  const moveActive = (direction) => {
    if (!visibleCountries.length) renderResults();
    if (!visibleCountries.length) return;
    activeIndex = (activeIndex + direction + visibleCountries.length) % visibleCountries.length;
    renderResults();
    const active = results.querySelector(`#guide-country-option-${activeIndex}`);
    active?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('focus', () => {
    activeIndex = -1;
    renderResults();
  });
  input.addEventListener('input', () => {
    hiddenCode.value = '+1';
    activeIndex = -1;
    renderResults();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter' && activeIndex >= 0 && visibleCountries[activeIndex]) {
      event.preventDefault();
      selectCountry(visibleCountries[activeIndex]);
    } else if (event.key === 'Escape') {
      setExpanded(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!combo.contains(event.target)) setExpanded(false);
  });
}

function syncCountryCode() {
  if (!guideForm) return '+1';

  const countryCode = guideForm.querySelector('input[name="countryCode"]');
  const countryLabelInput = guideForm.querySelector('input[name="countryLabel"]');
  if (!(countryCode instanceof HTMLInputElement)) return '+1';

  const labelValue = countryLabelInput instanceof HTMLInputElement ? countryLabelInput.value.trim() : '';
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
  setupCountrySearch();
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
