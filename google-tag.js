(() => {
  const MEASUREMENT_ID = 'G-N9HLFHZGHM';
  const PRODUCTION_HOSTS = new Set(['turboapply.agency', 'www.turboapply.agency']);

  if (!PRODUCTION_HOSTS.has(window.location.hostname)) {
    document.documentElement.dataset.analytics = 'disabled';
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  const loaderUrl = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  if (!document.querySelector(`script[src="${loaderUrl}"]`)) {
    const loader = document.createElement('script');
    loader.async = true;
    loader.src = loaderUrl;
    document.head.appendChild(loader);
  }

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  document.documentElement.dataset.analytics = 'enabled';
})();
