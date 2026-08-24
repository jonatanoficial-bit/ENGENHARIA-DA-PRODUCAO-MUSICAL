import { firebaseReady } from '../firebase/firebase-client.js';

const buttons = document.querySelectorAll('[data-supporters-external]');
const status = document.querySelector('[data-supporters-status]');
if (firebaseReady) {
  try {
    const { db, firestoreSdk } = await firebaseReady;
    const snapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db,'platformSettings','public'));
    const candidate = snapshot.exists() ? String(snapshot.data().supportersSiteUrl || '') : '';
    let url = '';
    try { const parsed = new URL(candidate); if (['http:','https:'].includes(parsed.protocol)) url = parsed.href; } catch { /* endereço inválido é ignorado */ }
    if (url) {
      buttons.forEach((button) => { button.href=url; button.target='_blank'; button.rel='noopener'; });
      if (status) status.innerHTML = `<p class="eyebrow">Portal conectado</p><h2>Conheça todos os apoiadores e oportunidades.</h2><p>O portal de parcerias é atualizado pela coordenação sem necessidade de alterar o site.</p><a class="button button--quiet" href="${url.replace(/["<>]/g,'')}" target="_blank" rel="noopener">Abrir portal de apoiadores</a>`;
    } else if (status) status.innerHTML = '<p class="eyebrow">Novas conexões</p><h2>Portal de apoiadores em atualização.</h2><p>Empresas e profissionais interessados podem falar com a coordenação pelo canal de contato institucional.</p><a class="button button--quiet" href="contato.html">Falar com a equipe</a>';
  } catch { if (status) status.innerHTML = '<p>As informações de apoiadores estão temporariamente indisponíveis.</p>'; }
}
