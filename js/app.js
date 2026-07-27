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

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register(`${root.dataset.root || './'}sw.js`));
  }

  if (window.location.pathname.includes('/aluno/')) {
    import(`${root.dataset.root || './'}firebase/auth-guard.js`);
  }
  if (window.location.pathname.includes('/professor/')) {
    import(`${root.dataset.root || './'}firebase/teacher-guard.js`);
  }
  const phase13Styles = document.createElement('link');
  phase13Styles.rel = 'stylesheet';
  phase13Styles.href = `${root.dataset.root || './'}css/phase-13.css`;
  document.head.append(phase13Styles);
})();
