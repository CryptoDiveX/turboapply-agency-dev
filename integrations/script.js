const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('#site-navigation');
const navLinks = Array.from(siteNav?.querySelectorAll('a') || []);

function setNavigationOpen(isOpen, { restoreFocus = false } = {}) {
  if (!navToggle || !siteNav) return;

  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  siteNav.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('is-nav-open', isOpen);

  if (isOpen) {
    window.requestAnimationFrame(() => navLinks[0]?.focus());
  } else if (restoreFocus) {
    navToggle.focus();
  }
}

navToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  setNavigationOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});

siteNav?.addEventListener('click', (event) => event.stopPropagation());
navLinks.forEach((link) => link.addEventListener('click', () => setNavigationOpen(false)));

document.addEventListener('click', () => {
  if (siteNav?.classList.contains('is-open')) setNavigationOpen(false);
});

window.addEventListener('keydown', (event) => {
  if (!siteNav?.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    setNavigationOpen(false, { restoreFocus: true });
    return;
  }

  if (event.key === 'Tab') {
    const focusable = [navToggle, ...navLinks].filter((element) => element?.offsetParent !== null);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1180) setNavigationOpen(false);
});
