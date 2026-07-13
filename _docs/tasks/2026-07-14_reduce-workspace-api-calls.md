# [TASK] 워크스페이스 API 호출 감소 전후 비교

## 0. 메타
- ID: T-2026-07-14-WORKSPACE-API-CALLS
- 작성일: 2026-07-14
- 작성자: OpenLog Team
- 작업 브랜치: `refactor/reduce-workspace-api-calls`
- 상태: Done
- 관련 링크: 커밋 `ea00574`, `df26e1b`, `fd628bb`
- 영향 범위: 프론트엔드 워크스페이스 서버 렌더링, 로그/산출물 조회 API, 백엔드 산출물 연관 데이터 조회

## 1. 문제 정의 (Problem Statement)
- 관찰한 현상:
  - 워크스페이스 화면 진입 시 목록 API를 호출한 뒤 모든 로그와 산출물의 상세 API를 다시 호출했다.
  - 화면에서 사용하지 않는 링크, Todo, Memory, Working Brief, Output까지 공통 로더가 항상 조회했다.
  - 산출물 목록은 `DRAFT`, `EXPORTED`, `PUBLISHED` 상태별로 API를 3번 호출했다.
  - 백엔드는 산출물 하나마다 Task/Log 연결을 각각 조회해 산출물 개수에 비례해 쿼리가 증가했다.
- 기대 동작:
  - 목록 화면은 목록 응답만 사용하고 실제로 선택한 항목만 상세 조회한다.
  - 화면이 사용하는 데이터만 조회한다.
  - 산출물 연결 정보는 목록 단위로 일괄 조회한다.
- 실제 동작:
  - 개선 전 공통 로더의 추가 상세 호출 수는 로그 수 `L`, 산출물 수 `O`에 대해 `Θ(L + O)`로 증가했다.
  - `fetch(..., { cache: "no-store" })`를 사용하므로 각 상세 요청은 Next.js Data Cache에서 재사용되지 않고 백엔드까지 전달됐다.
- 재현 절차:
  1. `develop` 기준으로 로그인 후 워크스페이스가 필요한 화면에 진입한다.
  2. `workspaceApi.ts`의 `fetchAllLogs`, `fetchOutputs`, `fetchWorkspaceUiData` 호출 경로를 추적한다.
  3. 로그 목록 응답 수만큼 `/logs/{logId}`, 산출물 목록 응답 수만큼 `/outputs/{outputId}`가 추가되는지 확인한다.
- 발생 빈도/조건:
  - 워크스페이스 서버 렌더링마다 발생한다.
  - 로그 또는 산출물이 많을수록 선형으로 악화한다.
  - React `cache()`로 동일 렌더 안의 동일 로더 호출은 중복 제거될 수 있지만, `no-store`이므로 서로 다른 상세 URL과 다음 요청 사이에는 응답이 재사용되지 않는다.
- 로그/스크린샷/에러:
  - 별도 운영 트레이스는 확보하지 않았다. 아래 수치는 코드 경로를 기준으로 산정한 요청 수이며 실제 네트워크 측정값과 구분한다.

## 2. 원인 가설 (Hypotheses)
- 가설 1: 응답을 작게 만든 것 자체가 호출 증가의 원인이다.
  - 근거: 목록 응답에는 상세 `content`가 없어서 상세 응답이 필요했다.
  - 확인 방법: 상세 데이터가 필요한 시점과 화면을 확인한다.
  - 결론: 부분적으로만 맞다. 목록 응답을 작게 유지하는 것은 적절하지만, 목록을 받은 직후 모든 항목의 상세를 선조회한 정책이 N+1을 만들었다.
- 가설 2: 프론트엔드 공통 로더가 화면 요구사항보다 많은 데이터를 가져온다.
  - 근거: 목록, 작성, 편집, Activity, Planner 화면도 전체 스냅샷 로더를 사용했다.
  - 확인 방법: 각 Feed가 실제로 참조하는 `WorkspaceUiData` 필드를 확인한다.
  - 결론: 확정. Task/Log 탐색만 필요한 화면을 경량 로더로 분리했다.
