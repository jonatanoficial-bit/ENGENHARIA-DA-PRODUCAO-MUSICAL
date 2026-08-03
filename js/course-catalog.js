/* Fase 14: catálogo didático, agenda de duas aulas por semana e quiz modular. */
(() => {
  const catalogRoot = document.querySelector('[data-course-catalog]');
  if (!catalogRoot) return;
  if (!document.querySelector('link[href="../css/phase-20.css"]')) { const phase20 = document.createElement('link'); phase20.rel = 'stylesheet'; phase20.href = '../css/phase-20.css'; document.head.append(phase20); }

  const moduleArt = [
    'm01-boas-vindas.png','m02-fundamentos-som.png','m03-fundamentos-musicais.png','m04-estudio-conexoes.png','m05-microfones-captacao.png',
    'm06-acustica-pa.png','m07-producao-daw.png','m08-multi-daw.png','m09-midi-plugins.png','m10-arranjo-direcao.png',
    'm11-gravacao-estudio.png','m12-edicao-audio.png','m13-mixagem.png','m14-masterizacao.png','m15-producao-vocal.png',
    'm16-inteligencia-artificial.png','m17-mercado-e-distribuicao.png','m08-multi-daw.png','m01-boas-vindas.png','m17-mercado-e-distribuicao.png'
  ];
  const modules = [
    ['M01','Boas-vindas e orientação profissional','Jonatan Vale e Giovane Firmino da Silva','Boas-vindas à Engenharia da Produção Musical|O que faz um produtor musical|O que faz um engenheiro de áudio|Como estudar e construir um portfólio'],
    ['M02','Fundamentos do som e do áudio','Giovane Firmino da Silva','O que é som|Frequência e espectro audível|Amplitude, volume e pressão sonora|Fase e cancelamento|Áudio analógico e digital|Sample rate e bit depth|Headroom, clipping e ruído|Fluxo de sinal'],
    ['M03','Fundamentos musicais para produtores','Jonatan Vale','Pulsação, tempo e métrica|Figuras rítmicas e subdivisões|Escalas maiores e menores|Intervalos musicais|Tríades e tétrades|Campo harmônico|Condução de vozes e inversões|Forma musical e estrutura'],
    ['M04','Estúdio, equipamentos e conexões','Giovane Firmino da Silva e Jonatan Vale','Estrutura de um home studio|O computador para produção musical|Interfaces de áudio|Mesas analógicas|Mesas digitais|Cabos e conectores|Direct box, pré-amplificadores e periféricos|Ligação entre mesa, interface e DAW'],
    ['M05','Microfones e técnicas de captação','Giovane Firmino da Silva','Como funciona um microfone|Microfones dinâmicos|Microfones condensadores|Ribbon e microfones especiais|Padrões polares|Proximidade e distância|Captação de voz|Captação de violão e instrumentos acústicos|Captação de amplificadores|Captação de bateria'],
    ['M06','Acústica, PA e sistemas ao vivo','Giovane Firmino da Silva','Acústica básica|Tratamento acústico para home studio|Isolamento acústico|Monitores de referência|Sistemas de PA|Ganho em sistemas de PA|Monitoração de palco e in-ear|Microfonia: prevenção e solução|Passagem de som|Solução de problemas em sistemas de áudio'],
    ['M07','Pro Tools — produção, edição e mixagem','Jonatan Vale','Instalação, configuração e organização|Interface e fluxo de trabalho|Sessões e templates|Tipos de pistas e roteamento|Importação e organização de arquivos|Gravação de áudio|Edição básica|Edição avançada|MIDI e instrumentos virtuais|Plugins, inserts e sends|Automação|Bounce, exportação e entrega'],
    ['M08','Reaper e visão multi-DAW','Jonatan Vale','Instalação e configuração|Interface e fluxo de trabalho|Gravação e edição|Roteamento avançado|MIDI no Reaper|Mixagem e renderização|Panorama das principais DAWs|Migração entre DAWs'],
    ['M09','MIDI, plugins e instrumentos virtuais','Jonatan Vale','Fundamentos de MIDI|Controladores MIDI|Quantização e humanização|Sintetizadores e síntese|Kontakt e bibliotecas|Baterias virtuais|Pianos, baixos e instrumentos orquestrais|Gerenciamento de plugins'],
    ['M10','Pré-produção, arranjo e direção artística','Jonatan Vale','Leitura artística de uma música|Planejamento de produção|Construção de arranjo|Arranjo rítmico|Arranjo harmônico|Arranjo vocal|Direção de músicos|Pré-produção prática'],
    ['M11','Gravação em estúdio','Jonatan Vale e Giovane Firmino da Silva','Preparação da sessão|Estrutura de ganho|Gravação de voz|Gravação de violão|Gravação de guitarra|Gravação de baixo|Gravação de teclado e MIDI|Gravação de bateria|Gravação ao vivo|Backup e segurança de sessão'],
    ['M12','Edição de áudio','Jonatan Vale','Organização de edição|Comping vocal|Edição de timing|Afinação vocal|Limpeza de ruídos|Edição de bateria|Edição de instrumentos|Preparação para mixagem'],
    ['M13','Mixagem profissional','Jonatan Vale','Preparação da mixagem|Balanceamento e panorama|EQ: fundamentos|EQ aplicada|Compressão: fundamentos|Compressão aplicada|Reverb|Delay|Saturação|Mixagem vocal|Mix bus e processamento paralelo|Revisão e entrega'],
    ['M14','Masterização','Jonatan Vale','Função da masterização|Preparação da mix|Equalização na master|Compressão e dinâmica|Limiting e loudness|Imagem estéreo e mono|Masterização para streaming|Prática completa de masterização'],
    ['M15','Produção vocal','Jonatan Vale','Preparação do cantor|Direção vocal|Dobras e camadas|Backings e harmonias|Edição vocal|Mixagem vocal|Coral e grupos vocais|Projeto vocal completo'],
    ['M16','Inteligência artificial aplicada à música','Jonatan Vale','Ética e princípios de IA|IA para ideias e pré-produção|Suno e Udio|IA para edição e restauração|IA para mixagem e masterização|IA para voz e conteúdo|IA para imagem, vídeo e divulgação|Fluxo híbrido: humano e IA'],
    ['M17','Distribuição, direitos e mercado','Jonatan Vale','Cadeia da indústria musical|Direitos autorais|ISRC e metadados|Distribuição digital|Spotify for Artists|Marketing musical|Orçamento e precificação|Carreira e empreendedorismo'],
    ['M18','Vídeo, design e identidade artística','Jonatan Vale','Identidade de lançamento|Canva para músicos|Photoshop para capas e artes|Vídeo para artistas|Conteúdo para redes sociais|Campanha completa de lançamento'],
    ['M19','Projetos práticos e portfólio','Jonatan Vale e Giovane Firmino da Silva','Projeto de demo|Captação|Mixagem completa|Masterização|Lançamento digital|Construção de portfólio'],
    ['M20','Avaliação final e certificação','Jonatan Vale e Giovane Firmino da Silva','Orientação final|Apresentação técnica|Avaliação artística e comercial|Conclusão e próximos passos']
  ].map(([id,title,instructor,lessons], index) => ({id,title,instructor,lessons:lessons.split('|'),art:`../assets/portal/${moduleArt[index]}`}));

  const quizPrompts = [
    'Reconhecer os papéis profissionais e estruturar um plano de estudo e portfólio.',
    'Compreender como o som, o sinal e o áudio digital se comportam.',
    'Aplicar fundamentos de ritmo, harmonia e forma nas decisões de produção.',
    'Montar e conectar um estúdio com fluxo de sinal organizado.',
    'Selecionar e posicionar microfones de acordo com a fonte sonora.',
    'Tomar decisões de acústica, PA e monitoração com segurança.',
    'Produzir, editar e entregar sessões no Pro Tools.',
    'Trabalhar em Reaper e transitar entre diferentes DAWs.',
    'Usar MIDI, plugins e instrumentos virtuais com intenção musical.',
    'Planejar o arranjo e conduzir uma pré-produção artística.',
    'Preparar e registrar fontes sonoras em uma sessão de estúdio.',
    'Editar áudio para construir performances consistentes.',
    'Construir uma mix equilibrada, clara e com intenção.',
    'Finalizar faixas com critérios técnicos para diferentes destinos.',
    'Dirigir, editar e organizar uma produção vocal.',
    'Integrar IA de modo ético e produtivo ao fluxo musical.',
    'Preparar o lançamento considerando distribuição, direitos e mercado.',
    'Criar uma identidade visual e audiovisual coerente para o projeto.',
    'Concluir um projeto e apresentá-lo em um portfólio profissional.',
    'Apresentar o projeto final e concluir os critérios de certificação.'
  ];
  const answers = [
    'Ignorar planejamento e publicar qualquer arquivo.',
    'Usar ferramentas sem escuta e sem objetivo.',
    'Evitar qualquer relação entre música e produção.'
  ];
  const stateKey = 'epm-course-progress-v14';
  const stored = JSON.parse(localStorage.getItem(stateKey) || '{"passed":[]}');
  const state = {passed:Array.isArray(stored.passed) ? stored.passed : [], completedLessons:Array.isArray(stored.completedLessons) ? stored.completedLessons : [], selected:0};
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
  let remoteProgress = null;
  let staffPreview = false;
  const remoteLessons = new Map();
  const moduleSchedules = new Map();
  let stopRemoteLessons = null;
  let stopModuleSchedules = null;
  const modulesNode = catalogRoot.querySelector('.course-modules');
  const lessonsNode = catalogRoot.querySelector('.course-lessons');
  const playerNode = document.querySelector('[data-course-player]');
  const quizNode = document.querySelector('[data-course-quiz]');
  const progressNode = document.querySelector('[data-course-progress]');
  const percentNode = document.querySelector('[data-course-percent]');
  const progressRing = document.querySelector('[data-course-ring]');
  const startValue = catalogRoot.dataset.courseStart;
  let courseStart = startValue ? new Date(`${startValue}T00:00:00`) : new Date();
  courseStart.setHours(0,0,0,0);

  function save(){
    if (staffPreview) return;
    localStorage.setItem(stateKey,JSON.stringify({passed:state.passed,completedLessons:state.completedLessons}));
    if (remoteProgress) {
      const percent = Math.round((state.completedLessons.length / totalLessons) * 100);
      remoteProgress.setDoc(remoteProgress.doc(remoteProgress.db, 'students', remoteProgress.uid, 'progress', 'catalog'), { completedModules: state.passed, completedLessons: state.completedLessons, totalLessons, percent, updatedAt: remoteProgress.serverTimestamp() }, { merge: true }).catch(() => {});
    }
  }
  function releaseDate(globalIndex, moduleIndex = null, lessonIndex = 0){
    const module = moduleIndex === null ? null : modules[moduleIndex];
    const schedule = module ? moduleSchedules.get(module.id) : null;
    const result = schedule?.releaseAt ? new Date(schedule.releaseAt) : new Date(courseStart);
    const pace = Math.max(1, Number(schedule?.lessonsPerWeek || 2));
    result.setDate(result.getDate()+Math.floor((schedule ? lessonIndex : globalIndex)/pace)*7); return result;
  }
  function dayLabel(date){ return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(date); }
  function lessonOffset(moduleIndex,lessonIndex){ return modules.slice(0,moduleIndex).reduce((sum,module)=>sum+module.lessons.length,0)+lessonIndex; }
  function moduleAllowed(moduleIndex){ return moduleIndex === 0 || state.passed.includes(modules[moduleIndex-1].id); }
  function lessonAvailable(moduleIndex,lessonIndex){ const video = lessonVideo(moduleIndex, lessonIndex); const custom = video?.availableAt ? new Date(video.availableAt) : null; return moduleAllowed(moduleIndex) && new Date() >= (custom && !Number.isNaN(custom.getTime()) ? custom : releaseDate(lessonOffset(moduleIndex,lessonIndex),moduleIndex,lessonIndex)); }
  function lessonVideo(moduleIndex, lessonIndex){ return remoteLessons.get(`${modules[moduleIndex].id.toLowerCase()}a${String(lessonIndex + 1).padStart(2, '0')}`); }
  function updateProgress(){
    const percent = Math.round((state.completedLessons.length / totalLessons) * 100);
    if(progressNode) progressNode.textContent = `${state.passed.length} de ${modules.length} módulos concluídos`;
    if(progressNode) progressNode.textContent = `${state.completedLessons.length} de ${totalLessons} aulas concluídas`;
    if(percentNode) percentNode.textContent = `${percent}%`;
    if(progressRing) progressRing.style.setProperty('--course-progress', percent);
  }
  function escapeHtml(value){ return value.replace(/[&<>'"]/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }

  function renderModules(){
    modulesNode.innerHTML = modules.map((module,index)=>{ const opening = releaseDate(0,index,0); const locked = new Date() < opening; return `<button class="course-module-button ${locked?'course-module-button--locked':''}" type="button" style="--module-art:url('${module.art}')" data-module-index="${index}" aria-current="${index===state.selected}"><span class="course-module-button__number">${module.id}${state.passed.includes(module.id)?' · CONCLUÍDO':''}</span><span class="course-module-button__title">${escapeHtml(module.title)}</span><span class="course-module-button__schedule">${locked?`🔒 Abre ${dayLabel(opening)}`:'Calendário da turma'}</span></button>`; }).join('');
    modulesNode.querySelectorAll('[data-module-index]').forEach(button=>button.addEventListener('click',()=>{ state.selected=Number(button.dataset.moduleIndex); render(); }));
  }
  function renderLessons(){
    const module = modules[state.selected];
    const allowed = moduleAllowed(state.selected);
    const lessonItems = module.lessons.map((lesson,index)=>{
      const scheduled = lessonAvailable(state.selected,index);
      const remoteVideo = lessonVideo(state.selected, index);
      const available = scheduled && !(remoteVideo && (!remoteVideo.published || !remoteVideo.videoId));
      const schedule = remoteVideo?.availableAt ? new Date(remoteVideo.availableAt) : releaseDate(lessonOffset(state.selected,index),state.selected,index);
      const status = !allowed ? 'Conclua a avaliação anterior' : !scheduled ? `Liberação: ${dayLabel(schedule)}` : remoteVideo && !remoteVideo.published ? 'Gravação em preparação' : available ? 'Disponível agora' : 'Gravação em preparação';
      return `<li class="lesson-item ${available?'lesson-item--available':''}" ${available?`data-play-lesson="${index}" tabindex="0" role="button"`:''}><span class="lesson-item__icon">${available?'▶':'🔒'}</span><span class="lesson-item__main"><span class="lesson-item__title">Aula ${String(index+1).padStart(2,'0')} · ${escapeHtml(lesson)}</span><span class="lesson-item__meta">Ao vivo + gravação · cerca de 50 min</span></span><span class="lesson-item__status">${status}</span></li>`;
    }).join('');
    const currentSchedule = moduleSchedules.get(module.id);
    lessonsNode.innerHTML = `<div class="course-lessons__head" style="--selected-module-art:url('${module.art}')"><div><p class="eyebrow">${module.id}</p><h3>${escapeHtml(module.title)}</h3><p class="course-instructor">Condução: ${escapeHtml(module.instructor)}</p>${currentSchedule?.liveUrl ? `<a class="course-live-link" href="${escapeHtml(currentSchedule.liveUrl)}" target="_blank" rel="noopener">◉ ${escapeHtml(currentSchedule.liveTitle || 'Acessar aula ao vivo')}</a>`:''}</div><span class="badge">${module.lessons.length} aulas</span></div><ul class="lesson-list">${lessonItems}</ul>`;
    lessonsNode.querySelectorAll('[data-play-lesson]').forEach(item=>{
      const lessonIndex = Number(item.dataset.playLesson);
      const completionKey = `${module.id.toLowerCase()}a${String(lessonIndex + 1).padStart(2, '0')}`;
      if (state.completedLessons.includes(completionKey)) {
        item.classList.add('lesson-item--completed');
        const icon = item.querySelector('.lesson-item__icon');
        const status = item.querySelector('.lesson-item__status');
        if (icon) icon.textContent = '✓';
        if (status) status.textContent = 'Concluída';
      }
      const play=()=>openLesson(state.selected,Number(item.dataset.playLesson));
      item.addEventListener('click',play); item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();play();}});
    });
  }
  function renderQuiz(){
    const module = modules[state.selected];
    const passed = state.passed.includes(module.id);
    const next = modules[state.selected+1];
    const allLessonsReleased = moduleAllowed(state.selected) && module.lessons.every((_,index)=>lessonAvailable(state.selected,index));
    const options = [quizPrompts[state.selected],...answers].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const lockedReason = !moduleAllowed(state.selected) ? 'Conclua a avaliação do módulo anterior para abrir esta etapa.' : `A avaliação será liberada após a última aula deste módulo, prevista para ${dayLabel(releaseDate(lessonOffset(state.selected,module.lessons.length-1),state.selected,module.lessons.length-1))}.`;
    quizNode.innerHTML = `<p class="eyebrow">Avaliação do módulo</p><h3>${passed?'Módulo concluído':allLessonsReleased?'Libere a próxima etapa com conhecimento':'Avaliação ainda bloqueada'}</h3><p>${passed ? `Você concluiu ${module.id}. ${next ? `O ${next.id} será aberto conforme o calendário da turma.` : 'Você concluiu a trilha de módulos.'}` : allLessonsReleased ? 'Responda corretamente a avaliação abaixo. Nota mínima: 70%.' : lockedReason}</p>${passed||!allLessonsReleased?'':`<form data-module-quiz><fieldset class="quiz-question"><legend>Qual é o foco principal deste módulo?</legend>${options.map((option,index)=>`<label class="quiz-option"><input type="radio" name="focus" value="${escapeHtml(option)}" required> <span>${escapeHtml(option)}</span></label>`).join('')}</fieldset><fieldset class="quiz-question"><legend>Quando a próxima gravação é disponibilizada?</legend><label class="quiz-option"><input type="radio" name="schedule" value="0" required> <span>Após o encontro, conforme o calendário da turma.</span></label><label class="quiz-option"><input type="radio" name="schedule" value="1"> <span>Todas as aulas ficam abertas no primeiro dia.</span></label><label class="quiz-option"><input type="radio" name="schedule" value="2"> <span>Somente no fim da certificação.</span></label></fieldset><button class="button" type="submit">Enviar avaliação</button><p class="quiz-result" data-quiz-result></p></form>`}`;
    const form=quizNode.querySelector('[data-module-quiz]');
    if(form) form.addEventListener('submit',event=>{
      event.preventDefault(); const data=new FormData(form); const ok=data.get('focus')===quizPrompts[state.selected]&&data.get('schedule')==='0'; const result=form.querySelector('[data-quiz-result]');
      if(ok && staffPreview){ result.textContent='Resposta correta. No modo de visualização docente, nenhum progresso é registrado.'; result.className='quiz-result quiz-result--pass'; }
      else if(ok){ state.passed.push(module.id); save(); result.textContent='Avaliação aprovada. Próximo módulo registrado na sua trilha.'; result.className='quiz-result quiz-result--pass'; renderModules(); updateProgress(); }
      else { result.textContent='Ainda não foi desta vez. Revise a aula e tente novamente.'; result.className='quiz-result quiz-result--fail'; }
    });
  }
  function openLesson(moduleIndex,lessonIndex){
    const module=modules[moduleIndex]; const remoteVideo = lessonVideo(moduleIndex, lessonIndex); const title=remoteVideo?.title || module.lessons[lessonIndex];
    const key=`${module.id.toLowerCase()}a${String(lessonIndex+1).padStart(2,'0')}`;
    const embeds=window.EPM_YOUTUBE_EMBEDS || {}; const id=remoteVideo ? (remoteVideo.published ? remoteVideo.videoId : '') : embeds[key];
    playerNode.classList.add('is-visible');
    playerNode.innerHTML=`<div class="course-player__bar"><div><p class="eyebrow">${module.id} · Aula ${String(lessonIndex+1).padStart(2,'0')}</p><h3>${escapeHtml(title)}</h3><p class="course-instructor">${escapeHtml(module.instructor)}</p></div><span class="badge">Disponível</span></div><div class="course-player__stage">${id?`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`:'<div class="course-player__placeholder"><span class="video-stage__play">▶</span><h4>Gravação em preparação</h4><p>A equipe acadêmica ainda não publicou a gravação desta aula. Assim que o professor salvar o vídeo, ela aparecerá aqui automaticamente, sem atualização manual do site.</p></div>'}</div>`;
    if (id) {
      const completed = state.completedLessons.includes(key);
      playerNode.insertAdjacentHTML('beforeend', `<form class="lesson-completion" data-lesson-completion><div><p class="eyebrow">Atividade de consolidação</p><h4>${completed ? 'Atividade concluída' : 'Conclua esta aula'}</h4><p>Registre uma breve aplicação do aprendizado. Esta atividade tem peso menor na média geral.</p></div><label>Minha reflexão / atividade<input name="answer" minlength="12" maxlength="800" required placeholder="Ex.: O conceito que aplicarei no meu projeto é..."></label><label class="teacher-checkbox"><input name="watched" type="checkbox" required> Declaro que assisti a esta aula e realizei a atividade.</label><button class="button" type="submit">${completed ? 'Atualizar atividade' : 'Concluir aula e registrar atividade'}</button><p class="form-feedback" data-lesson-feedback></p></form>`);
      playerNode.querySelector('[data-lesson-completion]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const feedback = form.querySelector('[data-lesson-feedback]');
        const answer = String(new FormData(form).get('answer') || '').trim();
        if (staffPreview) { feedback.textContent = 'Visualização docente: nenhum progresso é registrado.'; return; }
        if (!remoteProgress) { feedback.textContent = 'Entre com sua conta para registrar a atividade.'; feedback.className = 'form-feedback form-feedback--error'; return; }
        try {
          await remoteProgress.setDoc(remoteProgress.doc(remoteProgress.db, 'students', remoteProgress.uid, 'activities', key), { studentId: remoteProgress.uid, moduleId: module.id, lessonNumber: lessonIndex + 1, lessonKey: key, title, answer, status: 'submitted', submittedAt: remoteProgress.serverTimestamp(), updatedAt: remoteProgress.serverTimestamp() }, { merge: true });
          if (!state.completedLessons.includes(key)) state.completedLessons.push(key);
          save(); renderLessons(); updateProgress();
          feedback.textContent = 'Aula concluída e atividade registrada. Seu progresso foi atualizado.';
          feedback.className = 'form-feedback form-feedback--ok';
        } catch { feedback.textContent = 'Não foi possível registrar a atividade. Tente novamente.'; feedback.className = 'form-feedback form-feedback--error'; }
      });
    }
    playerNode.scrollIntoView({behavior:'smooth',block:'start'}); renderQuiz();
  }
  function render(){ renderModules(); renderLessons(); renderQuiz(); updateProgress(); }
  render();

  import('../firebase/firebase-client.js').then(async ({ firebaseReady }) => {
    if (!firebaseReady) return;
    const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
    authSdk.onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (stopRemoteLessons) { stopRemoteLessons(); stopRemoteLessons = null; }
        if (stopModuleSchedules) { stopModuleSchedules(); stopModuleSchedules = null; }
        remoteLessons.clear();
        moduleSchedules.clear();
        renderLessons();
        return;
      }
      try {
        const [staffSnapshot, snapshot, studentSnapshot] = await Promise.all([
          firestoreSdk.getDoc(firestoreSdk.doc(db, 'staff', user.uid)),
          firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid, 'progress', 'catalog')),
          firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid))
        ]);
        staffPreview = staffSnapshot.exists() && staffSnapshot.data().active === true;
        if (stopRemoteLessons) stopRemoteLessons();
        stopRemoteLessons = firestoreSdk.onSnapshot(firestoreSdk.collection(db, 'courseLessons'), (lessonSnapshot) => {
          remoteLessons.clear();
          lessonSnapshot.docs.forEach((entry) => {
            const item = entry.data();
            if (item.moduleId && item.lessonNumber) remoteLessons.set(`${String(item.moduleId).toLowerCase()}a${String(item.lessonNumber).padStart(2, '0')}`, item);
          });
          renderLessons();
        }, () => { /* O catálogo continua com o conteúdo de demonstração até as regras serem publicadas. */ });
        if (stopModuleSchedules) stopModuleSchedules();
        stopModuleSchedules = firestoreSdk.onSnapshot(firestoreSdk.collection(db, 'moduleSchedules'), (scheduleSnapshot) => {
          moduleSchedules.clear();
          scheduleSnapshot.docs.forEach((entry) => { const item = entry.data(); if (item.moduleId) moduleSchedules.set(String(item.moduleId), item); });
          render();
        }, () => { /* O calendário padrão continua disponível quando a coleção ainda não foi publicada. */ });
        if (staffPreview) {
          state.passed = [];
          remoteProgress = null;
          render();
          return;
        }
        remoteProgress = { db, uid: user.uid, doc: firestoreSdk.doc, setDoc: firestoreSdk.setDoc, serverTimestamp: firestoreSdk.serverTimestamp };
        const remoteCourseStart = studentSnapshot.exists() ? studentSnapshot.data().courseStart : '';
        if (remoteCourseStart) {
          const parsedCourseStart = new Date(`${remoteCourseStart}T00:00:00`);
          if (!Number.isNaN(parsedCourseStart.getTime())) { courseStart = parsedCourseStart; courseStart.setHours(0, 0, 0, 0); }
        }
        const completedModules = snapshot.exists() ? snapshot.data().completedModules : null;
        const completedLessons = snapshot.exists() ? snapshot.data().completedLessons : null;
        if (Array.isArray(completedModules)) {
          state.passed = completedModules.filter((id) => modules.some((module) => module.id === id));
        }
        if (Array.isArray(completedLessons)) {
          const validKeys = new Set(modules.flatMap((module) => module.lessons.map((_, index) => `${module.id.toLowerCase()}a${String(index + 1).padStart(2, '0')}`)));
          state.completedLessons = completedLessons.filter((key) => validKeys.has(key));
        }
        if (Array.isArray(completedModules) || Array.isArray(completedLessons)) {
          render();
        } else if (state.passed.length) {
          save();
        }
      } catch { /* A interface continua funcional enquanto as regras do Firestore são configuradas. */ }
    });
  }).catch(() => {});
})();
