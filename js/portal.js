(() => {
  const storage = 'emp-demo-progress';
  const setFeedback = (form, message) => { const target = form.querySelector('.form-feedback'); if (target) target.textContent = message; };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-demo-form]').forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); setFeedback(form, 'Registro salvo neste protótipo. A integração segura será conectada ao backend.'); form.reset(); }));
    document.querySelectorAll('[data-lesson-complete]').forEach((button) => button.addEventListener('click', () => { localStorage.setItem(storage, '42'); document.querySelectorAll('[data-progress-value]').forEach((item) => { item.textContent = '42%'; }); document.querySelectorAll('[data-progress-bar]').forEach((item) => { item.style.width = '42%'; }); button.textContent = 'Aula concluída'; button.disabled = true; }));
    document.querySelectorAll('[data-admin-tab]').forEach((button) => button.addEventListener('click', () => { const target = button.dataset.adminTab; document.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('is-active', item === button)); document.querySelectorAll('[data-admin-panel]').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.adminPanel === target)); }));
    const saved = localStorage.getItem(storage); if (saved) { document.querySelectorAll('[data-progress-value]').forEach((item) => { item.textContent = `${saved}%`; }); document.querySelectorAll('[data-progress-bar]').forEach((item) => { item.style.width = `${saved}%`; }); }
  });
})();
