const officialSupportersUrl = 'https://jonatanoficial-bit.github.io/EMP-PATROCINADORES/#inicio';
const buttons = document.querySelectorAll('[data-supporters-external]');
const status = document.querySelector('[data-supporters-status]');
buttons.forEach((button) => { button.href=officialSupportersUrl; button.target='_blank'; button.rel='noopener'; });
if (status) status.innerHTML = `<p class="eyebrow">Portal conectado</p><h2>Conheça todos os apoiadores e oportunidades.</h2><p>O portal de parcerias reúne patrocinadores e iniciativas vinculadas ao projeto.</p><a class="button button--quiet" href="${officialSupportersUrl}" target="_blank" rel="noopener">Abrir portal de apoiadores</a>`;