- 가설 3: 백엔드 산출물 목록 변환 과정에도 N+1이 있다.
  - 근거: 산출물마다 `findAllByOutputId`를 Task/Log에 각각 실행했다.
  - 확인 방법: `OutputService.getOutputs`의 Repository 호출을 산출물 개수별로 계산한다.
  - 결론: 확정. `findAllByOutputIdIn` 배치 조회 2회로 변경했다.

## 3. 목표/비목표 (Goals / Non-goals)
### Goals
- 목록 조회 직후 발생하는 로그 `L`회, 산출물 `O`회 상세 요청을 제거한다.
- 산출물 목록 API를 상태별 3회에서 1회로 줄인다.
- 산출물 연관 Task/Log 조회를 `2O`회에서 배치 2회로 줄인다.
- 화면별 데이터 요구량에 따라 전체 로더와 경량 로더를 구분한다.
- 개선 전후 호출 수를 데이터 규모별로 재현 가능한 공식으로 남긴다.

### Non-goals
- WAF, IP/User Rate Limit, 봇 차단 등 외부 남용 방어는 이번 작업에 포함하지 않는다.
- `cache: "no-store"` 정책 자체를 변경하지 않는다.
- 운영 APM의 latency, payload byte, DB 실제 SQL 수를 측정하지 않는다.
- Task/Log/Memory 목록의 커서 페이지네이션을 무한 스크롤 방식으로 변경하지 않는다.

## 4. 해결 전략 (Approach)
- 선택한 전략:
  - 로그와 산출물 목록은 요약 응답을 그대로 사용하고, 선택한 ID만 상세 조회한다.
  - 산출물 목록 응답에 `taskIds`, `logIds`를 포함해 상세 응답 없이 연결 관계를 구성한다.
  - 산출물 목록은 상태 필터 없는 단일 API를 호출한다.
  - 백엔드는 모든 산출물 ID의 연결 정보를 Task/Log 각각 한 번에 조회한다.
  - 공통 전체 로더와 Task/Log 탐색용 경량 로더를 분리한다.
- 대안과 트레이드오프:
  - 목록 응답에 전체 본문을 포함하면 상세 요청을 없앨 수 있지만 목록 payload가 커지므로 채택하지 않았다.
  - 캐시 TTL을 추가하면 반복 요청은 줄지만 사용자별 최신 데이터 정합성과 무효화 정책이 필요하므로 후속 범위로 남겼다.
  - 경량 로더도 사이드바 카운트를 위해 Task/Log 전체 페이지를 읽는다. 호출 수는 로그 개수가 아니라 페이지 수에 비례하지만, 데이터가 매우 많으면 여전히 개선 여지가 있다.
- 리스크/롤백 전략:
  - 목록 응답의 `taskIds`, `logIds`는 기존 count 필드를 유지한 채 추가해 하위 호환성을 보존한다.
  - 전체 데이터가 필요한 Dashboard, Graph, Memory, Task Detail, Outputs List는 전체 로더를 유지한다.
  - 세 작업을 독립 커밋으로 분리해 문제 발생 시 단위별 revert가 가능하다.

## 5. 측정 기준과 산정식

### 5.1 변수 정의

| 변수 | 의미 | 계산 |
|---|---|---|
| `T` | 선택 워크스페이스의 Task 수 | 목록 응답 개수 |
| `L` | 선택 워크스페이스의 Log 수 | 목록 응답 개수 |
| `O` | 선택 워크스페이스의 Output 수 | 세 상태의 합계 |
| `M` | 선택 워크스페이스의 Memory 수 | 목록 응답 개수 |
| `P_T` | Task 목록 페이지 수 | `max(1, ceil(T / 50))` |
| `P_L` | Log 목록 페이지 수 | `max(1, ceil(L / 50))` |
| `P_M` | Memory 목록 페이지 수 | `max(1, ceil(M / 50))` |

