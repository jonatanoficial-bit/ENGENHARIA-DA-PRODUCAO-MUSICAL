(() => {
  const storageKey = 'emp-theme';
  const root = document.documentElement;
  const applyTheme = (theme) => root.dataset.theme = theme;
  const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(localStorage.getItem(storageKey) || preferredTheme);

  document.addEventListener('components:ready', () => {
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(storageKey, nextTheme);
      applyTheme(nextTheme);
    });
  });

  const siteRoot = new URL(root.dataset.root || './', document.baseURI);
  import(new URL('firebase/access-routing.js', siteRoot).href);

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register(`${root.dataset.root || './'}sw.js`));
  }

  if (window.location.pathname.includes('/aluno/')) {
    import(new URL('firebase/auth-guard.js', siteRoot).href);
  }
  if (window.location.pathname.includes('/professor/')) {
    import(new URL('firebase/teacher-guard.js', siteRoot).href);
  }
  const phase13Styles = document.createElement('link');
  phase13Styles.rel = 'stylesheet';
  phase13Styles.href = `${root.dataset.root || './'}css/phase-13.css`;
  document.head.append(phase13Styles);
  if (!document.querySelector('link[href$="phase-21.css"]')) {
    const phase21Styles = document.createElement('link');
    phase21Styles.rel = 'stylesheet';
    phase21Styles.href = `${root.dataset.root || './'}css/phase-21.css`;
    document.head.append(phase21Styles);
  }
})();
