import { firebaseReady } from '../firebase/firebase-client.js';

const root = document.querySelector('[data-certificate-app]');
if (root && firebaseReady) {
  const curriculum = [
    ['M01','Boas-vindas e orientação profissional',4],['M02','Fundamentos do som e do áudio',9],['M03','Fundamentos musicais para produtores',9],['M04','Estúdio, equipamentos e conexões',9],['M05','Microfones e técnicas de captação',11],['M06','Acústica, PA e sistemas ao vivo',11],['M07','Pro Tools: produção, edição e mixagem',13],['M08','Reaper e visão multi-DAW',9],['M09','MIDI, plugins e instrumentos virtuais',9],['M10','Pré-produção, arranjo e direção artística',9],['M11','Gravação em estúdio',11],['M12','Edição de áudio',9],['M13','Mixagem profissional',13],['M14','Masterização',9],['M15','Produção vocal',9],['M16','Inteligência artificial aplicada à música',9],['M17','Distribuição, direitos e mercado',9],['M18','Vídeo, design e identidade artística',7],['M19','Projetos práticos e portfólio',7],['M20','Avaliação final e certificação',4]
  ];
  const totalLessons = 162;
  const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const stamp = () => new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(new Date());
  const score = (submissions, projects, activities) => {
    const tests = submissions.filter((item) => typeof item.score === 'number').map((item) => item.score);
    const works = projects.filter((item) => typeof item.score === 'number').map((item) => item.score);
    const activity = Math.round((activities / totalLessons) * 100);
    const values = [];
    if (tests.length) values.push(tests.reduce((a,b)=>a+b,0) / tests.length);
    if (works.length) values.push(works.reduce((a,b)=>a+b,0) / works.length);
    if (activities) values.push(activity);
    return values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : null;
  };

  const render = (data) => {
    const { name, progress, finalScore, hours, user } = data;
    const eligible = progress >= 90 && finalScore !== null && finalScore >= 70;
    root.innerHTML = `<section class="certificate-panel no-print"><p class="eyebrow">Certificação institucional</p><h1>Seu certificado de conclusão</h1><p>Para emitir o certificado, a formação exige <strong>90% de conclusão</strong> e <strong>média geral mínima de 70/100 (nota 7,0)</strong>.</p><div class="certificate-status"><article class="${progress >= 90 ? 'is-ok':''}"><span>Conclusão da trilha</span><strong>${progress}%</strong><small>Mínimo: 90%</small></article><article class="${finalScore !== null && finalScore >= 70 ? 'is-ok':''}"><span>Média geral</span><strong>${finalScore === null ? 'N/A' : `${finalScore}/100`}</strong><small>Mínimo: 70/100</small></article><article class="${eligible ? 'is-ok':''}"><span>Situação</span><strong>${eligible ? 'Apto' : 'Em andamento'}</strong><small>${eligible ? 'Pronto para gerar' : 'Conclua os requisitos'}</small></article></div>${eligible ? `<form class="certificate-form" data-certificate-form><label>Confirme o nome que será impresso no certificado<input name="certificateName" value="${safe(name)}" maxlength="120" required></label><button class="button" type="submit">Emitir certificado verificável</button><p class="form-status" data-certificate-status aria-live="polite"></p></form>` : `<p class="support-strip">Quando os dois indicadores atingirem o mínimo, o botão de emissão aparecerá aqui. Dúvidas: <a href="mailto:empengenhariadeproducaomusical@gmail.com">empengenhariadeproducaomusical@gmail.com</a> ou <a href="tel:+5511968272377">(11) 96827-2377</a>.</p>`}</section><section class="certificate-sheet certificate-front"><img class="certificate-logo" src="../assets/brand/logo-oficial-emp.png" alt="Engenharia da Produção Musical"><p class="certificate-institution">Instituto Musical Vale — CNPJ 31.255.200/0001-19</p><p class="eyebrow">Certificado de conclusão</p><p>Certificamos que</p><h2 class="certificate-student-name" data-certificate-name>${safe(name || 'NOME DO(A) ALUNO(A)')}</h2><p class="certificate-copy">concluiu a formação livre <strong>Engenharia da Produção Musical™</strong>, demonstrando participação nas aulas, atividades, avaliações e projetos previstos no plano acadêmico.</p><div class="certificate-meta"><span>Carga horária: ${hours} horas</span><span>Média final: <b data-certificate-score>${finalScore === null ? 'N/A' : `${finalScore}/100`}</b></span><span>Emissão: ${stamp()}</span></div><p class="certificate-copy">Curso livre de formação profissional emitido pelo Instituto Musical Vale, conforme a legislação brasileira aplicável aos cursos livres.</p><div class="certificate-signatures"><div class="certificate-signature"><strong>Jonatan do Vale Souza</strong><small>Fundador, Diretor Acadêmico e Produtor Musical</small></div><div class="certificate-signature"><strong>Instituto Musical Vale</strong><small>Instituição certificadora</small></div></div><p class="certificate-code">Código de verificação: <b data-certificate-code>será gerado na emissão</b><br><a data-certificate-verification href="../pages/verificar-certificado.html">engenharia-da-producao-musical.vercel.app/pages/verificar-certificado.html</a></p></section><section class="certificate-sheet certificate-back"><p class="certificate-institution">Verso do certificado</p><h2>Grade curricular cursada</h2><p class="certificate-back__intro">Conteúdos estudados na formação, organizados em 20 módulos e ${hours} horas de carga horária.</p><div class="certificate-curriculum">${curriculum.map(([id,title,courseHours]) => `<div><b>${id}</b><span>${safe(title)}</span><span>${courseHours}h</span></div>`).join('')}</div><p class="certificate-footer">Engenharia da Produção Musical™ | Instituto Musical Vale | CNPJ 31.255.200/0001-19<br>Programa educacional desenvolvido em parceria com a Vale Produção.</p></section><p class="support-strip no-print">Suporte acadêmico: <a href="mailto:empengenhariadeproducaomusical@gmail.com">empengenhariadeproducaomusical@gmail.com</a> | <a href="tel:+5511968272377">(11) 96827-2377</a></p>`;

    root.querySelector('[data-certificate-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      const status = root.querySelector('[data-certificate-status]');
      const entered = event.currentTarget.elements.certificateName.value.trim();
      button.disabled = true;
      status.textContent = 'Validando os requisitos e emitindo o certificado...';
      try {
        const token = await user.getIdToken();
        const response = await fetch('../api/issue-certificate', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ studentName: entered }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Emissão indisponível.');
        const verificationUrl = `https://engenharia-da-producao-musical.vercel.app/pages/verificar-certificado.html?code=${encodeURIComponent(result.code)}`;
        root.querySelectorAll('[data-certificate-name]').forEach((node) => { node.textContent = result.studentName || entered; });
        root.querySelector('[data-certificate-code]').textContent = result.code;
        root.querySelector('[data-certificate-score]').textContent = `${result.finalScore}/100`;
        const link = root.querySelector('[data-certificate-verification]');
        link.href = verificationUrl;
        link.textContent = verificationUrl.replace('https://', '');
        status.textContent = 'Certificado emitido e registrado. A janela de impressão será aberta.';
        window.setTimeout(() => window.print(), 250);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  };

  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  const { doc, getDoc, getDocs, collection } = firestoreSdk;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.replace('../pages/login.html'); return; }
    try {
      const [student, catalog, submissions, projects, settings] = await Promise.all([
        getDoc(doc(db,'students',user.uid)), getDoc(doc(db,'students',user.uid,'progress','catalog')),
        getDocs(collection(db,'assessments')), getDocs(collection(db,'students',user.uid,'projects')),
        getDoc(doc(db,'academicSettings','certification'))
      ]);
      const entries = await Promise.all(submissions.docs.map(async (assessment) => { const item = await getDoc(doc(db,'assessments',assessment.id,'submissions',user.uid)); return item.exists() ? item.data() : {}; }));
      const completed = catalog.exists() && Array.isArray(catalog.data().completedLessons) ? catalog.data().completedLessons.length : 0;
      const hours = settings.exists() && Number(settings.data().courseHours) > 0 ? Number(settings.data().courseHours) : 180;
      render({ user, name:student.exists() ? (student.data().name || student.data().email || user.displayName) : user.displayName, progress:Math.round((completed / totalLessons) * 100), finalScore:score(entries,projects.docs.map((entry)=>entry.data()),completed), hours });
    } catch { root.innerHTML = '<section class="certificate-panel"><h1>Não foi possível carregar os dados acadêmicos.</h1><p>Atualize a página ou entre em contato com o suporte acadêmico.</p></section>'; }
  });
}
