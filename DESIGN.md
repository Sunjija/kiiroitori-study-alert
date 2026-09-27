---
name: "키이로이토리 · 공부 알리미"
description: "도서관·카페 캐릭터와 함께 현재 행동과 하루 시간표를 확인하는 한국어 HTML 앱"
colors:
  paper: "#fffdf4"
  surface: "#fff9e4"
  yellow: "#fbe596"
  ink: "#463724"
  muted: "#736348"
  line: "#decfaa"
  focus: "#8b5e23"
  danger: "#9b352d"
typography:
  display:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.025em"
  title:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-.025em"
  body:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "14px"
    fontWeight: 400
  countdown:
    fontFamily: "Pretendard, '맑은 고딕', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.02em"
rounded:
  control: "8px"
  toast: "10px"
  table: "12px"
  panel: "16px"
spacing:
  control-gap: "8px"
  field-gap: "12px"
  paired-field-gap: "14px"
  editor-gap: "24px"
  hero-gap: "28px"
  desktop-gutter: "32px"
  tablet-gutter: "20px"
  mobile-gutter: "12px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  button-navigation:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  field:
    backgroundColor: "#fffefa"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "9px 10px"
  choice-selected:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
  current-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px 28px"
  timetable:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.table}"
    width: "100%"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "26px"
    width: "min(520px, calc(100vw - 28px))"
---

# Design System: 키이로이토리 · 공부 알리미

## Overview

**Creative North Star: "도서관·카페의 공부 동행"**

따뜻한 크림 바탕에 노란 선택 상태와 갈색 글자를 사용한다. 제공된 도서관·카페의 공부·휴식·마감 이미지 여섯 장이 화면의 캐릭터 표현을 맡는다. 기본 글꼴은 프리텐다드이며 사용자가 박다현체를 선택할 수 있다.

현재 행동과 남은 시간은 큰 안내 영역에, 하루 일정은 촘촘한 표에 배치한다. 이 문서는 완성된 `style.css`, `index.html`, `app.js`와 실제 브라우저 화면의 구현 기록이다.

**Key Characteristics:**

- 크림 면, 노란 강조, 갈색 문자와 가는 경계선.
- 현재 행동·카운트다운·상태별 캐릭터를 함께 표시.
- 작은 창에서도 시작·종료 시각과 하루 일정을 우선.
- 상세·편집·꾸미기·알림은 네이티브 대화상자.

## Colors

색 값은 frontmatter의 토큰을 기준으로 한다.

### Primary

- **따뜻한 노랑 — yellow:** 주요 행동, 선택된 콘셉트·미리보기 상태, 편집 중인 일정, 텍스트 선택.
- 진행 중인 표 행은 별도의 연한 노랑 면으로 표시하고 상태 칸에 ‘진행’을 함께 쓴다.

### Neutral

- **크림 종이 — paper:** 페이지와 대화상자 바탕.
- **연한 크림 면 — surface:** 현재 안내, 표 머리글, 캐릭터 미리보기.
- **짙은 갈색 — ink:** 제목·본문·카운트다운.
- **부드러운 갈색 — muted:** 시각·보조 설명·캡션.
- **종이 경계 — line:** 표와 입력·버튼의 가는 테두리.
- **집중 갈색 — focus:** 키보드 포커스, 입력 커서, 라디오·체크박스.
- **오류 적갈색 — danger:** 저장·가져오기 오류와 대화상자 내 안내.

## Typography

**Display / Body Font:** Pretendard, ‘맑은 고딕’, sans-serif.  
**Optional Font:** Ownglyph(온글잎 박다현체), ‘맑은 고딕’, sans-serif.

폰트 파일은 로컬 에셋으로 포함한다. 박다현체를 선택하면 공통 글꼴 변수가 바뀌며 크기와 배치는 유지된다.

### Hierarchy

- **Display:** 현재 일정 제목. 모바일에서는 (23px).
- **Headline:** 시간표·대화상자 제목. 모바일에서는 (19px), 낮은 창의 시간표 제목은 (18px).
- **Title:** 상세 지침의 소제목.
- **Body:** 일반 본문과 편집 입력. 시간표 본문은 남은 높이에 따라 (16px / 18px), 행간은 (1.25).
- **Label:** 시각 설명과 일반 도구 버튼. 표 머리글·상태는 (13px), 모바일에서는 (12px).
- **Countdown:** 남은 시간. 모바일에서는 (29px). 시간표와 함께 `tabular-nums`를 사용한다.

현재 팁은 넓은 화면에서 최대 (70ch), 폭 (601px) 이상에서 두 줄까지만 표시한다. 전체 내용은 현재 행동 안내와 상세 대화상자에서 읽는다.

## Layout

상단 바는 최대 (1360px), 본문은 최대 (1296px)이며 중앙에 놓인다. 본문 좌우 여백은 기본 (32px), 폭 (959px) 이하에서 (20px), (600px) 이하에서 (12px)다.

현재 안내는 텍스트와 캐릭터의 두 열이다. 캐릭터 열은 기본 (240px), 중간 폭에서는 (180px), 모바일에서는 (115px)다. 이미지에는 `object-fit: contain`을 적용하고 공부·휴식·마감 상태에 맞춰 바꾼다. 모바일 일반 화면은 팁을 숨기고 제목·시각·카운트다운·행동 버튼을 유지한다.

시간표는 고정 열 표다. 시간 열 (136px)은 작은 화면에서도 시작·종료를 함께 표시한다. 폭 (959px) 이하에서는 첫 행동 열을 숨기고 시간·과목·상태를 유지한다. 모바일 도구막대는 제목·일정 수와 날짜·편집 제어의 두 줄이다. 폭 (421px) 이상이면서 높이 (620px) 이하인 창은 한 줄 도구막대를 사용한다.

