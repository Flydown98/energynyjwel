(() => {
  'use strict';

  const APP = window.CAMPAIGN_APP_CONFIG || {};
  const CONFIG = {
    organization: APP.organization || '남양주시장애인복지관',
    campaignName: APP.campaignName || '불을 끄고 별을 켜다',
    storageKey: 'lightsOutStarsOnProgress-v3',
    participationKey: 'lightsOutStarsOnParticipation-v3',
    submissionEndpoint: APP.appsScriptUrl || '',
    privacyPolicyUrl: APP.privacyPolicyUrl || 'https://nyjwel.or.kr/privacy',
    shareHashtags: Array.isArray(APP.shareHashtags) ? APP.shareHashtags : ['#남양주시장애인복지관', '#불을끄고별을켜다', '#에너지의날', '#에너지절약', '#에너지절약캠페인'],
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
    entryForm: document.getElementById('entryForm'),
    participantName: document.getElementById('participantName'),
    participantPhone: document.getElementById('participantPhone'),
    privacyConsent: document.getElementById('privacyConsent'),
    privacyOpen: document.getElementById('privacyOpenBtn'),
    privacyDialog: document.getElementById('privacyDialog'),
    privacyClose: document.getElementById('privacyCloseBtn'),
    privacyAgree: document.getElementById('privacyAgreeBtn'),
    instagram: document.getElementById('instagramBtn'),
    register: document.getElementById('registerBtn'),
    participationCode: document.getElementById('participationCode'),
    previewCode: document.getElementById('previewCode'),
    registrationStatus: document.getElementById('registrationStatus'),
    registrationStatusText: document.getElementById('registrationStatusText'),
    websiteField: document.getElementById('websiteField'),
    nameLabelText: document.getElementById('nameLabelText'),
    phoneLabelText: document.getElementById('phoneLabelText'),
    guardianNote: document.getElementById('guardianNote'),
    shareDialog: document.getElementById('shareDialog'),
    shareClose: document.getElementById('shareCloseBtn'),
    shareCaption: document.getElementById('shareCaption'),
    copyCaption: document.getElementById('copyCaptionBtn'),
    downloadCard: document.getElementById('downloadCardBtn'),
    nativeShare: document.getElementById('nativeShareBtn'),
  };

  let progress = loadProgress();
  let currentStage = null;
  let stageSolved = false;
  let soundOn = true;
  let audioCtx = null;
  let cleanupCurrentStage = () => {};
  let toastTimer = null;
  let cachedShareBlob = null;
  let cachedShareFile = null;

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
      if (id === 5 && progress.cleared.length === 5) enterEnding();
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


  // ---------- Ending / registration / Instagram share ----------
  function loadParticipation() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG.participationKey));
      if (saved && typeof saved.code === 'string') return saved;
    } catch (_) {}
    return null;
  }

  function saveParticipation(data) {
    try { localStorage.setItem(CONFIG.participationKey, JSON.stringify(data)); }
    catch (_) { /* 참여코드만 로컬 저장. 이름/전화번호는 저장하지 않음 */ }
  }

  function generateParticipationCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(6);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return 'STAR-' + [...bytes].map(n => alphabet[n % alphabet.length]).join('');
  }

  function getParticipationCode() {
    let data = loadParticipation();
    if (!data?.code) {
      data = { code: generateParticipationCode(), registered: false, createdAt: new Date().toISOString() };
      saveParticipation(data);
    }
    return data.code;
  }

  function setRegisteredLocal(registered) {
    const data = loadParticipation() || { code: getParticipationCode(), createdAt: new Date().toISOString() };
    data.registered = Boolean(registered);
    data.updatedAt = new Date().toISOString();
    saveParticipation(data);
    renderRegistrationState();
  }

  function resetParticipation() {
    try { localStorage.removeItem(CONFIG.participationKey); } catch (_) {}
    cachedShareBlob = null;
    cachedShareFile = null;
    els.participantName.value = '';
    els.participantPhone.value = '';
    els.privacyConsent.checked = false;
  }

  function renderRegistrationState() {
    const data = loadParticipation();
    const code = data?.code || getParticipationCode();
    els.participationCode.textContent = code;
    els.previewCode.textContent = code;
    const registered = Boolean(data?.registered);
    els.registrationStatus.classList.toggle('registered', registered);
    els.registrationStatusText.textContent = registered
      ? '기록 등록 완료 · 이 참여코드가 공유 이미지에도 표시됩니다.'
      : '기록 등록 후 이 참여코드와 인스타그램 게시물을 대조합니다.';
    const label = els.register.querySelector('b');
    const small = els.register.querySelector('small');
    if (registered) {
      label.textContent = '나의 에너지 기록 수정하기';
      small.textContent = '같은 참여코드로 정보 갱신';
    } else {
      label.textContent = '나의 에너지 기록 등록하기';
      small.textContent = '추첨 참여 정보 저장';
    }
  }

  function enterEnding() {
    getParticipationCode();
    renderRegistrationState();
    showScreen(els.ending);
    // 사용자가 공유 버튼을 눌렀을 때 바로 시스템 공유창을 띄울 수 있도록 미리 생성합니다.
    prepareShareAsset().catch(() => {});
  }

  function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatPhoneInput(value) {
    const digits = normalizePhone(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  }

  function getParticipantType() {
    return els.entryForm.querySelector('input[name="participantType"]:checked')?.value || 'adult';
  }

  function updateParticipantLabels() {
    const guardian = getParticipantType() === 'guardian';
    els.nameLabelText.textContent = guardian ? '법정대리인 이름' : '이름';
    els.phoneLabelText.textContent = guardian ? '법정대리인 전화번호' : '전화번호';
    els.guardianNote.classList.toggle('active', guardian);
  }

  function validateEntry() {
    const name = els.participantName.value.trim();
    const phone = normalizePhone(els.participantPhone.value);
    if (!name || name.length < 2) {
      els.participantName.focus();
      showToast('이름을 입력해주세요.');
      return null;
    }
    if (phone.length < 9 || phone.length > 11) {
      els.participantPhone.focus();
      showToast('전화번호를 확인해주세요.');
      return null;
    }
    if (!els.privacyConsent.checked) {
      showToast('개인정보 수집·이용 동의가 필요합니다.');
      els.privacyConsent.focus();
      return null;
    }
    if (els.websiteField.value) return null; // bot honeypot
    return { name, phone, participantType: getParticipantType() };
  }

  async function submitEntry(event) {
    event.preventDefault();
    const input = validateEntry();
    if (!input) return;
    if (progress.cleared.length !== 5) {
      showToast('5개의 별을 모두 찾은 뒤 등록할 수 있습니다.');
      return;
    }
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(CONFIG.submissionEndpoint)) {
      showToast('참여자 저장 서버 연결이 필요합니다. README의 설정 방법을 확인해주세요.');
      els.registrationStatus.classList.add('needs-setup');
      els.registrationStatusText.textContent = '관리자 설정 필요 · config.js에 Apps Script 웹 앱 /exec 주소를 입력해주세요.';
      return;
    }

    const code = getParticipationCode();
    const body = new URLSearchParams({
      action: 'submit',
      code,
      name: input.name,
      phone: input.phone,
      participantType: input.participantType,
      consent: 'yes',
      campaign: CONFIG.campaignName,
      stars: '5',
      clientTimestamp: new Date().toISOString(),
      website: '',
    });

    els.register.disabled = true;
    els.register.classList.add('loading');
    const oldSmall = els.register.querySelector('small').textContent;
    els.register.querySelector('small').textContent = '안전하게 등록 중…';

    try {
      // GitHub Pages → Apps Script 교차 출처 전송은 응답을 읽지 않는 no-cors 방식으로 처리합니다.
      // 입력값은 브라우저와 Apps Script 양쪽에서 검증합니다.
      await fetch(CONFIG.submissionEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: body.toString(),
        cache: 'no-store',
      });
      setRegisteredLocal(true);
      playSuccess();
      showToast('에너지 기록이 등록되었습니다!');
      els.participantName.value = '';
      els.participantPhone.value = '';
    } catch (err) {
      console.error(err);
      showToast('등록하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.');
      els.register.querySelector('small').textContent = oldSmall;
    } finally {
      els.register.disabled = false;
      els.register.classList.remove('loading');
      renderRegistrationState();
    }
  }

  function buildShareCaption(code = getParticipationCode()) {
    return [
      '✨ 불을 끄고 별을 켜다 · 5/5 STARS CLEAR!',
      '',
      `${CONFIG.organization} 에너지 절약 미니게임에서 다섯 개의 별을 모두 찾았습니다.`,
      '사용하지 않는 조명과 전자기기는 OFF, 여름철 실내 적정온도는 26℃!',
      '',
      `참여코드: ${code}`,
      '',
      CONFIG.shareHashtags.join(' '),
    ].join('\n');
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x+w, y, x+w, y+h, radius);
    ctx.arcTo(x+w, y+h, x, y+h, radius);
    ctx.arcTo(x, y+h, x, y, radius);
    ctx.arcTo(x, y, x+w, y, radius);
    ctx.closePath();
  }

  function drawStar(ctx, cx, cy, outer, inner, points = 5) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / points;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function createShareCanvas(code) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#061226');
    bg.addColorStop(.62, '#0b2449');
    bg.addColorStop(1, '#07152d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // deterministic-looking star field
    let seed = 217;
    for (let i = 0; i < 150; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const x = (seed / 233280) * 1080;
      seed = (seed * 9301 + 49297) % 233280;
      const y = (seed / 233280) * 800;
      seed = (seed * 9301 + 49297) % 233280;
      const r = 1 + (seed / 233280) * 2.4;
      ctx.globalAlpha = .18 + (r / 3.4) * .65;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,211,36,.07)';
    drawStar(ctx, 820, 310, 260, 110, 5); ctx.fill();
    ctx.shadowColor = 'rgba(255,211,36,.55)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffd324';
    drawStar(ctx, 810, 300, 84, 34, 5); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#8ea2c8';
    ctx.font = '800 26px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('ENERGY SAVING CHALLENGE', 90, 130);

    ctx.fillStyle = '#ffd324';
    ctx.font = '900 48px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('5 / 5 STARS FOUND', 90, 215);

    ctx.fillStyle = '#ffffff';
    ctx.font = '950 116px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('불을 끄고', 82, 480);
    ctx.fillStyle = '#ffd324';
    ctx.fillText('별을 켜다.', 82, 610);

    ctx.fillStyle = '#afbdd7';
    ctx.font = '600 34px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('작은 실천이 모이면 밤하늘이 조금 더 선명해집니다.', 90, 705);

    roundedRect(ctx, 90, 790, 900, 295, 42);
    ctx.fillStyle = 'rgba(7,21,45,.66)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#7389b1';
    ctx.font = '800 24px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('TODAY’S ENERGY PROMISE', 135, 855);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('사용하지 않는 조명과 전자기기는 OFF', 135, 930);
    ctx.fillText('여름철 실내 적정온도는 26℃', 135, 990);

    ctx.fillStyle = '#ffd324';
    ctx.font = '900 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`참여코드  ${code}`, 135, 1055);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText(CONFIG.organization, 90, 1190);
    ctx.fillStyle = '#7186aa';
    ctx.font = '700 24px system-ui, -apple-system, "Noto Sans KR", sans-serif';
    ctx.fillText('#불을끄고별을켜다  #에너지의날  #에너지절약', 90, 1250);
    ctx.fillStyle = '#ffd324';
    ctx.beginPath(); ctx.arc(958, 1180, 14, 0, Math.PI*2); ctx.fill();
    return canvas;
  }

  async function prepareShareAsset(force = false) {
    if (cachedShareBlob && !force) return cachedShareBlob;
    const code = getParticipationCode();
    const canvas = createShareCanvas(code);
    cachedShareBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 생성 실패')), 'image/png', 1);
    });
    cachedShareFile = new File([cachedShareBlob], `불을-끄고-별을-켜다-${code}.png`, { type: 'image/png' });
    return cachedShareBlob;
  }

  async function copyCaptionToClipboard() {
    const caption = buildShareCaption();
    els.shareCaption.value = caption;
    try {
      await navigator.clipboard.writeText(caption);
      showToast('게시글 문구를 복사했습니다.');
      return true;
    } catch (_) {
      els.shareCaption.focus();
      els.shareCaption.select();
      try { document.execCommand('copy'); showToast('게시글 문구를 복사했습니다.'); return true; }
      catch (_) { showToast('문구를 길게 눌러 직접 복사해주세요.'); return false; }
    }
  }

  async function nativeShare() {
    await prepareShareAsset();
    const caption = buildShareCaption();
    els.shareCaption.value = caption;
    // Instagram 앱은 공유받은 text를 항상 캡션에 넣지는 않으므로 먼저 클립보드에 복사합니다.
    try { await navigator.clipboard.writeText(caption); } catch (_) {}
    const data = { title: CONFIG.campaignName, text: caption, files: [cachedShareFile] };
    const canFileShare = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [cachedShareFile] }));
    if (canFileShare) {
      try {
        await navigator.share(data);
        showToast('공유 완료! 문구도 클립보드에 복사해두었습니다.');
        return true;
      } catch (err) {
        if (err?.name === 'AbortError') return false;
        console.warn('Web Share failed', err);
      }
    }
    return false;
  }

  function downloadShareCard() {
    if (!cachedShareBlob) return prepareShareAsset().then(downloadShareCard);
    const url = URL.createObjectURL(cachedShareBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `불을-끄고-별을-켜다-${getParticipationCode()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('클리어 이미지를 저장했습니다.');
  }

  async function handleInstagramShare() {
    if (!loadParticipation()?.registered) showToast('경품 추첨 참여를 위해 기록 등록을 먼저 권장합니다.');
    await prepareShareAsset();
    const shared = await nativeShare();
    if (!shared) {
      els.shareCaption.value = buildShareCaption();
      els.shareDialog.showModal();
    }
  }

  async function handleFallbackShare() {
    const shared = await nativeShare();
    if (!shared) {
      await copyCaptionToClipboard();
      downloadShareCard();
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    } else if (els.shareDialog.open) {
      els.shareDialog.close();
    }
  }

  // global controls
  els.start.addEventListener('click', () => { playClick(); goSelect(); });
  els.home.addEventListener('click', () => { cleanupCurrentStage(); showScreen(els.intro); });
  els.back.addEventListener('click', goSelect);
  els.endingStages.addEventListener('click', goSelect);
  els.replay.addEventListener('click', () => { resetParticipation(); progress = { cleared: [] }; saveProgress(); goSelect(); });
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

  els.entryForm.addEventListener('submit', submitEntry);
  els.participantPhone.addEventListener('input', () => { els.participantPhone.value = formatPhoneInput(els.participantPhone.value); });
  els.entryForm.querySelectorAll('input[name="participantType"]').forEach(r => r.addEventListener('change', updateParticipantLabels));
  els.privacyOpen.addEventListener('click', () => els.privacyDialog.showModal());
  els.privacyClose.addEventListener('click', () => els.privacyDialog.close());
  els.privacyAgree.addEventListener('click', () => { els.privacyConsent.checked = true; els.privacyDialog.close(); showToast('개인정보 수집·이용에 동의했습니다.'); });
  els.privacyDialog.addEventListener('click', e => { if (e.target === els.privacyDialog) els.privacyDialog.close(); });
  els.instagram.addEventListener('click', handleInstagramShare);
  els.shareClose.addEventListener('click', () => els.shareDialog.close());
  els.shareDialog.addEventListener('click', e => { if (e.target === els.shareDialog) els.shareDialog.close(); });
  els.copyCaption.addEventListener('click', copyCaptionToClipboard);
  els.downloadCard.addEventListener('click', downloadShareCard);
  els.nativeShare.addEventListener('click', handleFallbackShare);
  updateParticipantLabels();

  renderStageSelect();
})();
