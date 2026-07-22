document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-smart-assistant]');
  const output = document.querySelector('[data-smart-answer]');
  const responses = [
    { keys: ['mix', 'equaliza', 'compress'], text: 'Para avançar em mixagem, retome o Ciclo 04: comece pelo ganho e pela intenção de cada faixa antes de equalizar ou comprimir.' },
    { keys: ['ia', 'suno', 'chatgpt', 'moises'], text: 'Use IA como laboratório: gere referências, compare estruturas e documente decisões. O resultado final continua sendo uma escolha artística sua.' },
    { keys: ['certificado', 'certifica'], text: 'O certificado é liberado após a conclusão dos ciclos e avaliações. Ele será emitido pelo Instituto Musical Vale.' },
    { keys: ['pro tools', 'daw', 'reaper'], text: 'Escolha uma DAW para consolidar fluxo. A lógica de sessão, roteamento e organização acompanha você entre ferramentas.' }
  ];
  form?.addEventListener('submit', (event) => { event.preventDefault(); const query = new FormData(form).get('question').toLowerCase(); const found = responses.find((item) => item.keys.some((key) => query.includes(key))); output.textContent = found?.text || 'Posso orientar você por ciclos, ferramentas, projetos, certificação e mercado. Tente incluir uma palavra-chave do seu objetivo.'; });
});
