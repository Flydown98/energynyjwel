# 불을 끄고 별을 켜다 — Instagram 인증 간소화 버전

## 바로 업로드할 파일
- `index.html`
- `styles.css`
- `game.js`
- `config.js`

GitHub Pages 저장소 최상단에 위 4개 파일을 함께 올리면 됩니다.

## Apps Script 연결
사용자가 전달한 웹 앱 URL을 `config.js`에 이미 입력했습니다.

`https://script.google.com/macros/s/AKfycbyZoopr3yz21I3YHleSzLR0Fcaf28ZBnWB65_Dwj6TM1diwROMq5azA3SAo-djtV3mEcw/exec`

따라서 기존 Apps Script 배포 주소가 유지되는 한 별도로 수정할 필요가 없습니다.

## Instagram 인증 버튼 동작
모바일에서 `Instagram에 인증하기`를 누르면:

1. 1080×1350 클리어 인증 이미지를 준비합니다.
2. 게시글 문구를 클립보드에 자동 복사합니다.
3. 휴대폰의 시스템 공유창을 엽니다.
4. 사용자가 Instagram을 선택하면 인증 이미지가 전달됩니다.
5. 기기/Instagram 버전에 따라 캡션이 자동 입력되지 않을 경우, 이미 복사된 문구를 게시글 입력칸에 붙여넣으면 됩니다.

일반 웹페이지의 보안/OS 정책상 특정 개인 Instagram 계정에 사용자의 마지막 확인 없이 강제 게시하는 방식은 사용하지 않습니다.

## 자동 생성 게시글 문구
- ENERGY STAR CHALLENGE 완료
- 남양주시장애인복지관
- 4가지 에너지 절약 실천 문구
- 참여코드
- `@nyjwel`
- 캠페인 해시태그

## PC 또는 공유 미지원 브라우저
공유 이미지 저장 + 게시글 문구 복사 대체 화면이 자동으로 열립니다.