빈 목록이어도 첫 페이지 확인 요청은 발생하므로 페이지 수의 최솟값은 1이다.

### 5.2 포함 및 제외 범위

- 포함:
  - `workspaceApi.ts`를 통해 백엔드로 전송되는 워크스페이스 관련 HTTP 요청
  - Activity/Planner처럼 해당 화면이 추가로 호출하는 워크스페이스 API
- 제외:
  - 사용자 인증/온보딩 확인 요청
  - Home/Explore의 게시글, 좋아요, 팔로잉 API
  - 브라우저 정적 리소스, RSC 자체 요청
  - Mutation 이후 router refresh로 발생하는 별도 렌더
- 요청 단위:
  - 로그인 사용자의 서버 렌더 1회
  - 동일 렌더에서 같은 `cache()` 로더가 호출되면 React 요청 단위 메모이제이션으로 중복 제거된다고 가정한다.
  - 서로 다른 URL의 상세 요청은 `no-store`이므로 모두 실제 요청으로 계산한다.

### 5.3 공통 전체 로더

개선 전 전체 로더는 다음 요청을 수행했다.

| 호출 | 횟수 |
|---|---:|
| Workspace 목록 | 1 |
| Task 목록 | `P_T` |
| Log 목록 | `P_L` |
| 모든 Log 상세 | `L` |
| Task Link | 1 |
| Log Link | 1 |
| Cross Link | 1 |
| 오늘의 Todo | 1 |
| Output 상태별 목록 | 3 |
| 모든 Output 상세 | `O` |
| Memory 목록 | `P_M` |
| Working Brief | 1 |
| **합계 `F_before`** | **`9 + P_T + P_L + P_M + L + O`** |

개선 후 전체 로더는 목록 응답만 사용한다.

| 호출 | 횟수 |
|---|---:|
| Workspace 목록 | 1 |
| Task 목록 | `P_T` |
| Log 목록 | `P_L` |
| Task/Log/Cross Link | 3 |
| 오늘의 Todo | 1 |
| Output 전체 목록 | 1 |
| Memory 목록 | `P_M` |
| Working Brief | 1 |
| **합계 `F_after`** | **`7 + P_T + P_L + P_M`** |

따라서 전체 로더 한 번당 **`2 + L + O`회**가 고정적으로 감소한다. 데이터가 늘어도 상세 호출은 증가하지 않고 목록 페이지 수만 증가한다.

### 5.4 경량 Navigation 로더

경량 로더는 사이드바와 선택 UI에 필요한 Workspace, Task, Log만 조회한다.

| 호출 | 횟수 |
|---|---:|
| Workspace 목록 | 1 |
| Task 목록 | `P_T` |
| Log 목록 | `P_L` |
| **합계 `N_after`** | **`1 + P_T + P_L`** |

개선 전 전체 로더 대비 **`8 + P_M + L + O`회**가 감소한다.

### 5.5 화면별 공식

| 화면 그룹 | 개선 전 | 개선 후 | 감소량 |
|---|---:|---:|---:|
| Task/Log 목록, Task/Log/Output 작성, Task 편집, App Chrome, Home 비워크스페이스 탭 | `F_before` | `N_after` | `8 + P_M + L + O` |
| Planner | `F_before + 1` | `N_after + 1` | `8 + P_M + L + O` |
| Activity | `F_before + 2` | `N_after + 2` | `8 + P_M + L + O` |
| Log 편집 | `F_before` | `N_after + 1` | `7 + P_M + L + O` |
| Output 상세 | `F_before` | `N_after + 1` | `7 + P_M + L + O` |
| Dashboard/Home Workspace | `F_before + 1` | `F_after + 1` | `2 + L + O` |
| Graph, Memory, Task 상세, Outputs 목록 | `F_before` | `F_after` | `2 + L + O` |
| Log 상세 | `F_before` | `F_after + 1` | `1 + L + O` |

