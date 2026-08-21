# 불을 끄고 별을 켜다 — 자유 스테이지 + 모바일/PC 공유 분리 + KIOSK

## GitHub Pages에 올릴 파일
저장소 최상단에 아래 파일을 전부 덮어씌우세요.

- `index.html` — 일반 참여자용
- `kiosk.html` — 1080×1920 키오스크용
- `admin.html` — Apps Script 관리자 페이지 이동용
- `styles.css`
- `kiosk.css`
- `game.js`
- `config.js`

현재 `config.js`에는 새 Apps Script 웹앱 URL이 입력되어 있습니다.

`https://script.google.com/macros/s/AKfycbyD2HmMGmVH601RQeLsbNGWzHT2NYzNX490So1aQo9i8dvBgCy95_v-XyXbHSPHKJtQOw/exec`

## 접속 주소 예시
GitHub Pages가 `https://flydown98.github.io/energynyjwel/`이라면:

- 일반 게임: `https://flydown98.github.io/energynyjwel/`
- 키오스크: `https://flydown98.github.io/energynyjwel/kiosk.html`
- 관리자 이동: `https://flydown98.github.io/energynyjwel/admin.html`

## 게임 진행
- 1~5번 스테이지는 처음부터 모두 선택 가능
- 원하는 순서로 플레이 가능
- 5개를 전부 완료하면 자동으로 기록/공유 화면으로 이동
- 일반 웹에서는 완료 상태와 참여코드를 브라우저에 저장
- 다시 접속해 5개가 이미 완료된 경우 첫 화면에서 기록/공유 화면으로 바로 이동 가능
- 이름과 전화번호는 브라우저 localStorage에 저장하지 않음

## Instagram 공유 방식 — 이번 수정의 핵심

### 모바일
1. `Instagram에 인증하기` 선택
2. 1080×1350 클리어 이미지 준비
3. 게시글 문구 클립보드 복사
4. 휴대폰 시스템 공유창 실행
5. 사용자가 Instagram 선택 후 실제 게시
6. 게임으로 돌아온 뒤 `Instagram 게시를 완료했어요` 선택
7. 화면에는 **게시 완료 제출 · 복지관 확인 대기**로 표시

중요: Web Share API가 성공해도 웹페이지는 실제 Instagram 게시 완료 여부를 확인할 수 없습니다. 따라서 공유창이 열렸다는 이유만으로 `인증 완료` 처리하지 않습니다.

### PC
Windows의 시스템 공유창에는 Instagram이 보장되지 않으므로 PC에서는 시스템 공유창을 띄우지 않습니다.

`Instagram에 인증하기` 선택 시:
- 게시글 문구 자동 복사
- 클리어 이미지 저장 버튼 제공
- `Instagram 웹 열기` 버튼 제공
- 실제 게시 후 `Instagram 게시를 완료했어요` 선택

### 최종 인증
이용자의 `게시를 완료했어요`는 **게시 완료 제출**일 뿐 최종 이벤트 인증이 아닙니다.
관리자는 관리자 페이지의 `인스타확인` 항목에서 게시물 또는 DM을 확인한 뒤 `확인 완료`로 처리합니다.

같은 브라우저에서는 게시 완료 제출 이후 동일 참여코드가 유지되고 새 응모가 생성되지 않도록 제한됩니다. 브라우저 저장소 삭제 또는 다른 기기까지 동일인을 완벽하게 판별하는 방식은 아닙니다.

## KIOSK 모드
`kiosk.html`은 **1080×1920 세로 키오스크**에 맞춰 별도 레이아웃을 적용합니다.

- 5개 스테이지 자유 선택
- 키오스크 localStorage에 게임 진행, 참여코드, 개인정보 저장하지 않음
- 새로고침 시 새 참여자 세션
- 한 참여자가 기록을 등록하면 입력칸 즉시 비움
- `다음 참여자 시작하기`로 즉시 초기화
- 20초 후 자동 초기화
- Instagram 공유 영역은 키오스크에서 숨김

키오스크에 저장하지 않는다는 의미이며, 참가자가 기록 등록을 누르면 이벤트 운영을 위해 이름/전화번호는 Google Sheet에는 저장됩니다.

## Apps Script 업데이트
GitHub 파일만 교체하면 끝이 아닙니다.