행높이는 표 아래 여유 공간을 기준으로 (22–46px) 사이에서 조정한다. 본문 글자는 최소 (16px)다. 높이 (620px) 이하의 일반 화면은 현재 안내를 숨겨 전체 표를 우선한다. 실제 (390×844px), (480×450px) 화면에서 12개 일정과 시간의 양 끝이 모두 표시되었다.

집중 모드는 표를 숨기고 현재 안내를 유지하며 본문 최대 폭은 (760px)다. 편집 대화상자는 기본 두 열, 모바일 한 열이다. 모바일 일정 목록은 가로로 스크롤하고 대화상자 전체는 세로로 스크롤한다. 창보다 큰 내용은 대화상자의 `max-height: calc(100dvh - 28px)` 안에서 읽는다.

## Elevation & Depth

기본 화면은 경계선과 크림 면으로 구분한다. 그림자는 대화상자와 짧은 상태 안내에만 있다.

- **대화상자:** `0 18px 70px #46372438`; 뒤 화면에는 반투명 갈색 배경을 덮는다.
- **상태 안내:** `0 8px 24px #46372425`; 화면 하단 중앙에 표시한다.

## Shapes

입력·버튼·편집 목록은 작은 둥근 모서리, 표·미리보기는 중간 둥근 모서리, 현재 안내·대화상자는 큰 둥근 모서리를 사용한다. 낮은 창의 표 모서리는 작은 단계로 줄인다. 표 내부는 가는 가로 경계와 교차 행 면으로 읽기 흐름을 만든다.

## Components

### Buttons / Navigation

주요 행동은 노란 면과 굵은 글자, 보조 행동은 투명 면과 종이색 경계다. 상단 설정 버튼은 투명 테두리를 사용한다. 마우스를 올리면 면과 경계가 진해지고, 누르면 노란 면이 된다. 상태 전환은 (0.16s ease), 비활성 버튼은 불투명도 (0.5)다.

아이콘은 직접 포함한 (24×24) SVG 선형 가족이다. 기본 표시 크기 (19px), 선 굵기 (1.7), 둥근 선 끝·연결, `currentColor`, 채움 없음으로 통일한다. 팔레트·집중·백업·편집·방향·닫기·알림 아이콘을 사용한다.

### Current Panel / Timetable

현재 안내는 제목·진행 시각·팁·카운트다운·행동·다음 일정 순서다. 표는 시간·과목·첫 행동·상태 순서이며 현재 행의 면과 ‘진행’ 글자로 상태를 표시한다. 긴 제목과 첫 행동은 한 줄에서 줄임표 처리하고, 일정 제목 버튼으로 전체 지침을 연다.

‘지금 시작’은 현재 첫 행동을 안내한다. ‘오늘 핵심만’은 남은 핵심 일정을 원래 시각에 남기고 ‘원래 시간표’로 복원한다.

### Inputs / Choices / Dialogs

입력은 밝은 면, 가는 경계, 본문 크기를 쓴다. 시작·종료 입력은 두 열을 유지하고 오류는 입력 아래에 표시한다. 콘셉트와 상태 버튼은 `aria-pressed`, 글꼴과 변경 범위는 라디오 입력을 사용한다.

대화상자는 `showModal()`로 열어 배경의 조작을 막는다. 상세·편집·꾸미기·백업·알림·출처 안내에 사용하며 닫기 버튼과 Escape로 닫을 수 있다. 다른 대화상자가 열려 있을 때 시간 알림은 대기시키고 내부 상태 메시지를 표시한다. 진입은 (0.2s) 짧은 펼침이며 동작 줄이기 설정에서는 애니메이션과 전환을 제거한다.

모든 키보드 포커스는 (3px) 외곽선과 (3px) 간격으로 표시한다. 아이콘 전용 버튼에는 접근 가능한 이름, 표 머리글에는 열 범위, 입력에는 레이블이 있다. 오류는 `role="alert"`, 상태 안내는 `role="status"`를 사용한다. 좌·우 방향키로 날짜, Ctrl+E로 편집을 연다. 대화상자나 입력 중에는 화면 단축키를 실행하지 않는다.

알림은 페이지가 열린 동안 동작하며 숨긴 탭·절전에서는 늦어질 수 있다. 일정·설정은 해당 브라우저의 localStorage, 추가 이미지는 IndexedDB에 저장된다. 집중 모드에는 다른 창 위에 고정하는 기능이 없다.

## Do's and Don'ts

### Do:

- **Do** 크림 면·노란 선택 상태·갈색 문자와 제공된 캐릭터 에셋을 유지한다.
- **Do** 작은 창에서도 시간표 본문 (16px)와 시작·종료 시각을 함께 보존한다.
- **Do** 줄임표로 생략된 내용은 상세 대화상자에서 제공한다.
- **Do** 키보드 포커스와 버튼 이름, 상태·오류 안내를 유지한다.

### Don't:

- **Don't** 표를 맞추기 위해 본문 글자를 최소 크기보다 줄이거나 시간의 한쪽을 생략한다.
- **Don't** 박다현체 선택 시 시간표의 열·상태·동작 구조를 바꾼다.
- **Don't** 페이지가 닫혀도 알림이 계속된다고 표시하거나 집중 모드를 다른 창 위 고정으로 설명한다.
- **Don't** 브라우저 저장을 파일 자체 저장이나 기기 간 동기화로 설명한다.