Log 상세는 연결 그래프 등에 필요한 전체 스냅샷을 유지하고 선택한 Log 상세 1회만 추가한다. Log 편집과 Output 상세는 경량 로더 뒤 선택 항목 상세 1회만 호출한다.

## 6. 개선 전후 수치 비교

### 6.1 데이터 규모별 로더 비교

| 시나리오 | 데이터 규모 `(T/L/O/M)` | 페이지 `(P_T/P_L/P_M)` | 개선 전 전체 `F_before` | 개선 후 전체 `F_after` | 전체 감소율 | 개선 후 경량 `N_after` | 경량 전환 감소율 |
|---|---|---|---:|---:|---:|---:|---:|
| 소규모 | `20/20/5/10` | `1/1/1` | 37 | 10 | 73.0% | 3 | 91.9% |
| 중규모 | `100/100/20/50` | `2/2/1` | 134 | 12 | 91.0% | 5 | 96.3% |
| 대규모 | `500/1,000/100/200` | `10/20/4` | 1,143 | 41 | 96.4% | 31 | 97.3% |

`L + O` 상세 호출이 제거되므로 데이터가 많을수록 감소율이 커진다. 개선 후에도 Task/Log/Memory 페이지네이션 요청은 데이터 규모에 따라 증가한다.

### 6.2 중규모 워크스페이스의 화면별 예시

조건: `T=100`, `L=100`, `O=20`, `M=50`, 따라서 `F_before=134`, `F_after=12`, `N_after=5`.

| 화면 | 개선 전 | 개선 후 | 감소 | 감소율 |
|---|---:|---:|---:|---:|
| Task/Log 목록 및 일반 경량 화면 | 134 | 5 | 129 | 96.3% |
| Planner | 135 | 6 | 129 | 95.6% |
| Activity | 136 | 7 | 129 | 94.9% |
| Log 편집 | 134 | 6 | 128 | 95.5% |
| Output 상세 | 134 | 6 | 128 | 95.5% |
| Dashboard/Home Workspace | 135 | 13 | 122 | 90.4% |
| Graph/Memory/Task 상세/Outputs 목록 | 134 | 12 | 122 | 91.0% |
| Log 상세 | 134 | 13 | 121 | 90.3% |

### 6.3 상세 API 호출 비교

| 대상 | 개선 전 | 개선 후 목록/전체 화면 | 개선 후 단일 상세/편집 화면 |
|---|---:|---:|---:|
| Log 상세 API | `L` | 0 | 선택한 Log 1회 |
| Output 목록 API | 3 | 1 | 상세 화면에서는 0 |
| Output 상세 API | `O` | 0 | 선택한 Output 1회 |

중규모 예시 `L=100`, `O=20`에서는 공통 스냅샷의 Log/Output 데이터 로딩 HTTP 요청이 **123회(로그 상세 100 + 산출물 목록 3 + 산출물 상세 20)**에서 **산출물 목록 1회**로 줄어든다. Task/Log 목록과 다른 공통 API는 이 수치에 포함하지 않았다.

## 7. 백엔드 Repository 호출 비교

### 7.1 Output 목록 단일 서비스 호출

`OutputService.getOutputs` 내부의 연관 데이터 Repository 호출만 비교한다.

| 반환 Output 수 `O` | 개선 전 Task/Log 연결 조회 | 개선 후 Task/Log 연결 조회 | 감소율 |
|---:|---:|---:|---:|
| 5 | 10 | 2 | 80.0% |
| 20 | 40 | 2 | 95.0% |
| 100 | 200 | 2 | 99.0% |

- 개선 전: Output마다 `findAllByOutputId`를 Task/Log에 각각 실행해 `2O`회
- 개선 후: `findAllByOutputIdIn(outputIds)`를 Task/Log에 각각 실행해 2회
- `O=0`이면 개선 후 조기 반환하므로 연결 조회는 0회다.

### 7.2 프론트의 3개 상태 목록 호출까지 포함

