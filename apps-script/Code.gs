/**
 * 남양주시장애인복지관 「불을 끄고 별을 켜다」
 * Google Sheets + Apps Script 참여자 저장 / 관리자 페이지 백엔드
 *
 * 최초 1회:
 * 1) 이 스크립트를 참여자 저장용 Google 스프레드시트에 '바인드된 스크립트'로 만듭니다.
 * 2) 아래 SETUP_ADMIN_PASSWORD를 충분히 긴 관리자 비밀번호로 바꿉니다.
 * 3) Apps Script 편집기에서 setupCampaign()을 직접 1회 실행합니다.
 * 4) Admin.html 파일도 같은 Apps Script 프로젝트에 추가합니다.
 * 5) 웹 앱으로 배포: 실행 사용자 '나', 액세스 권한 '모든 사용자'.
 * 6) /exec URL을 GitHub의 config.js appsScriptUrl에 입력합니다.
 *
 * 개인정보는 경품 추첨/연락 목적에 필요한 기간 동안만 보유하고,
 * 운영 종료 후 관리자 페이지의 전체 삭제 기능 또는 purgeCampaignDataFromEditor_()로 파기하세요.
 */

const SHEET_NAME = '참여자';

// ★ 반드시 변경한 뒤 setupCampaign()을 실행하세요.
// 비밀번호는 GitHub에는 올라가지 않고 Apps Script 프로젝트 안에만 존재합니다.
const SETUP_ADMIN_PASSWORD = 'CHANGE-ME-STRONG-PASSWORD';

const SESSION_SECONDS = 60 * 60 * 6; // 관리자 로그인 6시간

const HEADERS = [
  'ID', '서버등록일시', '참여코드', '참여자구분', '이름', '전화번호',
  '개인정보동의', '별개수', '캠페인', '클라이언트일시',
  '인스타확인', '경품상태', '관리메모', '최종수정일시'
];

const COL = {
  id: 1, createdAt: 2, code: 3, participantType: 4, name: 5, phone: 6,
  consent: 7, stars: 8, campaign: 9, clientTimestamp: 10,
  instagramStatus: 11, prizeStatus: 12, adminNote: 13, updatedAt: 14
};

