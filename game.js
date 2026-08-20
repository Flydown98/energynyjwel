(() => {
  'use strict';

  const APP = window.CAMPAIGN_APP_CONFIG || {};
  const CONFIG = {
    organization: APP.organization || '남양주시장애인복지관',
    campaignName: APP.campaignName || '불을 끄고 별을 켜다',
    storageKey: 'lightsOutStarsOnProgress-v3',
    participationKey: 'lightsOutStarsOnParticipation-v4',
    assistanceKey: 'lightsOutStarsOnAssistance-v1',
    submissionEndpoint: APP.appsScriptUrl || '',
    privacyPolicyUrl: APP.privacyPolicyUrl || 'https://nyjwel.or.kr/privacy',
    instagramHandle: APP.instagramHandle || '@nyjwel',
    shareHashtags: Array.isArray(APP.shareHashtags) ? APP.shareHashtags : ['#남양주시장애인복지관', '#불을끄고별을켜다', '#에너지의날', '#에너지절약챌린지', '#에너지절약'],
    clearDelay: 700,
    nextDelay: 3200,
  };

  const stages = [
    {
      id: 1, title: 'SWITCH', label: '사용하지 않는 불 끄기', icon: '💡',
      why: '사람이 없는 공간의 조명을 계속 켜두면 불필요한 전력이 사용돼요. 사용하지 않는 불을 끄는 작은 습관이 에너지 절약의 시작입니다.',
      action: '방 안의 스위치를 눌러 켜진 전등을 꺼보세요.',
      hint: '스위치는 벽 아래쪽에 있어요. 전등과 연결된 스위치를 찾아보세요.',
      directHint: '화면 왼쪽 아래쪽의 “스위치” 표시를 눌러보세요.',
      clearTitle: '사용하지 않는 조명은 OFF!',
      clearText: '필요하지 않은 조명을 바로 끄면 불필요한 전력 소비를 줄일 수 있어요.'
    },
    {
      id: 2, title: '26°', label: '여름철 적정온도 지키기', icon: '🌡️',
      why: '여름철 실내 냉방온도를 지나치게 낮추면 전력 사용량이 커져요. 이 게임에서는 실내 적정온도 26℃를 기억해봅니다.',
      action: '+ / − 버튼을 눌러 온도를 26℃로 맞춰보세요.',
      hint: '우리나라 여름철 실내 적정온도는 26℃! 숫자를 천천히 올려보세요.',
      directHint: '+ 버튼을 눌러 화면의 숫자를 26℃로 맞춰보세요.',
      clearTitle: '여름철 실내 적정온도 26℃!',
      clearText: '적정 냉방온도를 지키면 냉방에 사용하는 에너지를 줄이는 데 도움이 됩니다.'
    },
    {
      id: 3, title: 'STANDBY', label: '대기전력 줄이기', icon: '🔌',
      why: '전자기기를 사용하지 않아도 플러그가 연결되어 있거나 전원 표시등이 켜져 있으면 전기가 조금씩 소비될 수 있어요. 이를 대기전력이라고 해요.',
      action: '화면의 전자기기마다 보이는 빨간 전원 표시(●)를 눌러 모두 꺼보세요.',
      hint: '빨간 불빛은 “아직 전기를 사용하고 있어요”라는 표시예요.',
      directHint: '모니터·프린터·충전기·TV·스피커의 빨간 전원 표시를 하나씩 눌러 OFF로 바꿔보세요.',
      clearTitle: '사용하지 않을 때는 대기전력도 OFF!',
      clearText: '사용하지 않는 전자기기의 전원과 멀티탭을 끄면 새어나가는 대기전력을 줄일 수 있어요.'
    },
    {
      id: 4, title: 'WINDOW', label: '냉방 중 창문 닫기', icon: '🪟',
      why: '에어컨을 켠 채 창문이 열려 있으면 시원한 공기가 밖으로 빠져나가 냉방 효율이 떨어지고 에너지가 낭비돼요.',
      action: '열려 있는 창문을 오른쪽으로 밀어 끝까지 닫아보세요.',
      hint: '파란 바람이 창문 밖으로 빠져나가고 있어요. 창문을 닫으면 막을 수 있어요.',
      directHint: '창문 패널을 오른쪽 끝까지 밀어 닫아보세요. 조작이 어렵다면 “쉬운 조작” 버튼을 이용해도 됩니다.',
      clearTitle: '냉방 중에는 문과 창문을 닫아요!',
      clearText: '시원한 공기가 빠져나가지 않도록 하면 냉방 효율을 높이고 에너지 낭비를 줄일 수 있어요.'
    },
    {
      id: 5, title: 'LIGHTS OUT', label: '함께 만드는 에너지 절약', icon: '⭐',
      why: '한 사람의 작은 실천도 중요하지만 여러 사람이 함께 실천하면 더 큰 에너지 절약으로 이어질 수 있어요.',
      action: '복지관 건물에 남아 있는 밝은 창문을 하나씩 눌러 모든 불을 꺼보세요.',
      hint: '아직 노랗게 빛나는 창문이 있는지 찾아보세요.',
      directHint: '밝은 창문을 하나씩 눌러 모두 어둡게 만들면 밤하늘의 별이 완성됩니다.',
      clearTitle: '작은 실천이 모이면 큰 변화가 됩니다!',
      clearText: '우리 모두가 함께 조명·냉방·대기전력을 관리하면 더 많은 에너지를 절약할 수 있어요.'
    },
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
    stageGuide: document.getElementById('stageGuide'),
    stageGuideIcon: document.getElementById('stageGuideIcon'),
    stageGuideKicker: document.getElementById('stageGuideKicker'),
    stageGuideTitle: document.getElementById('stageGuideTitle'),
    stageGuideWhy: document.getElementById('stageGuideWhy'),
    stageGuideAction: document.getElementById('stageGuideAction'),
    gameFrame: document.getElementById('gameFrame'),
    hintBtn: document.getElementById('hintBtn'),
    hintText: document.getElementById('hintText'),
    clearOverlay: document.getElementById('clearOverlay'),
    clearStageText: document.getElementById('clearStageText'),
    clearLearningTitle: document.getElementById('clearLearningTitle'),
    clearLearningText: document.getElementById('clearLearningText'),
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
    introHelp: document.getElementById('introHelpBtn'),
    helpBtn: document.getElementById('helpBtn'),
    helpDialog: document.getElementById('helpDialog'),
    helpClose: document.getElementById('helpCloseBtn'),
    easyControl: document.getElementById('easyControlBtn'),
    showHintNow: document.getElementById('showHintNowBtn'),
    autoHelpActions: document.getElementById('autoHelpActions'),
    assistControl: document.getElementById('assistControlBtn'),
    alternative: document.getElementById('alternativeBtn'),
    pledgeChoices: [...document.querySelectorAll('.pledge-choice')],
    publicParticipationCount: document.getElementById('publicParticipationCount'),
    endingParticipationCount: document.getElementById('endingParticipationCount'),
    privateInstagram: document.getElementById('privateInstagramBtn'),
    privateInstagramDialog: document.getElementById('privateInstagramDialog'),
    privateInstagramClose: document.getElementById('privateInstagramCloseBtn'),
    privateInstagramDone: document.getElementById('privateInstagramDoneBtn'),
    privateParticipationCode: document.getElementById('privateParticipationCode'),
    copyPrivateCode: document.getElementById('copyPrivateCodeBtn'),
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
  let shareAssetReady = false;
  let helpTimers = [];
  let publicCount = null;
  let easyControlOn = loadEasyControl();

  els.orgName.textContent = `${CONFIG.organization} · 에너지 절약 미니게임`;

  // PC / 모바일 자동 레이아웃 전환
  // 화면 폭뿐 아니라 터치 포인터와 회전 상태까지 감지해 스마트폰/태블릿에서 레이아웃을 자동 변경합니다.
  const mobileLayoutQuery = window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)');

  function syncResponsiveLayout() {
    const vv = window.visualViewport;
    const viewportHeight = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight);
    const viewportWidth = Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth);
    const isMobileLayout = mobileLayoutQuery.matches;
    const isLandscape = viewportWidth > viewportHeight;

    document.documentElement.dataset.layout = isMobileLayout ? 'mobile' : 'desktop';
    document.documentElement.dataset.orientation = isLandscape ? 'landscape' : 'portrait';
    document.documentElement.style.setProperty('--app-vh', `${viewportHeight}px`);
    document.documentElement.style.setProperty('--app-vw', `${viewportWidth}px`);
  }

  syncResponsiveLayout();
  mobileLayoutQuery.addEventListener?.('change', syncResponsiveLayout);
  window.addEventListener('resize', syncResponsiveLayout, { passive: true });
  window.addEventListener('orientationchange', syncResponsiveLayout, { passive: true });
  window.visualViewport?.addEventListener('resize', syncResponsiveLayout, { passive: true });


  function loadEasyControl() {
    try { return localStorage.getItem(CONFIG.assistanceKey) === 'on'; }
    catch (_) { return false; }
  }

  function setEasyControl(enabled, announce = true) {
    easyControlOn = Boolean(enabled);
    document.documentElement.dataset.assist = easyControlOn ? 'on' : 'off';
    try { localStorage.setItem(CONFIG.assistanceKey, easyControlOn ? 'on' : 'off'); } catch (_) {}
    if (els.easyControl) {
      els.easyControl.setAttribute('aria-pressed', String(easyControlOn));
      els.easyControl.classList.toggle('active', easyControlOn);
      const b = els.easyControl.querySelector('b');
      if (b) b.textContent = easyControlOn ? '쉬운 조작 사용 중' : '쉬운 조작';
    }
    if (els.assistControl) els.assistControl.textContent = easyControlOn ? '쉬운 조작 끄기' : '쉬운 조작 켜기';
    if (announce) showToast(easyControlOn ? '쉬운 조작을 켰습니다.' : '쉬운 조작을 껐습니다.');
  }

  function clearHelpTimers() {
    helpTimers.forEach(clearTimeout);
    helpTimers = [];
    els.hintBtn?.classList.remove('attention');
    if (els.autoHelpActions) els.autoHelpActions.hidden = true;
  }

  function pulseCurrentTarget() {
    const selectors = {
      1: '.wall-switch',
      2: '.temp-btn',
      3: '.device-node:not(.off)',
      4: '.window-panel',
      5: '.building-window:not(.off)'
    };
    const target = els.gameFrame.querySelector(selectors[currentStage] || '');
    if (!target) return;
    target.classList.add('guidance-pulse');
    setTimeout(() => target.classList.remove('guidance-pulse'), 3300);
  }

  function revealHint(level = 1, announce = false) {
    if (!currentStage || stageSolved) return;
    const data = stages[currentStage - 1];
    els.hintText.textContent = level >= 2 ? data.directHint : data.hint;
    els.hintText.hidden = false;
    els.hintBtn.setAttribute('aria-expanded', 'true');
    els.hintBtn.classList.remove('attention');
    if (level >= 2) {
      pulseCurrentTarget();
      els.autoHelpActions.hidden = false;
    }
    if (announce) showToast(level >= 2 ? '조금 더 구체적인 힌트를 표시했습니다.' : '힌트를 표시했습니다.');
  }

  function scheduleStageHelp() {
    clearHelpTimers();
    helpTimers.push(setTimeout(() => {
      if (stageSolved || !currentStage) return;
      els.hintBtn.classList.add('attention');
      showToast('막히면 HINT를 눌러보세요.');
    }, 12000));
    helpTimers.push(setTimeout(() => {
      if (stageSolved || !currentStage) return;
      revealHint(1);
    }, 24000));
    helpTimers.push(setTimeout(() => {
      if (stageSolved || !currentStage) return;
      revealHint(2);
    }, 38000));
  }

  function openHelpDialog(showAlternative = false) {
    setEasyControl(easyControlOn, false);
    const panel = document.getElementById('alternativeParticipation');
    if (panel) {
      panel.hidden = !currentStage;
      panel.classList.toggle('emphasis', Boolean(showAlternative && currentStage));
    }
    if (els.showHintNow) els.showHintNow.disabled = !currentStage;
    els.helpDialog?.showModal();
  }

  function completeStageByPledge(pledge) {
    if (!currentStage || stageSolved) return;
    const stageId = currentStage;
    try {
      const history = JSON.parse(localStorage.getItem('lightsOutStarsOnPledges-v1') || '[]');
      history.push({ stage: stageId, pledge, at: new Date().toISOString() });
      localStorage.setItem('lightsOutStarsOnPledges-v1', JSON.stringify(history.slice(-20)));
    } catch (_) {}
    els.helpDialog?.close();
    showToast(`“${pledge}” 실천으로 별을 켭니다.`);
    setTimeout(() => completeStage(stageId), 420);
  }

  function isValidEndpoint() {
    return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(CONFIG.submissionEndpoint);
  }

  function setPublicCount(count) {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) return;
    publicCount = Math.floor(n);
    const text = publicCount.toLocaleString('ko-KR');
    if (els.publicParticipationCount) els.publicParticipationCount.textContent = text;
    if (els.endingParticipationCount) els.endingParticipationCount.textContent = text;
  }

  function loadPublicCount() {
    if (!isValidEndpoint()) return;
    const cb = `__energyCount_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      script.remove();
    };
    window[cb] = payload => {
      if (payload?.ok) setPublicCount(payload.count);
      cleanup();
    };
    const joiner = CONFIG.submissionEndpoint.includes('?') ? '&' : '?';
    script.src = `${CONFIG.submissionEndpoint}${joiner}action=count&callback=${encodeURIComponent(cb)}&_=${Date.now()}`;
    script.async = true;
    script.onerror = cleanup;
    document.head.appendChild(script);
    timer = setTimeout(cleanup, 8000);
  }

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
        <span class="stage-name">${stage.label}</span>
        <span class="stage-english">${stage.title}</span>`;
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
    clearHelpTimers();
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
    if (els.stageGuideIcon) els.stageGuideIcon.textContent = data.icon;
    if (els.stageGuideKicker) els.stageGuideKicker.textContent = `STAGE ${String(id).padStart(2, '0')} · 오늘의 에너지 실천`;
    if (els.stageGuideTitle) els.stageGuideTitle.textContent = data.label;
    if (els.stageGuideWhy) els.stageGuideWhy.textContent = data.why;
    if (els.stageGuideAction) els.stageGuideAction.innerHTML = `<b>해보기</b> ${data.action}`;
    els.hintText.textContent = data.hint;
    els.hintText.hidden = true;
    els.hintBtn.setAttribute('aria-expanded', 'false');
    showScreen(els.game);
    const stageCleanup = renderStage(id);
    scheduleStageHelp();
    cleanupCurrentStage = () => {
      clearHelpTimers();
      stageCleanup?.();
    };
  }

  function completeStage(id) {
    if (stageSolved) return;
    stageSolved = true;
    clearHelpTimers();
    if (!progress.cleared.includes(id)) {
      progress.cleared.push(id);
      progress.cleared.sort((a,b) => a-b);
      saveProgress();
    }
    playSuccess();
    setTimeout(() => {
      const data = stages[id - 1];
      els.clearStageText.textContent = `${String(id).padStart(2, '0')} / 05`;
      if (els.clearLearningTitle) els.clearLearningTitle.textContent = data.clearTitle;
      if (els.clearLearningText) els.clearLearningText.textContent = data.clearText;
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
        <div class="scene-learning-tag stage1-tag">💡 사람이 없는 공간의 불은 꺼주세요</div>
        <button class="wall-switch" id="wallSwitch" type="button" aria-label="벽 스위치"><span class="control-label">스위치<br><b>눌러보기</b></span></button>
        <button class="stage-assist-action" id="stage1Assist" type="button">💡 전등 끄기</button>
        <span class="scene-caption">01 · AFTER WORK</span>
      </div>`;
    const scene = document.getElementById('roomStage');
    const sw = document.getElementById('wallSwitch');
    const assist = document.getElementById('stage1Assist');
    let activated = false;
    const click = () => {
      if (stageSolved || activated) return;
      activated = true;
      playClick();
      scene.classList.add('off');
      sw.setAttribute('aria-label', '불 꺼짐');
      setTimeout(() => completeStage(1), 650);
    };
    sw.addEventListener('click', click, { once: true });
    assist.addEventListener('click', click, { once: true });
    return () => { sw.removeEventListener('click', click); assist.removeEventListener('click', click); };
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
        <div class="scene-learning-tag stage2-tag">🌡️ 여름철 실내 적정온도는 <b>26℃</b></div>
        <div class="temp-action-guide" aria-hidden="true"><span>＋ 온도 올리기</span><span>− 온도 내리기</span></div>
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
      {x:50,y:13,icon:'🖥️',name:'모니터'},
      {x:82,y:38,icon:'🖨️',name:'프린터'},
      {x:70,y:78,icon:'🔋',name:'충전기'},
      {x:30,y:78,icon:'📺',name:'TV'},
      {x:18,y:38,icon:'🔊',name:'스피커'},
    ];
    els.gameFrame.innerHTML = `
      <div class="stage-scene standby-stage" id="standbyStage">
        <div class="standby-board">
          <svg class="standby-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 13 L70 78 L18 38 L82 38 L30 78 Z"/></svg>
          ${nodes.map((n,i)=>`<button class="device-node" data-i="${i}" type="button" aria-label="${n.name} 대기전력 끄기" style="left:${n.x}%;top:${n.y}%"><span class="device-icon">${n.icon}</span><i></i><em class="device-name">${n.name}</em><small class="power-label">● 눌러 OFF</small></button>`).join('')}
          <div class="standby-center-star star-shape"></div>
          <div class="scene-learning-tag stage3-tag">🔌 빨간 전원 표시를 눌러 <b>대기전력 OFF</b></div>
          <span class="board-label">STANDBY POWER · 5 DEVICES</span>
        </div>
        <button class="stage-assist-action" id="stage3Assist" type="button">🔌 대기전력 한 번에 끄기</button>
        <span class="scene-caption" style="color:#46546a">03 · GOOD NIGHT</span>
      </div>`;
    const scene = document.getElementById('standbyStage');
    const buttons = [...scene.querySelectorAll('.device-node')];
    const assist = document.getElementById('stage3Assist');
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
    const assistHandler = () => {
      if (stageSolved) return;
      buttons.forEach((btn, i) => setTimeout(() => btn.click(), i * 110));
    };
    assist.addEventListener('click', assistHandler);
    return () => { handlers.forEach(([b,h]) => b.removeEventListener('click',h)); assist.removeEventListener('click', assistHandler); };
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
        <div class="scene-learning-tag stage4-tag">🪟 냉방 중 열린 창문 → <b>닫아주세요</b></div>
        <div class="window-motion-guide" aria-hidden="true">창문을 오른쪽으로 밀기 <b>→</b></div>
        <button class="stage-assist-action" id="stage4Assist" type="button">🪟 버튼으로 창문 닫기</button>
        <span class="scene-caption">04 · KEEP IT COOL</span>
      </div>`;
    const scene = document.getElementById('windowStage');
    const win = document.getElementById('bigWindow');
    const panel = document.getElementById('windowPanel');
    const assist = document.getElementById('stage4Assist');
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
    const assistHandler = () => setPct(100);
    panel.addEventListener('pointerdown',pdown); panel.addEventListener('pointermove',pmove); panel.addEventListener('pointerup',pup); panel.addEventListener('pointercancel',pup); panel.addEventListener('keydown',key); assist.addEventListener('click', assistHandler);
    return () => { panel.removeEventListener('pointerdown',pdown); panel.removeEventListener('pointermove',pmove); panel.removeEventListener('pointerup',pup); panel.removeEventListener('pointercancel',pup); panel.removeEventListener('keydown',key); assist.removeEventListener('click', assistHandler); };
  }

  function renderStage5() {
    const starPos = [[11,12],[25,29],[42,9],[59,25],[76,10],[89,34],[18,48],[48,43],[72,52],[34,61],[62,67],[84,73]];
    els.gameFrame.innerHTML = `
      <div class="stage-scene building-stage" id="buildingStage">
        <div class="city-stars">${starPos.map((p,i)=>`<i data-i="${i}" style="left:${p[0]}%;top:${p[1]}%"></i>`).join('')}</div>
        <svg class="constellation-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 L61 38 L96 38 L68 58 L78 92 L50 72 L22 92 L32 58 L4 38 L39 38 Z"/></svg>
        <div class="final-sky-star star-shape"></div>
        <div class="scene-learning-tag stage5-tag">⭐ 사용하지 않는 공간의 불을 <b>모두 꺼주세요</b></div>
        <div class="building">
          <div class="building-sign">LIGHTS OUT · STARS ON</div>
          <div class="windows-grid">${Array.from({length:12},(_,i)=>`<button class="building-window" data-i="${i}" type="button" aria-label="${i+1}번째 불 끄기"></button>`).join('')}</div>
        </div>
        <button class="stage-assist-action" id="stage5Assist" type="button">🌙 남은 불 모두 끄기</button>
        <span class="scene-caption" style="color:#56657f">05 · ONE LAST LIGHT</span>
      </div>`;
    const scene = document.getElementById('buildingStage');
    const buttons = [...scene.querySelectorAll('.building-window')];
    const assist = document.getElementById('stage5Assist');
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
    const assistHandler = () => {
      if (stageSolved) return;
      buttons.filter(btn => !btn.classList.contains('off')).forEach((btn, i) => setTimeout(() => btn.click(), i * 70));
    };
    assist.addEventListener('click', assistHandler);
    return () => { handlers.forEach(([b,h]) => b.removeEventListener('click',h)); assist.removeEventListener('click', assistHandler); };
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
    shareAssetReady = false;
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
    if (els.privateParticipationCode) els.privateParticipationCode.textContent = getParticipationCode();
    loadPublicCount();
    showScreen(els.ending);
    // 사용자가 Instagram 인증 버튼을 누르는 즉시 시스템 공유창을 띄울 수 있도록 미리 생성합니다.
    shareAssetReady = false;
    if (els.instagram) {
      els.instagram.disabled = true;
      const small = els.instagram.querySelector('small');
      if (small) small.textContent = '인증 이미지 미리 준비 중…';
    }
    prepareShareAsset().catch(() => {
      if (els.instagram) {
        els.instagram.disabled = false;
        const small = els.instagram.querySelector('small');
        if (small) small.textContent = '인증 이미지 준비 + 게시글 문구 자동 복사';
      }
    });
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
    if (!isValidEndpoint()) {
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
      setTimeout(loadPublicCount, 900);
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
      '⭐ ENERGY STAR CHALLENGE 완료!',
      '',
      '불을 끄고 별을 켜다 🌎',
      `${CONFIG.organization} 에너지 절약 미니게임에서 5개의 별을 모두 찾았습니다.`,
      '',
      '💡 사용하지 않는 조명은 OFF',
      '🌡️ 여름철 실내 적정온도는 26℃',
      '🔌 사용하지 않는 전자기기의 대기전력 줄이기',
      '🪟 냉방 중에는 문과 창문 닫기',
      '',
      '오늘부터 일상 속 작은 에너지 절약을 실천합니다.',
      `참여코드 : ${code}`,
      '',
      CONFIG.instagramHandle,
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
    shareAssetReady = true;
    if (els.instagram) {
      els.instagram.disabled = false;
      const small = els.instagram.querySelector('small');
      if (small) small.textContent = '인증 이미지 준비 + 게시글 문구 자동 복사';
    }
    return cachedShareBlob;
  }

  function copyCaptionSynchronously(caption) {
    // Web Share는 클릭 순간의 사용자 동작 권한이 중요합니다.
    // 공유창을 열기 전에 동기 방식으로 캡션 복사를 먼저 시도합니다.
    const ta = document.createElement('textarea');
    ta.value = caption;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    ta.remove();
    if (!copied && navigator.clipboard?.writeText) {
      // 실패하더라도 공유창 호출을 막지 않도록 await 하지 않습니다.
      navigator.clipboard.writeText(caption).catch(() => {});
    }
    return copied;
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

  function buildNativeShareData() {
    const caption = buildShareCaption();
    els.shareCaption.value = caption;
    return {
      caption,
      data: {
        title: `${CONFIG.campaignName} · ENERGY STAR CHALLENGE`,
        text: caption,
        files: cachedShareFile ? [cachedShareFile] : undefined,
      },
    };
  }

  function canUseNativeFileShare() {
    if (typeof navigator.share !== 'function' || !cachedShareFile) return false;
    try {
      return !navigator.canShare || navigator.canShare({ files: [cachedShareFile] });
    } catch (_) {
      return false;
    }
  }

  async function nativeShare({ showFallback = true } = {}) {
    if (!shareAssetReady || !cachedShareFile) {
      if (showFallback) {
        els.instagram.disabled = true;
        const small = els.instagram.querySelector('small');
        if (small) small.textContent = '인증 이미지 준비 중…';
        try { await prepareShareAsset(); }
        finally {
          els.instagram.disabled = false;
          if (small) small.textContent = '인증 이미지 준비 + 게시글 문구 자동 복사';
        }
      } else return false;
    }

    const { caption, data } = buildNativeShareData();
    copyCaptionSynchronously(caption);

    if (canUseNativeFileShare()) {
      try {
        await navigator.share(data);
        showToast('인증 이미지를 공유했습니다. 게시글 문구도 복사해두었습니다.');
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
    if (!loadParticipation()?.registered) {
      showToast('경품 추첨 참여를 위해 먼저 에너지 기록을 등록해주세요.');
    }

    // 모바일에서는 한 번의 버튼으로 "캡션 복사 + 인증 이미지 전달 + 시스템 공유창"까지 진행합니다.
    const shared = await nativeShare({ showFallback: true });
    if (!shared) {
      els.shareCaption.value = buildShareCaption();
      // 브라우저/PC에서 파일 공유가 지원되지 않거나 사용자가 공유창을 닫았을 때 대체 화면 제공
      els.shareDialog.showModal();
    }
  }

  async function handleFallbackShare() {
    const shared = await nativeShare({ showFallback: true });
    if (!shared) {
      await copyCaptionToClipboard();
      downloadShareCard();
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        showToast('이미지와 문구를 준비했습니다. Instagram 앱에서 새 게시물을 만들어주세요.');
      } else {
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      }
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
    if (els.hintText.hidden) revealHint(1, false);
    else {
      els.hintText.hidden = true;
      els.hintBtn.setAttribute('aria-expanded', 'false');
    }
    playClick();
  });

  els.introHelp?.addEventListener('click', () => openHelpDialog(false));
  els.helpBtn?.addEventListener('click', () => openHelpDialog(false));
  els.helpClose?.addEventListener('click', () => els.helpDialog.close());
  els.helpDialog?.addEventListener('click', e => { if (e.target === els.helpDialog) els.helpDialog.close(); });
  els.easyControl?.addEventListener('click', () => setEasyControl(!easyControlOn));
  els.assistControl?.addEventListener('click', () => setEasyControl(!easyControlOn));
  els.showHintNow?.addEventListener('click', () => { els.helpDialog.close(); revealHint(2, true); });
  els.alternative?.addEventListener('click', () => openHelpDialog(true));
  els.pledgeChoices.forEach(btn => btn.addEventListener('click', () => completeStageByPledge(btn.dataset.pledge || '에너지 절약 실천')));
  els.privateInstagram?.addEventListener('click', () => {
    els.privateParticipationCode.textContent = getParticipationCode();
    els.privateInstagramDialog.showModal();
  });
  els.privateInstagramClose?.addEventListener('click', () => els.privateInstagramDialog.close());
  els.privateInstagramDone?.addEventListener('click', () => els.privateInstagramDialog.close());
  els.privateInstagramDialog?.addEventListener('click', e => { if (e.target === els.privateInstagramDialog) els.privateInstagramDialog.close(); });
  els.copyPrivateCode?.addEventListener('click', async () => {
    const code = getParticipationCode();
    try { await navigator.clipboard.writeText(code); showToast('참여코드를 복사했습니다.'); }
    catch (_) { showToast(`참여코드: ${code}`); }
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
  setEasyControl(easyControlOn, false);
  loadPublicCount();

  renderStageSelect();
})();