Repository 메서드 호출을 코드에 명시된 호출 기준으로 계산한다. Workspace 권한 조회와 Output 목록 조회를 각 API당 1회로 보고, ORM lazy loading으로 발생할 수 있는 추가 SQL은 제외한다.

- 개선 전: 상태별 API 3회 × `(Workspace 1 + Output 목록 1)` + 연결 조회 `2O` = **`6 + 2O`회**
- 개선 후: 단일 API `(Workspace 1 + Output 목록 1)` + 배치 연결 조회 2회 = **4회**

| 전체 Output 수 `O` | 개선 전 | 개선 후 | 감소율 |
|---:|---:|---:|---:|
| 5 | 16 | 4 | 75.0% |
| 20 | 46 | 4 | 91.3% |
| 100 | 206 | 4 | 98.1% |

개선 전 공통 로더는 이어서 모든 Output 상세 API도 호출했다. 상세 서비스 한 번에는 코드상 Workspace, Output, Task 연결, Log 연결, 발행 Post 조회가 각각 1회 있어 최대 `5O`회의 Repository 메서드 호출이 추가됐다. 따라서 Output 관련 전체 경로는 코드상 최대 `6 + 7O`회였고, 개선 후 목록/전체 화면에서는 4회로 고정된다. 이 값은 실제 SQL 프로파일 결과가 아니라 서비스 코드에 명시된 Repository 메서드 호출 상한 비교다.

## 8. Cache-Control과 응답 최소화 해석

- `cache: "no-store"`의 의미:
  - Next.js가 해당 `fetch` 응답을 Data Cache에 저장하지 않는다.
  - 매 렌더와 서로 다른 상세 URL 요청은 백엔드까지 전달된다.
  - N+1의 원인은 아니지만 N+1 요청을 캐시로 흡수하지 않기 때문에 비용이 그대로 드러난다.
- 응답 최소화의 문제 여부:
  - Log 목록에서 본문을 제외한 것은 문제가 아니다. 목록은 요약을 표시하고 선택 시 본문 1건만 조회하도록 변경했다.
  - Output 목록은 연결 관계를 표시하는 데 ID가 필요했다. 전체 상세 본문 대신 `taskIds`, `logIds`만 목록 응답에 추가해 필요한 최소 정보와 호출 감소를 절충했다.
  - 즉 문제는 “작은 응답”이 아니라 “작은 응답을 받은 즉시 모든 상세를 선조회한 호출 정책”이었다.

## 9. 체크리스트 (Execution Checklist)
### 조사/측정
- [x] `develop`과 현재 브랜치의 호출 경로 비교 — `workspaceApi.ts`
- [x] 페이지네이션 크기와 최소 호출 수 확인 — Task/Log/Memory `size=50`
- [x] 화면별 전체/경량 로더 사용처 확인 — 커밋 `fd628bb`
- [x] 백엔드 Output Repository 호출 구조 확인 — 커밋 `df26e1b`

### 구현
- [x] Log 목록 직후 상세 N+1 제거 — 커밋 `ea00574`
- [x] Output 목록 직후 상세 N+1 제거 — 커밋 `df26e1b`
- [x] Output 상태별 3회 호출을 1회로 통합 — 커밋 `df26e1b`
- [x] Output 연결 조회를 배치 처리 — 커밋 `df26e1b`
- [x] 화면별 경량 로더 적용 — 커밋 `fd628bb`

### 테스트
- [x] 프론트 TypeScript 검사 통과 — `pnpm exec tsc --noEmit`
- [x] 프론트 프로덕션 빌드 통과 — `pnpm run build`
- [x] 프론트 전체 ESLint 오류 0건 — 기존 Hook 의존성 warning 14건
- [x] 백엔드 전체 테스트 통과 — `./gradlew :backend:test`
- [x] Output 배치 조회 단위 테스트 통과 — `OutputServiceTest`

