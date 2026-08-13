(() => {
  const form = document.querySelector('[data-verify-form]');
  const result = document.querySelector('[data-verify-result]');
  if (!form || !result) return;
  const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const show = (message, state) => { result.hidden = false; result.className = `verify-result ${state || ''}`; result.innerHTML = message; };
  const query = new URLSearchParams(location.search);
  const preset = query.get('code') || query.get('codigo');
  if (preset) { form.elements.code.value = preset; }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = form.elements.code.value.trim().toUpperCase();
    show('<p>Consultando o registro institucional…</p>');
    try {
      const response = await fetch(`/api/verify-certificate?code=${encodeURIComponent(code)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.valid) { show('<strong>Certificado não localizado ou sem validade.</strong><p>Confira o código e tente novamente. Se o documento for recente, aguarde alguns minutos ou contate o suporte.</p>', 'is-invalid'); return; }
      show(`<strong>Certificado autêntico e válido.</strong><dl><dt>Aluno(a)</dt><dd>${safe(data.studentName)}</dd><dt>Formação</dt><dd>${safe(data.courseName)}</dd><dt>Carga horária</dt><dd>${safe(data.courseHours)} horas</dd><dt>Emissão</dt><dd>${safe(data.issuedAt)}</dd><dt>Código</dt><dd>${safe(data.code)}</dd></dl>`, 'is-valid');
    } catch { show('<strong>Consulta temporariamente indisponível.</strong><p>Tente novamente em instantes. A indisponibilidade não invalida o documento.</p>', 'is-invalid'); }
  });
  if (preset) form.requestSubmit();
})();
