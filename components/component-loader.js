(() => {
  const root = document.documentElement.dataset.root || './';
  const loadComponent = async (target, file) => {
    const response = await fetch(`${root}components/${file}`);
    if (!response.ok) throw new Error(`Não foi possível carregar ${file}`);
    const html = (await response.text()).replaceAll('{{ROOT}}', root);
    target.innerHTML = html;
  };

  const markCurrentPage = () => {
    document.querySelectorAll('.site-nav a').forEach((link) => {
      if (new URL(link.href).pathname === window.location.pathname) link.setAttribute('aria-current', 'page');
    });
  };

  const initializeNavigation = () => {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const isOpen = nav.dataset.open === 'true';
      nav.dataset.open = String(!isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  };

  Promise.all([
    ...[...document.querySelectorAll('[data-component]')].map(async (slot) => loadComponent(slot, `${slot.dataset.component}.html`))
  ]).then(() => {
    markCurrentPage();
    initializeNavigation();
    document.dispatchEvent(new CustomEvent('components:ready'));
  }).catch((error) => console.error('[EMP components]', error));
})();