/** Apps Script 편집기에서 최초 1회 직접 실행 */
function setupCampaign() {
  if (!SETUP_ADMIN_PASSWORD || SETUP_ADMIN_PASSWORD === 'CHANGE-ME-STRONG-PASSWORD' || SETUP_ADMIN_PASSWORD.length < 10) {
    throw new Error('Code.gs 상단의 SETUP_ADMIN_PASSWORD를 10자 이상의 강한 비밀번호로 변경한 뒤 다시 실행하세요.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('참여자 저장용 Google 스프레드시트에서 확장 프로그램 → Apps Script로 연 바인드 스크립트에서 실행하세요.');

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  setAdminPassword_(SETUP_ADMIN_PASSWORD);
  getOrCreateSheet_(ss);
  SpreadsheetApp.flush();
  return '설정 완료. 이제 웹 앱으로 배포하세요.';
}

/** 웹 앱 GET: 관리자 페이지 또는 상태 확인 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const page = String(params.page || '').toLowerCase();
  const action = String(params.action || '').toLowerCase();
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('캠페인 관리자 · 불을 끄고 별을 켜다')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (action === 'count') {
    const payload = { ok: true, count: getPublicParticipantCount_() };
    const callback = String(params.callback || '');
    if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return json_(payload);
  }
  return json_({ ok: true, service: 'lights-out-stars-on', admin: '?page=admin' });
}

/** GitHub Pages 게임에서 참가자 등록 */
function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'submit');
    if (action !== 'submit') return json_({ ok: false, error: 'unsupported_action' });

    // 단순 자동입력 봇 차단용 honeypot
    if (String(p.website || '').trim()) return json_({ ok: false, error: 'blocked' });

    const code = String(p.code || '').trim().toUpperCase();
    const name = text_(p.name, 30);
    const phone = String(p.phone || '').replace(/\D/g, '');
    const participantType = p.participantType === 'guardian' ? '만14세미만-법정대리인' : '만14세이상';
    const consent = String(p.consent || '').toLowerCase();
    const stars = Number(p.stars || 0);
    const campaign = text_(p.campaign || '불을 끄고 별을 켜다', 80);
    const clientTimestamp = text_(p.clientTimestamp || '', 60);

    if (!/^STAR-[A-HJ-NP-Z2-9]{6}$/.test(code)) return json_({ ok: false, error: 'invalid_code' });
    if (name.replace(/^'/, '').length < 2) return json_({ ok: false, error: 'invalid_name' });
    if (phone.length < 9 || phone.length > 11) return json_({ ok: false, error: 'invalid_phone' });
    if (consent !== 'yes') return json_({ ok: false, error: 'consent_required' });
    if (stars !== 5) return json_({ ok: false, error: 'not_cleared' });

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = getSpreadsheet_();
      const sheet = getOrCreateSheet_(ss);
      const now = new Date();
      const targetRow = findRowByCode_(sheet, code);

      if (targetRow) {
        // 동일 참여코드는 개인정보 입력 내용만 갱신하고, 운영자가 체크한 상태/메모는 유지합니다.
        sheet.getRange(targetRow, COL.participantType).setValue(participantType);
        sheet.getRange(targetRow, COL.name).setValue(name);
        sheet.getRange(targetRow, COL.phone).setValue(phone).setNumberFormat('@');
        sheet.getRange(targetRow, COL.consent).setValue('동의');
        sheet.getRange(targetRow, COL.stars).setValue(5);
        sheet.getRange(targetRow, COL.campaign).setValue(campaign);
        sheet.getRange(targetRow, COL.clientTimestamp).setValue(clientTimestamp);
        sheet.getRange(targetRow, COL.updatedAt).setValue(now);
      } else {
        sheet.appendRow([
          Utilities.getUuid(), now, code, participantType, name, phone,
          '동의', 5, campaign, clientTimestamp,
          'unchecked', 'none', '', now
        ]);
        const r = sheet.getLastRow();
        sheet.getRange(r, COL.code).setNumberFormat('@');
        sheet.getRange(r, COL.phone).setNumberFormat('@');
        sheet.getRange(r, COL.adminNote).setNumberFormat('@');
      }
      SpreadsheetApp.flush();
      CacheService.getScriptCache().remove('public-count');
      return json_({ ok: true, code: code, updated: Boolean(targetRow) });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  }
}

// =========================
// 관리자 페이지용 서버 함수
// =========================

function adminLogin(password) {
  const raw = String(password || '');
  if (!verifyAdminPassword_(raw)) {
    Utilities.sleep(450); // 무차별 대입 완화용 작은 지연
    return { ok: false, message: '비밀번호를 확인해주세요.' };
  }
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('admin:' + token, '1', SESSION_SECONDS);
  return {
    ok: true,
    token: token,
    expiresIn: SESSION_SECONDS,
    sheetUrl: getSpreadsheet_().getUrl()
  };
}

function adminSession(token) {
  if (!isAdminToken_(token)) return { ok: false };
  refreshAdminToken_(token);
  return { ok: true, sheetUrl: getSpreadsheet_().getUrl() };
}

function adminLogout(token) {
  if (token) CacheService.getScriptCache().remove('admin:' + String(token));
  return { ok: true };
}

function adminGetEntries(token) {
  requireAdmin_(token);
  refreshAdminToken_(token);
  const sheet = getOrCreateSheet_(getSpreadsheet_());
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.reverse().map(rowToObject_);
}

function adminUpdateEntry(token, id, field, value) {
  requireAdmin_(token);
  refreshAdminToken_(token);
  const allowed = {
    instagram_status: { col: COL.instagramStatus, values: ['unchecked', 'verified', 'verified_dm', 'invalid'] },
    prize_status: { col: COL.prizeStatus, values: ['none', 'winner', 'contacted', 'sent'] },
    admin_note: { col: COL.adminNote, max: 300 }
  };
  const rule = allowed[field];
  if (!rule) throw new Error('허용되지 않은 필드입니다.');

  let v = String(value == null ? '' : value);
  if (rule.values && !rule.values.includes(v)) throw new Error('허용되지 않은 값입니다.');
  if (rule.max) v = text_(v, rule.max);

  const sheet = getOrCreateSheet_(getSpreadsheet_());
  const row = findRowById_(sheet, String(id || ''));
  if (!row) throw new Error('참여자를 찾을 수 없습니다.');

  sheet.getRange(row, rule.col).setValue(v);
  if (field === 'admin_note') sheet.getRange(row, rule.col).setNumberFormat('@');
  sheet.getRange(row, COL.updatedAt).setValue(new Date());
  SpreadsheetApp.flush();
  return { ok: true };
}

function adminDeleteEntry(token, id) {
  requireAdmin_(token);
  refreshAdminToken_(token);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getOrCreateSheet_(getSpreadsheet_());
    const row = findRowById_(sheet, String(id || ''));
    if (!row) throw new Error('참여자를 찾을 수 없습니다.');
    sheet.deleteRow(row);
    CacheService.getScriptCache().remove('public-count');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function adminPurgeAll(token, confirmation) {
  requireAdmin_(token);
  refreshAdminToken_(token);
  if (String(confirmation || '') !== '전체삭제') throw new Error('확인 문구가 일치하지 않습니다.');
  const sheet = getOrCreateSheet_(getSpreadsheet_());
  const n = Math.max(0, sheet.getLastRow() - 1);
  if (n) sheet.deleteRows(2, n);
  CacheService.getScriptCache().remove('public-count');
  return { ok: true, deleted: n };
}

// =========================
// 내부 유틸리티
// =========================

function getPublicParticipantCount_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('public-count');
  if (cached !== null) return Number(cached) || 0;
  const sheet = getOrCreateSheet_(getSpreadsheet_());
  const count = Math.max(0, sheet.getLastRow() - 1);
  cache.put('public-count', String(count), 30);
  return count;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('스프레드시트 연결이 없습니다. setupCampaign()을 먼저 실행하세요.');
}

function getOrCreateSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0d2144')
      .setFontColor('#ffffff');
    sheet.getRange('C:C').setNumberFormat('@');
    sheet.getRange('F:F').setNumberFormat('@');
    sheet.getRange('M:M').setNumberFormat('@');
    sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange('N:N').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);
    sheet.setColumnWidth(COL.adminNote, 260);
  }
  return sheet;
}

