import { firebaseReady } from '../firebase/firebase-client.js';

const buttons = [...document.querySelectorAll('[data-portal-logout]')];
const names = [...document.querySelectorAll('[data-portal-session-name]')];
const avatars = [...document.querySelectorAll('[data-portal-session-avatar]')];

const setButtons = (label, disabled = false) => buttons.forEach((button) => {
  button.textContent = label;
  button.disabled = disabled;
  button.setAttribute('aria-busy', String(disabled));
});

if (buttons.length) {
  if (!firebaseReady) {
    setButtons('Sessão indisponível', true);
  } else {
    try {
    const { auth, authSdk } = await firebaseReady;

    authSdk.onAuthStateChanged(auth, (user) => {
      if (!user) {
        const content = document.querySelector('[data-teacher-content]');
        if (content) content.hidden = true;
        names.forEach((node) => { node.textContent = 'Sessão encerrada'; });
        setButtons('Entrar novamente', false);
        buttons.forEach((button) => { button.dataset.sessionAction = 'login'; });
        return;
      }

      const displayName = String(user.displayName || user.email || 'Conta autenticada').trim();
      const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'EMP';
      names.forEach((node) => { node.textContent = displayName; });
      avatars.forEach((node) => { node.textContent = initials; });
      buttons.forEach((button) => { button.dataset.sessionAction = 'logout'; });
      setButtons('Sair', false);
    });

    buttons.forEach((button) => button.addEventListener('click', async () => {
      if (button.dataset.sessionAction === 'login') {
        window.location.assign('../pages/login.html');
        return;
      }

      setButtons('Encerrando…', true);
      try {
        await authSdk.signOut(auth);
        window.location.replace('../pages/login.html?status=logout');
      } catch {
        setButtons('Tentar sair novamente', false);
      }
    }));
    } catch {
      setButtons('Sessão indisponível', true);
    }
  }
}

const teacherNav = document.querySelector('.teacher-console__nav');
if (teacherNav) {
  const markSection = () => {
    const hash = window.location.hash || '#visao-geral';
    teacherNav.querySelectorAll('a').forEach((link) => {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('hashchange', markSection);
  markSection();
  const authorizeNav = ({ staff }) => {
    const adminLink = teacherNav.querySelector('[href="#administracao"]');
    if (adminLink) adminLink.hidden = !['admin', 'owner'].includes(staff?.role);
  };
  if (window.empTeacherSession) authorizeNav(window.empTeacherSession);
  else document.addEventListener('teacher:authorized', (event) => authorizeNav(event.detail), { once:true });
}
