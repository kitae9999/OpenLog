# OpenLog Design Guide

OpenLog의 UI 디자인 기준 문서입니다.
새 화면·컴포넌트를 만들 때 이 문서의 토큰과 컨벤션을 따릅니다.
레이아웃 시안: `_docs/design/workspace-layout-preview.html` (브라우저로 열면 Dashboard / Log detail / Explore / Logged out 4개 화면을 토글로 확인 가능)

## 1. 디자인 원칙

- **라이트 단일 테마.** 순백(`bg-white`) 기반, 다크 모드 없음. 페이지 배경은 `zinc-50`, 서페이스(카드·사이드바·헤더)는 `white`.
- **도구와 에디토리얼의 분리.** 워크스페이스(대시보드)는 산세리프 중심의 "도구" 톤, 발행 글(피드·본문)은 Georgia serif 제목의 "에디토리얼" 톤.
- **색은 절제.** 기본은 zinc 그레이스케일. 유채색은 의미가 있을 때만 3색(blue/green/amber)을 소량 사용.
- **UI 크롬은 영어, 사용자 콘텐츠는 한국어.** 버튼·섹션 헤더·내비게이션 라벨은 영어(`Write`, `Log now`, `RECENT LOGS`), 글 제목·본문·로그 내용은 사용자가 쓴 언어 그대로.

## 2. 브랜드

로고는 검정 라운드 사각 마크 + Georgia serif 워드마크입니다.
클래스는 `frontend/src/01_widgets/chrome/ui/brand.ts`에 정의되어 있습니다.

```tsx
// 마크: 검정 사각형 안에 serif "O"
<span className="grid size-7 place-items-center rounded-lg bg-black text-[16px] text-white [font-family:Georgia,serif] font-bold">O</span>
// 워드마크
<span className="text-[24px] font-bold leading-none [font-family:Georgia,serif]">OpenLog</span>
```

- 브랜드 컬러는 별도 유채색 없이 **black + Georgia serif** 조합 자체가 아이덴티티.
- 로고에 그라데이션·컬러 변형을 만들지 않는다.

## 3. 컬러

Tailwind 기본 팔레트만 사용합니다. 커스텀 hex를 추가하지 않습니다.

### Neutrals (기본)

| 용도 | 토큰 |
|---|---|
| 페이지 배경 | `zinc-50` |
| 서페이스(카드, 헤더, 사이드바) | `white` |
| 보더 | `zinc-200/70` (기본), `zinc-100` (카드 내부 구분선) |
| 본문 텍스트 | `zinc-950` (제목·강조), `zinc-600`~`zinc-700` (본문), `zinc-500` (보조), `zinc-400` (라벨·비활성) |
| 프라이머리 액션 | `zinc-950` 배경 + `white` 텍스트 (hover `zinc-800`) |

### Semantic (소량만)

| 의미 | 조합 | 예 |
|---|---|---|
| 액션·정보 (blue) | `blue-50` bg / `blue-200` border / `blue-700` text | Follow 버튼, Session summary 박스, Decision 칩 |
| 성공·해결 (green) | `green-50` / `green-200` / `green-700` | Fix 칩, MCP 연결 상태 dot(`green-600`) |
| 경고·낡음 (amber) | `amber-50` / `amber-200` / `amber-700` | stale TODO, 업데이트 필요 표시 |

규칙:
- 한 화면에 semantic 색은 **최대 2~3곳**. 색이 많아지면 전부 zinc로 되돌린다.
- 빨강 계열은 파괴적 액션(삭제) 확인에만 예약.
- 그라데이션 금지 (아바타 포함 — 아바타 플레이스홀더는 `zinc-100` bg + 이니셜).

## 4. 타이포그래피

| 역할 | 폰트 | 사용처 |
|---|---|---|
| Display | `Georgia, serif` bold, tracking-tight | 워드마크, 발행 글 제목(피드 24→30px, 카드 축소 시 21px), 로그 상세 제목, 대시보드 스탯 숫자 |
| Body / UI | 시스템 산세리프 (globals.css `--font-sans`) | 그 외 전부 |
| Mono | 시스템 모노 (`--font-mono`) | 브랜치명, 커밋 해시, CLI 명령, 버전 |

스케일 (실제 컴포넌트 기준):

- 피드 글 제목: `text-[24px] sm:text-[30px] font-bold leading-[1.16] tracking-tight` + Georgia (`ArticleCard`)
- 카드/위젯 내 제목: `text-sm font-semibold text-zinc-950`
- 본문 요약: `text-[15~16px] leading-7 text-zinc-600`
- 메타(날짜·카운트): `text-[13px] text-zinc-500`
- **섹션 헤더**: `text-xs font-semibold tracking-wider text-zinc-400` + 영어 대문자 (`TOP CONTRIBUTORS` 패턴, `TopContributors.tsx`)
- 사이드바 그룹 라벨: 섹션 헤더와 동일 스타일, 더 작게 (`WORKSPACE`, `PUBLISHING`, `DISCOVER`)
- 숫자가 정렬되는 곳은 `tabular-nums`

## 5. 컴포넌트 컨벤션

### 버튼

기준은 Header의 `Write` 버튼입니다.

```
Primary : h-9 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800
Outline : h-9 rounded-xl border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50
Ghost   : text-sm font-medium text-zinc-500 hover:text-zinc-950
```

- 라벨은 영어 + 동사형: `Write`, `Log now`, `Generate PR doc`, `Publish as post`, `Sign in`, `Get started`
- 아이콘은 좌측, `size-4`
- focus: `focus-visible:ring-2 focus-visible:ring-zinc-900/20`

