/* Experiência pública premium. Não acessa autenticação, pagamentos ou banco de dados. */
(() => {
  const tour = document.querySelector('[data-platform-tour]');
  if (tour) {
    const tabs = [...tour.querySelectorAll('[data-tour-tab]')];
    const panels = [...tour.querySelectorAll('[data-tour-panel]')];
    const selectTour = (name, focus = false) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.tourTab === name;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.tourPanel !== name; });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTour(tab.dataset.tourTab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        selectTour(tabs[next].dataset.tourTab, true);
      });
    });
  }

  const finder = document.querySelector('[data-plan-finder]');
  if (finder) {
    const result = finder.querySelector('[data-plan-result]');
    const recommendations = {
      essencial: ['Plano Essencial', 'Indicado para quem quer autonomia e uma biblioteca estruturada de aulas gravadas.', '#plano-essencial'],
      profissional: ['Plano Profissional', 'Indicado para quem valoriza encontros ao vivo, calendário de turma e materiais incluídos.', '#plano-profissional'],
      premium: ['Plano Premium', 'Indicado para quem busca a formação completa com direção estratégica mensal.', '#plano-premium']
    };
    finder.querySelectorAll('[data-plan-choice]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.planChoice;
      const [title, description, href] = recommendations[key];
      finder.querySelectorAll('[data-plan-choice]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
      result.innerHTML = `<span>Recomendação</span><h3>${title}</h3><p>${description}</p><a class="button button--quiet" href="${href}">Ver este plano</a>`;
      document.querySelectorAll('[data-plan-card]').forEach((card) => card.classList.toggle('is-recommended', card.dataset.planCard === key));
    }));
  }

  document.querySelector('[data-print-curriculum]')?.addEventListener('click', () => window.print());

  const lab = document.querySelector('[data-sound-lab]');
  if (!lab) return;
  const playButton = lab.querySelector('[data-sound-play]');
  const status = lab.querySelector('[data-sound-status]');
  const modeButtons = [...lab.querySelectorAll('[data-sound-mode]')];
  const bars = [...lab.querySelectorAll('[data-sound-visualizer] span')];
  let context;
  let source;
  let analyser;
  let animationFrame;
  let playing = false;
  let mode = 'raw';
  let audioBuffer;

  const stop = () => {
    if (source) {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
      source = null;
    }
    playing = false;
    cancelAnimationFrame(animationFrame);
    bars.forEach((bar) => { bar.style.transform = 'scaleY(.18)'; });
    playButton.querySelector('span').textContent = '▶';
    playButton.querySelector('b').textContent = 'Ouvir demonstração';
    playButton.setAttribute('aria-label', 'Reproduzir demonstração sonora');
  };

  const createBuffer = (audioContext) => {
    const sampleRate = audioContext.sampleRate;
    const duration = 4.8;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioContext.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const beat = .6;
    const notes = [65.41, 65.41, 77.78, 58.27, 65.41, 65.41, 87.31, 77.78];
    const chords = [[130.81, 155.56, 196], [116.54, 146.83, 174.61], [103.83, 130.81, 155.56], [116.54, 146.83, 196]];
    let noiseState = 2463534242;
    const noise = () => {
      noiseState ^= noiseState << 13; noiseState ^= noiseState >>> 17; noiseState ^= noiseState << 5;
      return ((noiseState >>> 0) / 4294967295) * 2 - 1;
    };
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const beatIndex = Math.floor(t / beat);
      const withinBeat = t % beat;
      let mono = 0;
      const kickPhase = 2 * Math.PI * (52 * withinBeat + 34 * (1 - Math.exp(-withinBeat * 18)) / 18);
      if (withinBeat < .28) mono += Math.sin(kickPhase) * Math.exp(-withinBeat * 16) * .72;
      const halfBeat = t % (beat / 2);
      if (halfBeat < .055) mono += noise() * Math.exp(-halfBeat * 62) * .085;
      if (beatIndex % 4 === 1 || beatIndex % 4 === 3) {
        if (withinBeat < .2) mono += noise() * Math.exp(-withinBeat * 21) * .24;
      }
      const bassFrequency = notes[beatIndex % notes.length];
      const bassEnvelope = Math.min(1, withinBeat * 30) * Math.exp(-withinBeat * 1.5);
      mono += (Math.sin(2 * Math.PI * bassFrequency * t) + .22 * Math.sin(4 * Math.PI * bassFrequency * t)) * bassEnvelope * .17;
      const chord = chords[Math.floor(t / 1.2) % chords.length];
      const pad = chord.reduce((sum, frequency, index) => sum + Math.sin(2 * Math.PI * frequency * t + index * .7), 0) / chord.length;
      const padEnvelope = .5 + .5 * Math.sin(Math.PI * (t % 1.2) / 1.2);
      const shimmer = Math.sin(2 * Math.PI * chord[2] * 2 * t) * .025;
      left[i] = Math.tanh((mono + pad * padEnvelope * .13 + shimmer) * 1.1);
      right[i] = Math.tanh((mono + pad * padEnvelope * .13 - shimmer) * 1.1);
    }
    return buffer;
  };

  const animate = () => {
    if (!playing || !analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    bars.forEach((bar, index) => {
      const value = data[Math.floor(index * data.length / bars.length)] || 0;
      bar.style.transform = `scaleY(${Math.max(.14, value / 180)})`;
    });
    animationFrame = requestAnimationFrame(animate);
  };

  const start = async () => {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) {
      status.textContent = 'Seu navegador não oferece suporte a esta demonstração. O restante do site continua disponível.';
      playButton.disabled = true;
      return;
    }
    context ||= new AudioEngine();
    if (context.state === 'suspended') await context.resume();
    audioBuffer ||= createBuffer(context);
    stop();
    source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    analyser = context.createAnalyser();
    analyser.fftSize = 128;
    const output = context.createGain();
    if (mode === 'finished') {
      const low = context.createBiquadFilter();
      low.type = 'lowshelf'; low.frequency.value = 170; low.gain.value = -2.5;
      const presence = context.createBiquadFilter();
      presence.type = 'peaking'; presence.frequency.value = 2600; presence.Q.value = .8; presence.gain.value = 2.5;
      const air = context.createBiquadFilter();
      air.type = 'highshelf'; air.frequency.value = 6500; air.gain.value = 3;
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -19; compressor.knee.value = 16; compressor.ratio.value = 3.2; compressor.attack.value = .018; compressor.release.value = .22;
      output.gain.value = .88;
      source.connect(low).connect(presence).connect(air).connect(compressor).connect(output);
    } else {
      const dull = context.createBiquadFilter();
      dull.type = 'lowpass'; dull.frequency.value = 4700; dull.Q.value = .35;
      output.gain.value = .62;
      source.connect(dull).connect(output);
    }
    output.connect(analyser).connect(context.destination);
    source.start();
    playing = true;
    playButton.querySelector('span').textContent = '■';
    playButton.querySelector('b').textContent = 'Parar áudio';
    playButton.setAttribute('aria-label', 'Parar demonstração sonora');
    status.textContent = mode === 'finished' ? 'Ouvindo a finalização: mais definição, controle e presença.' : 'Ouvindo o rascunho: menos definição e controle de dinâmica.';
    animate();
  };

  playButton.addEventListener('click', () => { if (playing) { stop(); status.textContent = 'Demonstração pausada.'; } else start(); });
  modeButtons.forEach((button) => button.addEventListener('click', async () => {
    mode = button.dataset.soundMode;
    modeButtons.forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    const wasPlaying = playing;
    stop();
    status.textContent = mode === 'finished' ? 'Finalização selecionada. Dê o play para comparar.' : 'Rascunho selecionado. Dê o play para comparar.';
    if (wasPlaying) await start();
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
})();