Apps Script 프로젝트에서:
1. `apps-script/Code.gs`로 기존 `Code.gs` 교체
2. `apps-script/Admin.html`로 기존 `Admin.html` 교체
3. **배포 → 배포 관리 → 수정 → 새 버전 → 배포**

새 Code.gs는 공유 상태를 신규 참여부터 `claimed`(게시 완료 제출)로 기록합니다. 기존 버전의 `shared` 값도 관리자 화면에서 게시 제출 상태로 호환 표시합니다.

관리자 페이지에서는:
- `게시 제출` = 이용자가 게시를 완료했다고 제출한 건수
- `인스타확인` = 복지관에서 실제 게시물/DM을 확인한 최종 상태

을 분리해서 관리합니다.

## 키오스크 권장 설정
- 해상도: 1080×1920
- 방향: 세로
- 브라우저 배율: 100%
- 전체화면/F11 권장

## 빠른 확인
### PC
1. 게임 5개 완료 + 기록 등록
2. `Instagram에 인증하기` 클릭
3. Windows 공유창이 뜨지 않는지 확인
4. 문구 자동 복사 및 대체 창 확인
5. 이미지 저장 / Instagram 웹 열기 확인
6. `Instagram 게시를 완료했어요` → `복지관 확인 대기` 확인

### 모바일
1. 게임 5개 완료 + 기록 등록
2. `Instagram에 인증하기` → 모바일 공유창 확인
3. 공유창을 닫기만 했을 때 자동으로 인증완료 처리되지 않는지 확인
4. 게시 후 `Instagram 게시를 완료했어요`를 눌러야 제출 상태가 되는지 확인

### 관리자
1. Apps Script 새 버전 배포
2. 참가자 등록 후 `게시 제출` 상태 확인
3. 실제 Instagram 게시/DM 확인 후 `인스타확인 → 확인 완료` 처리


## 2026-08-21 추가 반영
- 엔딩 화면에 **제23회 에너지의 날(8월 22일) 전국 동시 소등 21:00~21:10** 참여 안내를 추가했습니다.
- 일반 웹과 1080×1920 키오스크 모두 동일한 안내가 표시됩니다.
- Instagram 자동 복사 문구와 1080×1350 클리어 이미지에도 전국 동시 소등 참여 문구를 추가했습니다.
- `config.js`의 Apps Script URL은 현재 배포 URL `AKfycbx6t...R22ogw/exec`로 연결되어 있습니다.

### 숨겨진 연결 점검 페이지
GitHub Pages 배포 후 `/connection-test.html`로 접속하면 개인정보를 저장하지 않고 `action=count`만 호출해 Apps Script 연결 여부를 확인할 수 있습니다. 일반 참여 화면에는 이 주소를 노출하지 않습니다.


## 현재 Apps Script 웹앱 URL

```text
https://script.google.com/macros/s/AKfycbyD2HmMGmVH601RQeLsbNGWzHT2NYzNX490So1aQo9i8dvBgCy95_v-XyXbHSPHKJtQOw/exec
```

관리자 접속 주소:

```text
https://script.google.com/macros/s/AKfycbyD2HmMGmVH601RQeLsbNGWzHT2NYzNX490So1aQo9i8dvBgCy95_v-XyXbHSPHKJtQOw/exec?page=admin
```

### 관리자 로그인 관련 수정사항
- `HtmlService.XFrameOptionsMode.DENY` 제거 (Apps Script에서 지원되지 않아 오류가 발생하던 부분)
- 관리자 세션을 `CacheService`가 아닌 `Script Properties`에 만료시간과 함께 저장하도록 변경
- 관리자 작업 시 세션 유효기간이 다시 6시간으로 갱신
- Apps Script HTML 파일 이름은 **Admin.html** 로 사용하고 `Code.gs`에서도 `createHtmlOutputFromFile('Admin')`으로 호출

기존에 `setupCampaign()`을 성공적으로 실행해 `ADMIN_SALT`, `ADMIN_HASH`, `SPREADSHEET_ID`가 Script Properties에 저장되어 있다면, 이번에는 **setupCampaign()을 다시 실행할 필요가 없습니다.** `Code.gs`와 `Admin.html`을 교체한 뒤 기존 웹앱 배포를 **새 버전**으로 업데이트하세요.
