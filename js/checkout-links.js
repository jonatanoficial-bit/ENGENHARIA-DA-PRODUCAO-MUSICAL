/* Ofertas oficiais da Hotmart — cada plano abre somente o seu checkout correspondente. */
window.EPM_HOTMART_CHECKOUTS = window.EPM_HOTMART_CHECKOUTS || {
  essencial: 'https://pay.hotmart.com/O106910044E?off=cqiymwjq',
  profissional: 'https://pay.hotmart.com/O106910044E?off=wuqbrxz6',
  premium: 'https://pay.hotmart.com/O106910044E?off=9824kdrk'
};

document.querySelectorAll('[data-hotmart-plan]').forEach((link) => {
  const checkout = window.EPM_HOTMART_CHECKOUTS[link.dataset.hotmartPlan];
  if (checkout && /^https:\/\//.test(checkout)) {
    link.href = checkout;
    link.target = '_blank';
    link.rel = 'noopener';
  }
});
