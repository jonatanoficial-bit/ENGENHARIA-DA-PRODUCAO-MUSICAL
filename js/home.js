document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) revealItems.forEach((item) => item.classList.add('is-visible'));
  else { const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .12 }); revealItems.forEach((item) => observer.observe(item)); }
  document.querySelectorAll('[data-count]').forEach((element) => { const end = Number(element.dataset.count); if (Number.isFinite(end)) element.textContent = end; });
});
