(() => {
  const es = {
    eyebrow:'Admisiones internacionales', title:'Formación profesional en producción musical desde Brasil.', intro:'Ingeniería de la Producción Musical™ es un curso libre profesional en portugués ofrecido por Instituto Musical Vale. Integra música, grabación, mezcla, masterización, IA, distribución y proyectos prácticos.', cta:'Contactar soporte internacional', formatLabel:'Formato', format:'Clases online en vivo y grabadas. Actualmente, el idioma de enseñanza es portugués de Brasil.', credentialLabel:'Certificación', credential:'Certificado brasileño de finalización de curso libre emitido por Instituto Musical Vale. No es un título universitario ni habilitación de ingeniería.', supportLabel:'Soporte', support:'Orientación previa a la matrícula sobre pago, calendario, acceso y certificado.', beforeLabel:'Antes de matricularse', beforeTitle:'Confirme idioma, pago y reconocimiento en su país.', beforeText:'Los estudiantes internacionales deben contactarnos antes de comprar. La conversión de moneda, los impuestos y el reconocimiento local varían según el país.'
  };
  if (new URLSearchParams(location.search).get('lang') !== 'es') return;
  document.documentElement.lang = 'es';
  document.title = 'Estudiantes Internacionales | Ingeniería de la Producción Musical™';
  document.querySelectorAll('[data-i18n]').forEach((node) => { if (es[node.dataset.i18n]) node.textContent = es[node.dataset.i18n]; });
})();
