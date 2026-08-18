# 불을 끄고 별을 켜다 · 관리자 페이지 포함 최종본

남양주시장애인복지관 에너지 절약 캠페인용 5스테이지 웹게임입니다. 기존 Google Sheets / Apps Script 저장방식을 제거하고, **별도 관리자 전용 페이지(`admin.html`)**에서 참여정보를 직접 관리하도록 변경했습니다.

## 이번 버전의 구조

```text
lights-out-stars-on-admin-final/
├─ index.html              # 참여자용 게임
├─ game.js
├─ styles.css
├─ config.js               # 기관명 + Supabase 연결값
├─ admin.html              # 관리자 전용 페이지
├─ admin.js
├─ admin.css
├─ supabase-setup.sql      # DB / 보안정책 1회 설정
└─ README.md
```

## 관리자 페이지에서 가능한 것

- 관리자 이메일/비밀번호 로그인
- 등록자 전체 조회
- 이름 / 전화번호 / 참여코드 검색
- 인스타그램 게시물 `확인 전 / 확인 완료 / 확인 불가` 관리
- 경품 `미선정 / 당첨 / 연락 완료 / 지급 완료` 관리
- 참가자별 관리 메모
- 개별 개인정보 삭제
- 검색/필터 결과 CSV 다운로드
- 이벤트 종료 후 전체 개인정보 일괄 삭제
- 총 등록 / 인스타 확인 / 당첨 / 오늘 등록 통계

관리자 주소는 GitHub Pages 배포 후 아래와 같습니다.

```text
https://아이디.github.io/저장소명/admin.html
```

`admin.html` 주소를 숨기는 것만으로 보호하는 구조가 아닙니다. 실제 이름/전화번호 조회 권한은 Supabase 로그인 + RLS 정책으로 제한됩니다.

---

# 1. 왜 Supabase 설정이 필요한가요?

GitHub Pages는 정적 웹 호스팅이라 여러 참가자의 이름/전화번호를 한곳에 영구 저장할 데이터베이스가 없습니다. 따라서 **Google Sheet는 전혀 사용하지 않고**, Supabase DB를 저장소로만 사용합니다.

참여자는 게임 화면만 보고, 운영자는 `admin.html`만 사용하면 됩니다. 실제 행사 운영 중 Supabase Dashboard를 계속 열어둘 필요는 없습니다.

---

# 2. Supabase 프로젝트 만들기

1. Supabase에서 새 프로젝트를 하나 만듭니다.
2. 프로젝트가 생성되면 `SQL Editor`를 엽니다.
3. 이 폴더의 `supabase-setup.sql` 전체 내용을 붙여넣고 실행합니다.

이 SQL은 다음 보안을 같이 설정합니다.

- 일반 참가자: 자기 정보를 **등록(INSERT)만 가능**
- 일반 참가자: 다른 사람의 이름/전화번호 **조회 불가**
- 관리자: 별도로 등록된 관리자 계정만 조회/수정/삭제 가능
- RLS(Row Level Security) 활성화

---

# 3. 관리자 계정 1개 만들기

Supabase Dashboard에서:

1. `Authentication → Users`
2. 관리자용 이메일/비밀번호 계정을 직접 만듭니다.
3. 다시 `SQL Editor`로 갑니다.
4. 아래 SQL의 이메일만 실제 관리자 이메일로 바꿔 실행합니다.

```sql
insert into public.campaign_admins (user_id)
select id from auth.users where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

이 단계까지 해야 해당 계정으로 `admin.html`에 로그인할 수 있습니다.

여러 명에게 관리자 권한을 주고 싶으면 사용자 계정을 추가로 만든 뒤 같은 SQL을 이메일만 바꿔 다시 실행하면 됩니다.

---

# 4. config.js에 연결값 넣기

Supabase Dashboard의 프로젝트 설정에서 아래 두 값을 확인합니다.

- Project URL
- Publishable key

`config.js`를 열고 아래 두 줄만 바꿉니다.

```js
supabaseUrl: 'https://xxxxxxxx.supabase.co',
supabasePublishableKey: 'sb_publishable_...',
```

**Secret key / service_role key는 절대로 config.js에 넣지 마세요.**

GitHub Pages처럼 브라우저에서 동작하는 앱에는 Publishable key를 사용하고, 실제 접근 제어는 `supabase-setup.sql`에 포함된 RLS 정책이 담당합니다.

---

# 5. GitHub Pages에 업로드

이 폴더 안의 파일들을 모두 GitHub 저장소 최상단에 업로드합니다.

GitHub에서:

1. `Settings`
2. `Pages`
3. `Build and deployment → Deploy from a branch`
4. Branch: `main`
5. Folder: `/(root)`
6. Save

참여자용:

```text
https://아이디.github.io/저장소명/
```

관리자용:

```text
https://아이디.github.io/저장소명/admin.html
```

공개 게임 화면에는 관리자 페이지 링크를 넣지 않았습니다.

---

# 6. 실제 이벤트 운영 흐름

1. 참여자가 5개 스테이지를 클리어합니다.
2. 마지막 화면에서 이름/전화번호 + 개인정보 동의를 입력합니다.
3. `나의 에너지 기록 등록하기`를 누릅니다.
4. `STAR-XXXXXX` 참여코드가 등록됩니다.
5. `인스타그램에 공유하기`로 클리어 이미지를 게시합니다.
6. 운영자가 Instagram에서 캠페인 게시물을 확인합니다.
7. 게시물 이미지의 참여코드를 `admin.html` 검색창에 입력합니다.
8. 해당 등록자의 `인스타 확인`을 `확인 완료`로 변경합니다.
9. 추첨 후 `경품 상태`를 `당첨 → 연락 완료 → 지급 완료` 순서로 관리할 수 있습니다.

---

# 7. 개인정보 삭제

관리자 페이지 하단의 `전체 참여정보 삭제` 버튼은 이름과 전화번호를 포함한 이벤트 등록정보를 전부 삭제합니다.

실행 시 `전체삭제`라고 다시 입력해야 실제 삭제됩니다.

게임 화면에 표시한 보유기간(현재 기본 문구: `경품 지급 및 이의처리 완료 후 지체 없이 파기(최대 30일)`)과 실제 삭제시점을 일치시켜 운영해주세요.

---

# 8. Instagram 공유 기능

5/5 클리어 후 자동 생성되는 이미지에는 개인정보가 들어가지 않고 다음 정보만 표시됩니다.

- 남양주시장애인복지관
- 불을 끄고 별을 켜다
- 5 / 5 STARS FOUND
- 참여코드 `STAR-XXXXXX`

기본 해시태그:

```text
#남양주시장애인복지관 #불을끄고별을켜다 #에너지의날 #에너지절약 #에너지절약캠페인
```

Instagram 게시 자체는 기기의 공유 메뉴를 통해 사용자가 최종 선택하는 방식입니다.

---

# 9. 캠페인명 / 기관명 / 해시태그 변경

`config.js`만 수정하면 됩니다.

```js
organization: '남양주시장애인복지관',
campaignName: '불을 끄고 별을 켜다',
shareHashtags: [ ... ]
```

---

# 10. 테스트 팁

- 게임 진행 초기화: 게임 우측 상단 `↻`
- 새 참가자 테스트: 엔딩 화면의 `처음부터 다시 플레이`
- 관리자 페이지: `admin.html`
- 관리자 로그인이 되지만 대시보드가 열리지 않는 경우: `campaign_admins` 등록 SQL을 확인
- 참여자 등록이 안 되는 경우: `config.js`의 Project URL / Publishable key 확인
