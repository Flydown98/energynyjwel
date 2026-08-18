# 불을 끄고 별을 켜다 — 5 STAGE WEB GAME

에너지 절약 캠페인을 위한 짧은 웹 퍼즐 게임입니다. 별도 설치나 서버 없이 GitHub Pages에서 바로 실행됩니다.

## 구성

1. **SWITCH** — 방의 불을 끄면 창밖의 별이 나타납니다.
2. **26°** — 냉방 온도를 26℃로 맞춥니다.
3. **STANDBY** — 퇴근 후 남아 있는 대기전력 표시등을 모두 끕니다.
4. **WINDOW** — 에어컨 바람이 새지 않도록 창문을 드래그해 닫습니다.
5. **LIGHTS OUT** — 복지관 건물에 남아 있는 불을 모두 꺼 밤하늘의 별을 완성합니다.

## 실행

`index.html`을 더블클릭해도 실행되며, 가장 안정적으로 확인하려면 간단한 로컬 서버를 사용하세요.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속.

## GitHub Pages 올리는 법

1. GitHub에서 새 저장소(Repository)를 만듭니다.
2. 이 폴더 안의 `index.html`, `styles.css`, `game.js`를 저장소 최상단에 업로드합니다.
3. 저장소의 **Settings → Pages**로 이동합니다.
4. **Build and deployment**에서 `Deploy from a branch`를 선택합니다.
5. Branch를 `main`, Folder를 `/ (root)`로 선택하고 저장합니다.
6. 잠시 기다리면 `https://계정명.github.io/저장소명/` 주소로 게임이 공개됩니다.

## 기관명 수정

`game.js` 상단의 아래 부분만 바꾸면 됩니다.

```js
const CONFIG = {
  organization: '남양주시장애인복지관',
  ...
};
```

## 특징

- 모바일/PC 반응형
- 마우스/터치 지원
- 5개 스테이지 순차 해금
- 진행상황 브라우저 저장(localStorage)
- 힌트 버튼
- 간단한 Web Audio 효과음 및 음소거
- 외부 이미지/폰트/라이브러리 없음
- GitHub Pages 정적 호스팅 가능

## 저작권/디자인 메모

Hoshi Saga의 “매 스테이지에서 별을 찾는 짧은 발견형 퍼즐”이라는 장르적 아이디어에서 영감을 받았지만, 그래픽·퍼즐·코드·문구는 캠페인용으로 새로 구성했습니다. 원작 자산은 포함하지 않았습니다.
