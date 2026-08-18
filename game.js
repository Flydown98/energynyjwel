(() => {
  'use strict';

  const CONFIG = {
    organization: '남양주시장애인복지관',
    storageKey: 'lightsOutStarsOnProgress-v1',
    clearDelay: 1100,
    nextDelay: 1350,
  };

  const stages = [
    { id: 1, title: 'SWITCH', label: '불을 꺼봐', hint: '벽 어딘가에 아주 평범한 스위치가 있습니다.' },
    { id: 2, title: '26°', label: '숫자를 맞춰봐', hint: '여름철 실내 적정온도를 떠올려 보세요.' },
    { id: 3, title: 'STANDBY', label: '작은 불빛들', hint: '퇴근 후에도 빛나는 빨간 점부터 눌러보세요.' },
    { id: 4, title: 'WINDOW', label: '새는 바람', hint: '에어컨 바람이 밖으로 새고 있습니다. 창문을 끝까지 닫아보세요.' },
    { id: 5, title: 'LIGHTS OUT', label: '오늘의 마지막 불', hint: '건물에 남아 있는 모든 불빛을 꺼보세요.' },
  ];

  const els = {
    screens: [...document.querySelectorAll('.screen')],
    intro: document.getElementById('introScreen'),
    select: document.getElementById('selectScreen'),
    game: document.getElementById('gameScreen'),
    ending: document.getElementById('endingScreen'),
    start: document.getElementById('startBtn'),
    home: document.getElementById('homeBtn'),
    back: document.getElementById('backBtn'),
    reset: document.getElementById('resetBtn'),
    sound: document.getElementById('soundBtn'),
    replay: document.getElementById('replayBtn'),
    endingStages: document.getElementById('endingStagesBtn'),
    stageGrid: document.getElementById('stageGrid'),
    starCount: document.getElementById('starCount'),
    constellation: document.getElementById('miniConstellation'),
    stageLabel: document.getElementById('stageLabel'),
    stageSubtitle: document.getElementById('stageSubtitle'),
    gameFrame: document.getElementById('gameFrame'),
    hintBtn: document.getElementById('hintBtn'),
    hintText: document.getElementById('hintText'),
    clearOverlay: document.getElementById('clearOverlay'),
    clearStageText: document.getElementById('clearStageText'),
    toast: document.getElementById('toast'),
    orgName: document.getElementById('orgName'),
  };

  let progress = loadProgress();
  let currentStage = null;
  let stageSolved = false;
  let soundOn = true;
  let audioCtx = null;
  let cleanupCurrentStage = () => {};
  let toastTimer = null;

  els.orgName.textContent = `${CONFIG.organization} · 에너지 절약 미니게임`;

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (saved && Array.isArray(saved.cleared)) return { cleared: saved.cleared.filter(n => n >= 1 && n <= 5) };
    } catch (_) {}
    return { cleared: [] };
  }

  function saveProgress() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(progress)); }
    catch (_) { /* 저장소가 차단된 환경에서도 게임은 계속 진행 */ }
  }

  function showScreen(target) {
    els.screens.forEach(s => s.classList.toggle('active', s === target));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function isUnlocked(id) {
    return id === 1 || progress.cleared.includes(id) || progress.cleared.includes(id - 1);
  }

  function renderStageSelect() {
    els.stageGrid.innerHTML = '';
    stages.forEach(stage => {
      const cleared = progress.cleared.includes(stage.id);
      const unlocked = isUnlocked(stage.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `stage-tile${cleared ? ' cleared' : ''}`;
      btn.disabled = !unlocked;
      btn.setAttribute('aria-label', `스테이지 ${stage.id} ${stage.title}${cleared ? ', 완료' : unlocked ? '' : ', 잠김'}`);
      btn.innerHTML = `
        <span class="stage-number">${String(stage.id).padStart(2, '0')}</span>
        <span class="stage-icon" aria-hidden="true">${cleared ? '★' : unlocked ? '✦' : '×'}</span>
        <span class="stage-name">${stage.title}</span>`;
      btn.addEventListener('click', () => openStage(stage.id));
      els.stageGrid.appendChild(btn);
    });
    els.starCount.textContent = progress.cleared.length;
    els.constellation.innerHTML = Array.from({length: 5}, (_, i) => `<i class="${progress.cleared.includes(i + 1) ? 'on' : ''}"></i>`).join('');
  }

  function goSelect() {
    cleanupCurrentStage();
    currentStage = null;
    stageSolved = false;
    els.hintText.hidden = true;
    els.hintBtn.setAttribute('aria-expanded', 'false');
    renderStageSelect();
    showScreen(els.select);
  }

  function openStage(id) {
    if (!isUnlocked(id)) return;
    cleanupCurrentStage();
    currentStage = id;
    stageSolved = false;
    const data = stages[id - 1];
    els.stageLabel.textContent = `STAGE ${String(id).padStart(2, '0')}`;
    els.stageSubtitle.textContent = data.title;
    els.hintText.textContent = data.hint;
    els.hintText.hidden = true;
    els.hintBtn.setAttribute('aria-expanded', 'false');
    showScreen(els.game);
    cleanupCurrentStage = renderStage(id);
  }

  function completeStage(id) {
    if (stageSolved) return;
    stageSolved = true;
    if (!progress.cleared.includes(id)) {
      progress.cleared.push(id);
      progress.cleared.sort((a,b) => a-b);
      saveProgress();
    }
    playSuccess();
    setTimeout(() => {
      els.clearStageText.textContent = `${String(id).padStart(2, '0')} / 05`;
      els.clearOverlay.classList.add('show');
      els.clearOverlay.setAttribute('aria-hidden', 'false');
    }, CONFIG.clearDelay);
    setTimeout(() => {
      els.clearOverlay.classList.remove('show');
      els.clearOverlay.setAttribute('aria-hidden', 'true');
      if (id === 5 && progress.cleared.length === 5) showScreen(els.ending);
      else goSelect();
    }, CONFIG.clearDelay + CONFIG.nextDelay);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function getAudio() {
    if (!soundOn) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, duration=.08, type='sine', volume=.035, delay=0) {
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration + .03);
  }
  function playClick() { tone(260, .06, 'sine', .02); }
  function playSuccess() { [523,659,784,1047].forEach((f,i) => tone(f,.3,'sine',.035,i*.07)); }

  function renderStage(id) {
    if (id === 1) return renderStage1();
    if (id === 2) return renderStage2();
    if (id === 3) return renderStage3();
    if (id === 4) return renderStage4();
    return renderStage5();
  }

  function renderStage1() {
    els.gameFrame.innerHTML = `
      <div class="stage-scene room-stage" id="roomStage">
        <div class="room-window"><div class="window-star star-shape"></div></div>
        <div class="room-table"></div>
        <div class="desk-lamp">
          <div class="light-cone"></div><div class="lamp-arm"></div><div class="lamp-head"></div><div class="lamp-base"></div>
        </div>
        <button class="wall-switch" id="wallSwitch" type="button" aria-label="벽 스위치"></button>
        <span class="scene-caption">01 · AFTER WORK</span>
      </div>`;
    const scene = document.getElementById('roomStage');
    const sw = document.getElementById('wallSwitch');
    const click = () => {
      if (stageSolved) return;
      playClick();
      scene.classList.add('off');
      sw.setAttribute('aria-label', '불 꺼짐');
      setTimeout(() => completeStage(1), 650);
    };
    sw.addEventListener('click', click, { once: true });
    return () => sw.removeEventListener('click', click);
  }

  function renderStage2() {
    els.gameFrame.innerHTML = `
      <div class="stage-scene thermo-stage" id="thermoStage">
        <div class="thermo-unit" id="thermoUnit">
          <i class="thermo-led"></i>
          <div class="thermo-display"><span id="tempValue">18</span><small>℃</small></div>
          <div class="thermo-arrows">
            <button class="temp-btn" id="tempUp" type="button" aria-label="온도 올리기">＋</button>
            <button class="temp-btn" id="tempDown" type="button" aria-label="온도 내리기">−</button>
          </div>
          <div class="thermo-star star-shape"></div>
        </div>
        <p class="thermo-message">여름철 실내 적정온도 · 26℃</p>
        <span class="scene-caption">02 · COOL SMART</span>
      </div>`;
    const scene = document.getElementById('thermoStage');
    const unit = document.getElementById('thermoUnit');
    const value = document.getElementById('tempValue');
    const up = document.getElementById('tempUp');
    const down = document.getElementById('tempDown');
    let temp = 18;
    let dragStartY = null;
    let dragStartTemp = temp;

    const update = (next) => {
      if (stageSolved) return;
      temp = Math.max(16, Math.min(30, next));
      value.textContent = temp;
      playClick();
      if (temp === 26) {
        scene.classList.add('solved');
        setTimeout(() => completeStage(2), 520);
      }
    };
    const inc = () => update(temp + 1);
    const dec = () => update(temp - 1);
    const downPointer = e => { if (stageSolved || e.target.closest('.temp-btn')) return; dragStartY = e.clientY; dragStartTemp = temp; unit.setPointerCapture?.(e.pointerId); };
    const movePointer = e => {
      if (dragStartY == null || stageSolved) return;
      const delta = Math.round((dragStartY - e.clientY) / 18);
      const next = Math.max(16, Math.min(30, dragStartTemp + delta));
      if (next !== temp) { temp = next; value.textContent = temp; tone(220 + temp*5,.035,'sine',.012); }
      if (temp === 26) { dragStartY = null; scene.classList.add('solved'); setTimeout(() => completeStage(2), 520); }
    };
    const upPointer = () => { dragStartY = null; };
    up.addEventListener('click', inc); down.addEventListener('click', dec);
    unit.addEventListener('pointerdown', downPointer); unit.addEventListener('pointermove', movePointer); unit.addEventListener('pointerup', upPointer); unit.addEventListener('pointercancel', upPointer);
    return () => {
      up.removeEventListener('click', inc); down.removeEventListener('click', dec);
      unit.removeEventListener('pointerdown', downPointer); unit.removeEventListener('pointermove', movePointer); unit.removeEventListener('pointerup', upPointer); unit.removeEventListener('pointercancel', upPointer);
    };
  }

  function renderStage3() {
    const nodes = [
      {x:50,y:13,icon:'▣',name:'모니터'},
      {x:82,y:38,icon:'▤',name:'프린터'},
      {x:70,y:78,icon:'⌁',name:'충전기'},
      {x:30,y:78,icon:'▱',name:'TV'},
      {x:18,y:38,icon:'◫',name:'스피커'},
    ];
    els.gameFrame.innerHTML = `
      <div class="stage-scene standby-stage" id="standbyStage">
        <div class="standby-board">
          <svg class="standby-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 13 L70 78 L18 38 L82 38 L30 78 Z"/></svg>
          ${nodes.map((n,i)=>`<button class="device-node" data-i="${i}" type="button" aria-label="${n.name} 대기전력 끄기" style="left:${n.x}%;top:${n.y}%"><span>${n.icon}</span><i></i></button>`).join('')}
          <div class="standby-center-star star-shape"></div>
          <span class="board-label">STANDBY POWER · 5 DEVICES</span>
        </div>
        <span class="scene-caption" style="color:#46546a">03 · GOOD NIGHT</span>
      </div>`;
    const scene = document.getElementById('standbyStage');
    const buttons = [...scene.querySelectorAll('.device-node')];
    const handlers = [];
    let offCount = 0;
    buttons.forEach(btn => {
      const handler = () => {
        if (stageSolved || btn.classList.contains('off')) return;
        btn.classList.add('off'); offCount++; playClick();
        if (offCount === buttons.length) {
          scene.classList.add('solved');
          setTimeout(() => completeStage(3), 900);
        }
      };
      handlers.push([btn,handler]); btn.addEventListener('click',handler);
    });
    return () => handlers.forEach(([b,h]) => b.removeEventListener('click',h));
  }

  function renderStage4() {
    els.gameFrame.innerHTML = `
      <div class="stage-scene window-stage" id="windowStage">
        <div class="ac-unit"></div>
        <div class="airflow"><i></i><i></i><i></i><i></i></div>
        <div class="big-window" id="bigWindow">
          <div class="outdoor-star star-shape"></div>
          <div class="window-fixed"></div>
          <div class="window-panel" id="windowPanel" role="slider" tabindex="0" aria-label="창문 닫기" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
        </div>
        <div class="window-track"></div>
        <span class="scene-caption">04 · KEEP IT COOL</span>
      </div>`;
    const scene = document.getElementById('windowStage');
    const win = document.getElementById('bigWindow');
    const panel = document.getElementById('windowPanel');
    let dragging = false;
    let pct = 0;
    let startX = 0;
    let startPct = 0;

    const setPct = p => {
      pct = Math.max(0, Math.min(100, p));
      panel.style.left = `${pct * .48}%`;
      panel.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (pct >= 93 && !stageSolved) {
        pct = 100; panel.style.left = '48%'; panel.setAttribute('aria-valuenow','100');
        scene.classList.add('solved'); playClick();
        setTimeout(() => completeStage(4), 700);
      }
    };
    const pdown = e => { if(stageSolved) return; dragging = true; startX = e.clientX; startPct = pct; panel.setPointerCapture?.(e.pointerId); };
    const pmove = e => { if(!dragging || stageSolved) return; const width = win.getBoundingClientRect().width; setPct(startPct + ((e.clientX - startX) / width) * 208); };
    const pup = () => { dragging = false; };
    const key = e => {
      if (stageSolved) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setPct(pct + 10); tone(240,.04,'sine',.015); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPct(pct - 10); tone(220,.04,'sine',.015); }
    };
    panel.addEventListener('pointerdown',pdown); panel.addEventListener('pointermove',pmove); panel.addEventListener('pointerup',pup); panel.addEventListener('pointercancel',pup); panel.addEventListener('keydown',key);
    return () => { panel.removeEventListener('pointerdown',pdown); panel.removeEventListener('pointermove',pmove); panel.removeEventListener('pointerup',pup); panel.removeEventListener('pointercancel',pup); panel.removeEventListener('keydown',key); };
  }

  function renderStage5() {
    const starPos = [[11,12],[25,29],[42,9],[59,25],[76,10],[89,34],[18,48],[48,43],[72,52],[34,61],[62,67],[84,73]];
    els.gameFrame.innerHTML = `
      <div class="stage-scene building-stage" id="buildingStage">
        <div class="city-stars">${starPos.map((p,i)=>`<i data-i="${i}" style="left:${p[0]}%;top:${p[1]}%"></i>`).join('')}</div>
        <svg class="constellation-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 L61 38 L96 38 L68 58 L78 92 L50 72 L22 92 L32 58 L4 38 L39 38 Z"/></svg>
        <div class="final-sky-star star-shape"></div>
        <div class="building">
          <div class="building-sign">LIGHTS OUT · STARS ON</div>
          <div class="windows-grid">${Array.from({length:12},(_,i)=>`<button class="building-window" data-i="${i}" type="button" aria-label="${i+1}번째 불 끄기"></button>`).join('')}</div>
        </div>
        <span class="scene-caption" style="color:#56657f">05 · ONE LAST LIGHT</span>
      </div>`;
    const scene = document.getElementById('buildingStage');
    const buttons = [...scene.querySelectorAll('.building-window')];
    const sky = [...scene.querySelectorAll('.city-stars i')];
    const handlers = [];
    let offCount = 0;
    buttons.forEach((btn,i) => {
      const handler = () => {
        if (stageSolved || btn.classList.contains('off')) return;
        btn.classList.add('off'); btn.disabled = true; sky[i]?.classList.add('on'); offCount++; tone(300 + offCount*22,.05,'sine',.018);
        if (offCount === buttons.length) {
          scene.classList.add('solved');
          setTimeout(() => completeStage(5), 1250);
        }
      };
      handlers.push([btn,handler]); btn.addEventListener('click',handler);
    });
    return () => handlers.forEach(([b,h]) => b.removeEventListener('click',h));
  }

  // global controls
  els.start.addEventListener('click', () => { playClick(); goSelect(); });
  els.home.addEventListener('click', () => { cleanupCurrentStage(); showScreen(els.intro); });
  els.back.addEventListener('click', goSelect);
  els.endingStages.addEventListener('click', goSelect);
  els.replay.addEventListener('click', () => { progress = { cleared: [] }; saveProgress(); goSelect(); });
  els.sound.addEventListener('click', () => {
    soundOn = !soundOn;
    els.sound.setAttribute('aria-pressed', String(soundOn));
    els.sound.textContent = soundOn ? '♪' : '×';
    if (soundOn) { tone(440,.06,'sine',.025); showToast('소리 켜짐'); } else showToast('소리 꺼짐');
  });
  els.reset.addEventListener('click', () => {
    const ok = window.confirm('찾은 별과 스테이지 진행상황을 모두 초기화할까요?');
    if (!ok) return;
    progress = { cleared: [] }; saveProgress(); showToast('진행상황을 초기화했습니다.');
    if (els.select.classList.contains('active')) renderStageSelect();
  });
  els.hintBtn.addEventListener('click', () => {
    const isHidden = els.hintText.hidden;
    els.hintText.hidden = !isHidden;
    els.hintBtn.setAttribute('aria-expanded', String(isHidden));
    playClick();
  });

  renderStageSelect();
})();