function findRowByCode_(sheet, code) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const finder = sheet.getRange(2, COL.code, lastRow - 1, 1)
    .createTextFinder(code).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : 0;
}

function findRowById_(sheet, id) {
  if (!id) return 0;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const finder = sheet.getRange(2, COL.id, lastRow - 1, 1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : 0;
}

function rowToObject_(r) {
  return {
    id: String(r[COL.id - 1] || ''),
    created_at: dateIso_(r[COL.createdAt - 1]),
    participation_code: String(r[COL.code - 1] || ''),
    participant_type: String(r[COL.participantType - 1] || '') === '만14세미만-법정대리인' ? 'guardian' : 'adult',
    name: unquote_(r[COL.name - 1]),
    phone: String(r[COL.phone - 1] || ''),
    privacy_consent: String(r[COL.consent - 1] || '') === '동의',
    stars: Number(r[COL.stars - 1] || 0),
    campaign: unquote_(r[COL.campaign - 1]),
    client_created_at: String(r[COL.clientTimestamp - 1] || ''),
    instagram_status: String(r[COL.instagramStatus - 1] || 'unchecked'),
    prize_status: String(r[COL.prizeStatus - 1] || 'none'),
    admin_note: unquote_(r[COL.adminNote - 1]),
    updated_at: dateIso_(r[COL.updatedAt - 1])
  };
}

function dateIso_(value) {
  if (value instanceof Date && !isNaN(value)) return value.toISOString();
  return String(value || '');
}

function text_(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen || 500);
  // 수식 삽입 방지. 스프레드시트에서는 선행 apostrophe가 화면에 표시되지 않습니다.
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function unquote_(value) {
  const s = String(value == null ? '' : value);
  return s.startsWith("'") ? s.slice(1) : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function setAdminPassword_(password) {
  const salt = Utilities.getUuid();
  const hash = sha256_(salt + String(password));
  PropertiesService.getScriptProperties().setProperties({
    ADMIN_SALT: salt,
    ADMIN_HASH: hash
  }, false);
}

function verifyAdminPassword_(password) {
  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty('ADMIN_SALT');
  const expected = props.getProperty('ADMIN_HASH');
  if (!salt || !expected) return false;
  return sha256_(salt + String(password)) === expected;
}

function sha256_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { const v = b < 0 ? b + 256 : b; return ('0' + v.toString(16)).slice(-2); }).join('');
}

function isAdminToken_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('admin:' + String(token)) === '1';
}

function requireAdmin_(token) {
  if (!isAdminToken_(token)) throw new Error('관리자 세션이 만료되었습니다. 다시 로그인해주세요.');
}

function refreshAdminToken_(token) {
  CacheService.getScriptCache().put('admin:' + String(token), '1', SESSION_SECONDS);
}

/**
 * 비밀번호를 바꾸고 싶을 때 Apps Script 편집기에서만 사용:
 * 1) 아래 새 비밀번호를 직접 수정
 * 2) 이 함수를 편집기에서 실행
 * 함수명이 _로 끝나므로 관리자 웹페이지의 google.script.run에서는 호출할 수 없습니다.
 */
function resetAdminPasswordFromEditor_() {
  const NEW_PASSWORD = 'CHANGE-THIS-BEFORE-RUNNING';
  if (NEW_PASSWORD === 'CHANGE-THIS-BEFORE-RUNNING' || NEW_PASSWORD.length < 10) {
    throw new Error('함수 안의 NEW_PASSWORD를 10자 이상으로 바꾼 뒤 실행하세요.');
  }
  setAdminPassword_(NEW_PASSWORD);
}

/** 이벤트 종료 후 Apps Script 편집기에서 직접 실행할 수 있는 전체 파기 보조 함수 */
function purgeCampaignDataFromEditor_() {
  const sheet = getOrCreateSheet_(getSpreadsheet_());
  const n = Math.max(0, sheet.getLastRow() - 1);
  if (n) sheet.deleteRows(2, n);
}
