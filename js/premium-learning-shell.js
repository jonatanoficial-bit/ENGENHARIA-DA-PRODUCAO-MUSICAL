/* Fase 23: apresentação de identidade e primeiro acesso. Sem gravações no Firestore. */
const body = document.body;
if (body.classList.contains('student-shell')) {
  const current = window.location.pathname;
  if (!document.querySelector('.mobile-learn-nav')) {
    const item = (href, icon, label, active = false) => `<a href="${href}" data-nav-icon="${icon}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
    body.insertAdjacentHTML('beforeend', `<nav class="mobile-learn-nav" aria-label="Navegação rápida do aluno">${item('index.html','home','Início',current.endsWith('/index.html'))}${item('index.html#formacao','course','Curso')}${item('index.html#agenda','calendar','Agenda')}${item('boletim.html','report','Boletim',current.endsWith('/boletim.html'))}${item('perfil.html','profile','Perfil',current.endsWith('/perfil.html'))}</nav>`);
  }

  const dialog = document.querySelector('[data-student-onboarding]');
  dialog?.querySelector('[data-onboarding-start]')?.addEventListener('click', () => {
    if (dialog.dataset.storageKey) {
      try { localStorage.setItem(dialog.dataset.storageKey, 'seen'); } catch { /* A apresentação não bloqueia o curso. */ }
    }
    dialog.close();
    document.querySelector('[data-continue-action]')?.focus();
  });
  dialog?.addEventListener('cancel', (event) => event.preventDefault());

  const showSession = ({ user, preview }) => {
    const avatar = document.querySelector('[data-student-avatar]');
    if (avatar) {
      const name = String(user?.displayName || user?.email || 'Aluno').trim();
      const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
      avatar.textContent = initials || 'A';
      try {
        const photo = user?.photoURL ? new URL(user.photoURL) : null;
        if (photo?.protocol === 'https:') {
          const image = document.createElement('img');
          image.alt = '';
          image.referrerPolicy = 'no-referrer';
          image.src = photo.href;
          image.onerror = () => image.remove();
          avatar.append(image);
        }
      } catch { /* Iniciais permanecem visíveis. */ }
    }
    if (!dialog || preview || !user?.uid) return;
    const storageKey = `emp-onboarding-v23:${user.uid}`;
    dialog.dataset.storageKey = storageKey;
    let seen = false;
    try { seen = localStorage.getItem(storageKey) === 'seen'; } catch { /* Sem armazenamento, o curso permanece acessível. */ }
    const requested = new URLSearchParams(window.location.search).get('onboarding') === '1';
    if (requested || !seen) dialog.showModal();
  };
  if (window.empStudentSession) showSession(window.empStudentSession);
  else document.addEventListener('student:authorized', (event) => showSession(event.detail), { once:true });
}
