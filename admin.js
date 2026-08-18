(() => {
  'use strict';

  const APP = window.CAMPAIGN_APP_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/.test(APP.supabaseUrl || '')
    && APP.supabasePublishableKey
    && !String(APP.supabasePublishableKey).includes('YOUR_')
    && Boolean(window.supabase?.createClient);

  const els = {
    setup: document.getElementById('setupPanel'), login: document.getElementById('loginPanel'), dashboard: document.getElementById('dashboardPanel'),
    loginForm: document.getElementById('loginForm'), email: document.getElementById('adminEmail'), password: document.getElementById('adminPassword'), loginBtn: document.getElementById('loginBtn'), loginStatus: document.getElementById('loginStatus'),
    logout: document.getElementById('logoutBtn'), identity: document.getElementById('adminIdentity'), refresh: document.getElementById('refreshBtn'), exportBtn: document.getElementById('exportBtn'), purge: document.getElementById('purgeBtn'),
    search: document.getElementById('searchInput'), instaFilter: document.getElementById('instagramFilter'), prizeFilter: document.getElementById('prizeFilter'), rows: document.getElementById('entryRows'), empty: document.getElementById('emptyState'), visibleCount: document.getElementById('visibleCount'),
    total: document.getElementById('statTotal'), verified: document.getElementById('statVerified'), winner: document.getElementById('statWinner'), today: document.getElementById('statToday'), toast: document.getElementById('toast')
  };

  let db = null;
  let entries = [];
  let toastTimer = null;

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function setView(name) {
    els.setup.hidden = name !== 'setup';
    els.login.hidden = name !== 'login';
    els.dashboard.hidden = name !== 'dashboard';
    els.logout.hidden = name !== 'dashboard';
  }

  function formatPhone(value) {
    const d = String(value || '').replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    return d;
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try { return new Intl.DateTimeFormat('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(iso)); }
    catch (_) { return iso; }
  }

  function isToday(iso) {
    const d = new Date(iso); const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  async function isAdmin() {
    const { data, error } = await db.rpc('is_campaign_admin');
    if (error) return false;
    return data === true;
  }

  async function loadEntries() {
    els.refresh.disabled = true;
    const { data, error } = await db.from('campaign_entries').select('*').order('created_at', { ascending: false }).limit(3000);
    els.refresh.disabled = false;
    if (error) { console.error(error); showToast('참여자 정보를 불러오지 못했습니다.'); return; }
    entries = data || [];
    renderStats();
    renderRows();
  }

  function renderStats() {
    els.total.textContent = entries.length.toLocaleString('ko-KR');
    els.verified.textContent = entries.filter(x => x.instagram_status === 'verified').length.toLocaleString('ko-KR');
    els.winner.textContent = entries.filter(x => ['winner','contacted','sent'].includes(x.prize_status)).length.toLocaleString('ko-KR');
    els.today.textContent = entries.filter(x => isToday(x.created_at)).length.toLocaleString('ko-KR');
  }

  function filteredEntries() {
    const q = els.search.value.trim().toLowerCase().replace(/-/g,'');
    const insta = els.instaFilter.value; const prize = els.prizeFilter.value;
    return entries.filter(x => {
      const hay = `${x.participation_code} ${x.name} ${x.phone}`.toLowerCase().replace(/-/g,'');
      return (!q || hay.includes(q)) && (insta === 'all' || x.instagram_status === insta) && (prize === 'all' || x.prize_status === prize);
    });
  }

  function renderRows() {
    const list = filteredEntries();
    els.visibleCount.textContent = list.length.toLocaleString('ko-KR');
    els.empty.hidden = list.length !== 0;
    els.rows.innerHTML = list.map(x => `
      <tr data-id="${x.id}">
        <td class="date-cell">${escapeHtml(formatDate(x.created_at))}</td>
        <td class="code-cell" title="클릭해서 복사"><button class="mini-btn copy-code" data-code="${escapeHtml(x.participation_code)}">${escapeHtml(x.participation_code)}</button></td>
        <td><strong>${escapeHtml(x.name)}</strong></td>
        <td class="phone-cell">${escapeHtml(formatPhone(x.phone))}</td>
        <td><span class="type-badge">${x.participant_type === 'guardian' ? '법정대리인' : '만 14세 이상'}</span></td>
        <td><select class="row-select insta-status" data-id="${x.id}"><option value="unchecked" ${x.instagram_status==='unchecked'?'selected':''}>확인 전</option><option value="verified" ${x.instagram_status==='verified'?'selected':''}>확인 완료</option><option value="invalid" ${x.instagram_status==='invalid'?'selected':''}>확인 불가</option></select></td>
        <td><select class="row-select prize-status" data-id="${x.id}"><option value="none" ${x.prize_status==='none'?'selected':''}>미선정</option><option value="winner" ${x.prize_status==='winner'?'selected':''}>당첨</option><option value="contacted" ${x.prize_status==='contacted'?'selected':''}>연락 완료</option><option value="sent" ${x.prize_status==='sent'?'selected':''}>지급 완료</option></select></td>
        <td><textarea class="row-note" data-id="${x.id}" rows="1" maxlength="300" placeholder="메모">${escapeHtml(x.admin_note || '')}</textarea></td>
        <td><div class="row-actions"><button class="mini-btn save-note" data-id="${x.id}">메모저장</button><button class="mini-btn delete delete-row" data-id="${x.id}">삭제</button></div></td>
      </tr>`).join('');
  }

  async function updateEntry(id, values, successText) {
    const { error } = await db.from('campaign_entries').update(values).eq('id', id);
    if (error) { console.error(error); showToast('저장하지 못했습니다.'); await loadEntries(); return false; }
    const idx = entries.findIndex(x => x.id === id); if (idx >= 0) entries[idx] = { ...entries[idx], ...values };
    renderStats();
    if (successText) showToast(successText);
    return true;
  }

  async function deleteEntry(id) {
    const row = entries.find(x => x.id === id); if (!row) return;
    if (!confirm(`${row.name} (${row.participation_code}) 참여정보를 삭제할까요?\n삭제 후 복구할 수 없습니다.`)) return;
    const { error } = await db.from('campaign_entries').delete().eq('id', id);
    if (error) { console.error(error); showToast('삭제하지 못했습니다.'); return; }
    entries = entries.filter(x => x.id !== id); renderStats(); renderRows(); showToast('삭제했습니다.');
  }

  function csvEscape(value) { const v = String(value ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v; }
  function exportCsv() {
    const list = filteredEntries();
    const header = ['등록일시','참여코드','구분','이름','전화번호','인스타확인','경품상태','관리메모'];
    const instaMap={unchecked:'확인 전',verified:'확인 완료',invalid:'확인 불가'}; const prizeMap={none:'미선정',winner:'당첨',contacted:'연락 완료',sent:'지급 완료'};
    const lines = [header, ...list.map(x => [x.created_at,x.participation_code,x.participant_type==='guardian'?'법정대리인':'만 14세 이상',x.name,formatPhone(x.phone),instaMap[x.instagram_status],prizeMap[x.prize_status],x.admin_note])].map(row=>row.map(csvEscape).join(','));
    const blob = new Blob(['\ufeff'+lines.join('\r\n')], {type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`energy-campaign-${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); showToast(`${list.length}건을 CSV로 내보냈습니다.`);
  }

  async function purgeAll() {
    if (!entries.length) { showToast('삭제할 참여정보가 없습니다.'); return; }
    const typed = prompt(`현재 ${entries.length}건의 이름·전화번호를 전부 삭제합니다.\n계속하려면 정확히 "전체삭제"라고 입력해주세요.`);
    if (typed !== '전체삭제') return;
    const { error } = await db.from('campaign_entries').delete().not('id', 'is', null);
    if (error) { console.error(error); showToast('전체 삭제에 실패했습니다.'); return; }
    entries=[]; renderStats(); renderRows(); showToast('전체 참여정보를 삭제했습니다.');
  }

  async function enterDashboard(session) {
    const allowed = await isAdmin();
    if (!allowed) {
      await db.auth.signOut();
      els.loginStatus.textContent = '로그인은 되었지만 캠페인 관리자 권한이 없습니다. supabase-setup.sql의 관리자 등록 단계를 확인해주세요.';
      setView('login');
      return;
    }
    els.identity.textContent = session?.user?.email || '관리자';
    els.loginStatus.textContent='';
    setView('dashboard');
    await loadEntries();
  }

  async function init() {
    if (!configured) { setView('setup'); return; }
    db = window.supabase.createClient(APP.supabaseUrl, APP.supabasePublishableKey, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    const { data: { session } } = await db.auth.getSession();
    if (session) await enterDashboard(session); else setView('login');
  }

  els.loginForm.addEventListener('submit', async e => {
    e.preventDefault(); els.loginBtn.disabled=true; els.loginStatus.textContent='로그인 확인 중…';
    const { data, error } = await db.auth.signInWithPassword({ email: els.email.value.trim(), password: els.password.value });
    els.loginBtn.disabled=false;
    if (error) { console.error(error); els.loginStatus.textContent='이메일 또는 비밀번호를 확인해주세요.'; return; }
    els.password.value=''; await enterDashboard(data.session);
  });
  els.logout.addEventListener('click', async()=>{ await db.auth.signOut(); entries=[]; els.identity.textContent=''; setView('login'); });
  els.refresh.addEventListener('click', loadEntries);
  els.exportBtn.addEventListener('click', exportCsv);
  els.purge.addEventListener('click', purgeAll);
  [els.search,els.instaFilter,els.prizeFilter].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',renderRows));
  els.rows.addEventListener('click', async e => {
    const copy=e.target.closest('.copy-code'); if(copy){ await navigator.clipboard?.writeText(copy.dataset.code).catch(()=>{}); showToast('참여코드를 복사했습니다.'); return; }
    const save=e.target.closest('.save-note'); if(save){ const note=els.rows.querySelector(`.row-note[data-id="${save.dataset.id}"]`); await updateEntry(save.dataset.id,{admin_note:note.value.trim()},'메모를 저장했습니다.'); return; }
    const del=e.target.closest('.delete-row'); if(del) await deleteEntry(del.dataset.id);
  });
  els.rows.addEventListener('change', async e => {
    if(e.target.matches('.insta-status')) await updateEntry(e.target.dataset.id,{instagram_status:e.target.value},'인스타 확인 상태를 저장했습니다.');
    if(e.target.matches('.prize-status')) await updateEntry(e.target.dataset.id,{prize_status:e.target.value},'경품 상태를 저장했습니다.');
  });

  init().catch(err=>{ console.error(err); setView('login'); els.loginStatus.textContent='관리자 페이지를 초기화하지 못했습니다.'; });
})();