### 필(pill) / 칩

기준은 `Follow` 버튼 (`TopContributors.tsx`).

```
rounded-full border px-3 py-1 text-xs font-semibold
blue  : border-blue-200 bg-blue-50 text-blue-700
green : border-green-200 bg-green-50 text-green-700
amber : border-amber-200 bg-amber-50 text-amber-700
zinc  : border-zinc-200 bg-zinc-50 text-zinc-600   (기본값 — 애매하면 이것)
```

- 발행 글 피드 카드에는 컬러 칩을 붙이지 않는다 (날짜·댓글·하트 메타만).
- 워크스페이스에서 로그 타입 구분(Fix/Decision/Log) 등 기능적 구분에만 사용.

### 카드

```
rounded-2xl border border-zinc-200/70 bg-white
내부 구분선: border-zinc-100
그림자: 없음 또는 극히 약하게 (보더가 기본 구분 수단)
```

### 탭

`FeedTabs.tsx`의 언더라인 스타일이 유일한 탭 패턴입니다.

```
text-sm font-medium, 비활성 text-zinc-500 → hover/활성 text-zinc-950
활성 표시: absolute h-0.5 bg-zinc-950 (보더 라인 위에 -bottom-px)
```

### 아이콘

- 24 viewBox, `fill="none"`, `stroke="currentColor"`, `strokeWidth 1.7~2`, round cap/join
- 인라인 함수 컴포넌트로 정의 (외부 아이콘 라이브러리 사용 안 함)
- 기존 정의 재사용: `IconHeart`, `IconComment`, `IconHome`, `IconWorkspace`, `IconUsers` (HomeFeedShell), `GitPullRequestIcon` (shared/ui/icons), `IconPencil`, `IconMenu` (Header)
- 크기: 본문 인라인 `size-4`, 내비게이션 `size-5`

### 아바타

`rounded-full border border-zinc-200 object-cover`, 크기는 맥락별 24 / 28 / 36px.
이미지 없을 때는 `zinc-100` bg + 이니셜 텍스트.

## 6. 레이아웃

### 워크스페이스 셸 (로그인)

```
┌─ sidebar 232px ─┬─ topbar h-14 ──────────────┐
│ 로고             │ breadcrumb · branch chip    │
│ 프로젝트 스위처   │        search(⌘K) · avatar │
│ WORKSPACE nav   ├────────────────────────────┤
│ PUBLISHING nav  │ main (bg zinc-50, p-5~6)    │
│ DISCOVER nav    │  1.6fr : 1fr 위젯 그리드     │
│ MCP 상태(하단)   │                            │
└─────────────────┴────────────────────────────┘
```

- 사이드바: `white` bg, `border-r zinc-200/70`. 활성 항목 `bg-zinc-100 text-zinc-950 font-semibold` (기존 사이드바 탭 패턴).
- WORKSPACE 네비게이션: Dashboard / **Logs (토글 확장: All · Issues · Fixes · Decisions)** / Planner / Graph / Outputs / Memory.
  하위 항목은 좌측 가이드 라인(`border-l zinc-200`) + 들여쓰기로 표현. Issues 뱃지는 open 카운트(amber).
- 브랜치·커밋은 항상 mono 폰트 + zinc 필로 표시.
- 대시보드 구성 (좌 → 우, 위 → 아래가 사용 순서):
  - 좌측: NOW WORKING(컴팩트 히어로) → TASKS(Today/This week 체크리스트, MCP 노출) → RECENT LOGS
  - 우측 레일: THIS WEEK(7일 스트립: 과거=로그 활동 dot, 미래=계획 hollow dot) → GRAPH(미니 그래프 + 풀 뷰 진입, KnowledgeGraphCard 패턴) → OPEN ISSUES → PROJECT MEMORY
- 대시보드 위젯 원칙: **지금 행동 가능한 것** 또는 **한눈에 읽히는 상태**만. 탐색이 필요한 건 전용 페이지(Planner, Graph, Logs)로.

### Explore (로그인)

- 같은 셸 안에서 사이드바 DISCOVER > Explore 활성, 브랜치 칩 숨김 (프로젝트 스코프 벗어남).
- 피드는 `ArticleCard` 재사용, 우측 레일에 TOP CONTRIBUTORS / TRENDING TOPICS.

### 비로그인 (게스트)

- 사이드바·워크스페이스 없음. 게스트 헤더(로고 + 검색 + `Sign in`/`Get started`)와 발행 글 피드만.
- 상단 배너: 제품 한 줄 설명 + CLI 스니펫(`$ npx @kitae9999/openlog-cli login`)이 가입 진입점.
- Following 탭, Follow 버튼 등 로그인 필요 기능은 렌더링하지 않는다.

### 반응형

- 사이드바는 840px 이하에서 숨김(토글).
- 피드 카드 썸네일은 640px 이하에서 숨김 (`ArticleCard` 기존 동작 유지).
- 가로 스크롤은 코드 블록 등 자체 컨테이너(`overflow-x-auto`) 안에서만.

## 7. Don't

- ❌ 다크 모드 스타일 추가
- ❌ 커스텀 hex 색상, 그라데이션, 컬러 아바타
- ❌ 한 화면에 semantic 색 4곳 이상
- ❌ 번호 뱃지(①②③), 이모지 섹션 마커
- ❌ 한국어 버튼/섹션 헤더 라벨 (콘텐츠는 예외)
- ❌ 발행 글 카드에 상태·타입 칩 부착
- ❌ 외부 아이콘/폰트 라이브러리 추가 (인라인 SVG + 시스템 폰트 + Georgia로 해결)
