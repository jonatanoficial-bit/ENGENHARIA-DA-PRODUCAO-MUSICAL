import { firebaseReady } from '../firebase/firebase-client.js';

const root = document.querySelector('[data-certificate-app]');
if (root && firebaseReady) {
  const curriculum = [
    ['M01','Boas-vindas e orientacao profissional',4],['M02','Fundamentos do som e do audio',9],['M03','Fundamentos musicais para produtores',9],['M04','Estudio, equipamentos e conexoes',9],['M05','Microfones e tecnicas de captacao',11],['M06','Acustica, PA e sistemas ao vivo',11],['M07','Pro Tools: producao, edicao e mixagem',13],['M08','Reaper e visao multi-DAW',9],['M09','MIDI, plugins e instrumentos virtuais',9],['M10','Pre-producao, arranjo e direcao artistica',9],['M11','Gravacao em estudio',11],['M12','Edicao de audio',9],['M13','Mixagem profissional',13],['M14','Masterizacao',9],['M15','Producao vocal',9],['M16','Inteligencia artificial aplicada a musica',9],['M17','Distribuicao, direitos e mercado',9],['M18','Video, design e identidade artistica',7],['M19','Projetos praticos e portfolio',7],['M20','Avaliacao final e certificacao',4]
  ];
  const totalLessons = 162;
  const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const stamp = () => new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(new Date());
  const score = (submissions, projects, activities) => {
    const tests = submissions.filter((item) => typeof item.score === 'number').map((item) => item.score);
    const works = projects.filter((item) => typeof item.score === 'number');
    const activity = Math.round((activities / totalLessons) * 100);
    const values = [];
    if (tests.length) values.push(tests.reduce((a,b)=>a+b,0) / tests.length);
    if (works.length) values.push(works.reduce((a,b)=>a+b,0) / works.length);
    if (activities) values.push(activity);
    return values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : null;
  };
  const render = (data) => {
    const { name, progress, finalScore, hours } = data;
    const eligible = progress >= 90 && finalScore !== null && finalScore >= 70;
    const code = `EMP-${data.uid.slice(0, 6).toUpperCase()}-${new Date().getFullYear()}`;
    root.innerHTML = `<section class="certificate-panel no-print"><p class="eyebrow">Certificacao institucional</p><h1>Seu certificado de conclusao</h1><p>Para emitir o certificado, a formacao exige <strong>90% de conclusao</strong> e <strong>media geral minima de 70/100 (nota 7,0)</strong>.</p><div class="certificate-status"><article class="${progress >= 90 ? 'is-ok':''}"><span>Conclusao da trilha</span><strong>${progress}%</strong><small>Minimo: 90%</small></article><article class="${finalScore !== null && finalScore >= 70 ? 'is-ok':''}"><span>Media geral</span><strong>${finalScore === null ? 'N/A' : `${finalScore}/100`}</strong><small>Minimo: 70/100</small></article><article class="${eligible ? 'is-ok':''}"><span>Situacao</span><strong>${eligible ? 'Apto' : 'Em andamento'}</strong><small>${eligible ? 'Pronto para gerar' : 'Conclua os requisitos'}</small></article></div>${eligible ? `<form class="certificate-form" data-certificate-form><label>Confirme o nome que sera impresso no certificado<input name="certificateName" value="${safe(name)}" maxlength="120" required></label><button class="button" type="submit">Gerar e baixar certificado</button></form>` : `<p class="support-strip">Quando os dois indicadores atingirem o minimo, o botao de emissao aparecera aqui. Duvidas: <a href="mailto:empengenhariadeproducaomusical@gmail.com">empengenhariadeproducaomusical@gmail.com</a> ou <a href="tel:+5511963272371">(11) 96327-2371</a>.</p>`}</section><section class="certificate-sheet certificate-front"><img class="certificate-logo" src="../assets/brand/logo-oficial-emp.png" alt="Engenharia da Producao Musical"><p class="certificate-institution">Instituto Musical Vale - CNPJ 31.255.200/0001-19</p><p class="eyebrow">Certificado de conclusao</p><p>Certificamos que</p><h2 class="certificate-student-name" data-certificate-name>${safe(name || 'NOME DO(A) ALUNO(A)')}</h2><p class="certificate-copy">concluiu a formacao livre <strong>Engenharia da Producao Musical</strong>, demonstrando participacao nas aulas, atividades, avaliacoes e projetos previstos no plano academico.</p><div class="certificate-meta"><span>Carga horaria: ${hours} horas</span><span>Media final: ${finalScore === null ? 'N/A' : `${finalScore}/100`}</span><span>Emissao: ${stamp()}</span></div><p class="certificate-copy">Curso livre de formacao profissional emitido pelo Instituto Musical Vale, conforme a legislacao brasileira aplicavel a cursos livres.</p><div class="certificate-signatures"><div class="certificate-signature"><strong>Jonatan do Vale Souza</strong><small>Fundador, Diretor Academico e Produtor Musical</small></div><div class="certificate-signature"><strong>Instituto Musical Vale</strong><small>Instituicao certificadora</small></div></div><p class="certificate-code">Codigo de verificacao: ${code}</p></section><section class="certificate-sheet certificate-back"><p class="certificate-institution">Verso do certificado</p><h2>Grade curricular cursada</h2><p class="certificate-back__intro">Conteudos estudados na formacao, organizados em 20 modulos e ${hours} horas de carga horaria.</p><div class="certificate-curriculum">${curriculum.map(([id,title,courseHours]) => `<div><b>${id}</b><span>${safe(title)}</span><span>${courseHours}h</span></div>`).join('')}</div><p class="certificate-footer">Engenharia da Producao Musical | Instituto Musical Vale | CNPJ 31.255.200/0001-19<br>Programa educacional desenvolvido em parceria com a Vale Producao.</p></section><p class="support-strip no-print">Suporte academico: <a href="mailto:empengenhariadeproducaomusical@gmail.com">empengenhariadeproducaomusical@gmail.com</a> | <a href="tel:+5511963272371">(11) 96327-2371</a></p>`;
    root.querySelector('[data-certificate-form]')?.addEventListener('submit', (event) => { event.preventDefault(); const entered = event.currentTarget.elements.certificateName.value.trim(); root.querySelectorAll('[data-certificate-name]').forEach((node) => { node.textContent = entered; }); window.print(); });
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
      render({uid:user.uid,name:student.exists() ? (student.data().name || student.data().email || user.displayName) : user.displayName,progress:Math.round((completed / totalLessons) * 100),finalScore:score(entries,projects.docs.map((entry)=>entry.data()),completed),hours});
    } catch { root.innerHTML = '<section class="certificate-panel"><h1>Nao foi possivel carregar os dados academicos.</h1><p>Atualize a pagina ou entre em contato com o suporte academico.</p></section>'; }
  });
}