### 검증/배포
- [x] 기준 브랜치 대비 삭제된 기존 주석 없음
- [x] 작업 단위별 독립 커밋 완료
- [ ] 운영 APM에서 실제 요청 수/latency/payload 검증
- [ ] Rate Limit 및 비정상 호출 모니터링 추가

## 10. 개선 계획 (Improvement Plan)
### 10.1 단기(이번 작업에 포함)
- Log/Output 상세 지연 조회:
  - 설명: 선택한 항목만 상세 API를 호출한다.
  - 완료 조건(Definition of Done): 목록 렌더에서 `/logs/{id}`, `/outputs/{id}` 반복 호출이 없어야 한다.
  - 측정 지표: 목록/전체 화면 상세 호출 0회, 상세/편집 화면 1회.
- Output 배치 조회:
  - 설명: 연결 Task/Log를 Output ID 묶음으로 조회한다.
  - 완료 조건(Definition of Done): 목록 반환 개수와 무관하게 연결 Repository 호출이 최대 2회여야 한다.
  - 측정 지표: `2O → 2`.
- 화면별 로더 분리:
  - 설명: 전체 스냅샷이 필요 없는 화면은 Workspace/Task/Log만 로드한다.
  - 완료 조건(Definition of Done): 대상 Feed가 `loadWorkspaceNavigationPageData`를 사용해야 한다.
  - 측정 지표: 중규모 예시에서 기본 134회 → 5회.

### 10.2 중기(후속 태스크)
- 실제 호출 관측성 추가:
  - 설명: endpoint별 request count, latency, response size, 사용자/워크스페이스별 fan-out을 수집한다.
  - 분리 이유: APM/로그 스키마와 운영 대시보드 결정이 필요하다.
  - 후속 ID/링크: 미정
- Rate Limit 추가:
  - 설명: 사용자, IP, Workspace 단위 제한과 429 응답 정책을 정의한다.
  - 분리 이유: 정상 CLI/MCP 트래픽 기준과 인프라 계층 선택이 필요하다.
  - 후속 ID/링크: 미정
- Sidebar count 전용 API 검토:
  - 설명: 경량 로더가 Task/Log 전체 페이지를 읽지 않고 count와 최소 요약만 받도록 한다.
  - 분리 이유: API 계약 및 UI 요구사항 조정이 필요하다.
  - 후속 ID/링크: 미정

### 10.3 장기(아키텍처/프로세스)
- 화면별 Query Contract 정립:
  - 설명: List, Detail, Navigation, Dashboard projection을 명시적으로 구분한다.
  - 기대 효과: 공통 DTO/로더가 다시 비대해지는 것을 방지한다.
- 성능 회귀 테스트 도입:
  - 설명: 대표 데이터셋에서 화면별 최대 API/SQL 호출 수를 자동 검증한다.
  - 기대 효과: N+1과 불필요한 fan-out을 CI에서 조기에 탐지한다.

## 11. 완료 기준 (DoD)
- 기능적 DoD: 목록 데이터와 선택 상세 데이터가 기존 UI 기능을 유지하면서 분리됨.
- 품질 DoD: 프론트 빌드 및 백엔드 전체 테스트 통과, Output 배치 조회 테스트 존재.
- 문서 DoD: 공식, 대표 시나리오, 화면별 결과, 측정 한계와 후속 과제를 본 문서에 기록함.

## 12. 변경 요약(최종 작성)
- 변경점:
  - Log/Output 상세 N+1 제거
  - Output 목록 HTTP 3회 → 1회
  - Output 연결 Repository 조회 `2O` → 2회
  - 전체/경량 워크스페이스 로더 분리
- 영향/호환성:
  - 기존 Output count 필드를 유지하고 ID 목록을 추가해 프론트 호환성을 유지한다.
  - 전체 데이터가 필요한 화면은 기존 전체 로더 의미를 유지한다.
- 남은 과제:
  - 운영 실측, Rate Limit, endpoint별 관측성, Sidebar count 전용 응답
- Worklog:
  - 별도 Worklog 없음
