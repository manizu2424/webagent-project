# WEBAGENT.KR MVP 작업 목록

최종 업데이트: 2026-09-09

이 문서는 현재 구현 상태를 기준으로 남은 작업의 우선순위와 완료 조건을 관리합니다. 제품 범위와 기술 기준은 `README.md` 및 `docs/consolidated/` 문서를 따릅니다.

## 현재 상태

아래 완료 표시는 기본 구현과 2026-09-09까지의 검증 이력입니다. 전체 검토에서 발견한 R1~R10은 수정 완료됐으며, 남은 출시 전 보완 사항은 아래 `추가 출시 보완 및 문서 동기화`에서 관리합니다.

- [x] Next.js App Router, TypeScript, Tailwind CSS 프로젝트 구성
- [x] 랜딩 페이지와 5단계 진단 폼
- [x] PostgreSQL 및 Drizzle schema/migration
- [x] 진단 제출, 결과 조회, 상담 신청 API
- [x] n8n Webhook 호출 모듈과 내부 결과 callback API
- [x] 관리자 인증, 진단·상담 조회 및 상태 변경
- [x] 개인정보처리방침, rate limit, 보안 헤더, 오류 화면
- [x] ESLint 통과
- [x] Vitest 112개 테스트 통과
- [x] Next.js production build 통과
- [x] R1 Docker 빌드 컨텍스트 및 이미지에서 실제 환경 파일 제외
- [x] 실제 PostgreSQL 로컬 저장 및 관리자 흐름 검증
- [x] 실제 n8n 로컬 전체 흐름 검증
- [x] Telegram 관리자 알림 구현, mock 및 실제 수신 검증
- [ ] 운영 배포, 백업 및 복원 검증
- [ ] 핵심 E2E 테스트

## 다음 재개 지점 (인수인계)

> **현재 위치: R1~R10, 4A, 결과 화면과 Telegram 알림의 실제 수신 검증까지 완료했습니다. 다음 작업은 7번 핵심 통합 및 E2E 테스트입니다.**
>
> 2026-09-09에 교체한 Bot token으로 `getMe`가 성공했고, 진단 완료와 상담 신청 메시지가 실제 Telegram 채널에 도착한 것을 확인했습니다. 같은 멱등 키 재전송은 기존 ID와 `replayed: true`를 반환했고 추가 DB 행을 만들지 않았습니다.

### 2026-09-09 세션 종료 인수인계

- R6~R10, 결과 화면과 Telegram 알림 구현·문서 변경은 작업 트리에 **의도적으로 미커밋 상태**로 남아 있습니다. 다음 세션에서 `git status --short`와 `git diff --check`를 먼저 확인하고 기존 변경을 되돌리지 않습니다.
- R6 migration `db/migrations/0001_swift_deathstrike.sql`은 기존 행 백필을 포함하며 로컬 PostgreSQL 영속 볼륨에 실제 적용했습니다.
- R6 실제 HTTP 중복 제출 검증용 합성 데이터는 삭제했습니다. 개발 서버, PostgreSQL과 n8n 컨테이너는 모두 종료 상태입니다.
- 교체한 Telegram Bot token의 `getMe` 인증과 429 해제를 확인했습니다. token과 Telegram 응답 원문은 출력하거나 문서에 저장하지 않았습니다.
- 합성 진단의 n8n callback·`COMPLETED` 전환과 합성 상담의 `NEW` 저장 후, 진단 완료·상담 신청 Telegram 메시지가 실제 채널에 도착한 것을 확인했습니다.
- 같은 멱등 키로 진단·상담을 재전송했을 때 모두 기존 ID와 `replayed: true`를 반환했고, DB에는 각각 한 건만 유지됐습니다.
- 검증용 리드·진단·결과·상담·자동화 로그를 삭제했고 개발 서버, PostgreSQL과 n8n 컨테이너를 모두 종료했습니다.
- 2026-09-09 전체 검증에서 ESLint, Vitest 18개 파일·112개 테스트, Next.js webpack production build가 모두 통과했습니다.
- `next build`가 자동으로 바꾸는 `next-env.d.ts`는 추적 중인 원래 dev types 경로로 복원했으며 현재 작업 변경에 포함되지 않습니다.
- 다음 작업은 7번 핵심 통합 및 E2E 테스트를 자동화하는 것입니다. 이후 실제 AI 연결(4B)과 운영 Compose(8번)를 진행합니다.

다음 세션 시작 명령:

```bash
git status --short
node -r dotenv/config -e 'console.log({ telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) })'
rg -n -A 28 "### 7\. 핵심 통합 및 E2E" task.md
npm run test
```

6번 Telegram 실제 연동 검증 기록:

1. 교체 token의 `getMe` 성공과 429 해제를 확인했습니다.
2. 진단 완료와 상담 저장 요청을 각각 실행해 실제 채널의 메시지 수신을 확인했습니다.
3. 같은 멱등 키 재전송이 기존 진단·상담 ID를 반환하고 DB 행을 추가하지 않는 것을 확인했습니다.
4. credential과 Telegram 오류 원문이 로그·응답·Git 변경에 포함되지 않았습니다.

### 지금까지 반영된 내용

- 공개 진단 결과 API를 공개용 DTO로 제한해 이메일, 전화번호, 담당자, 내부 ID 및 원본 AI 응답이 노출되지 않도록 했습니다.
- n8n 전달 실패 시 `FAILED`, Webhook 미설정 시 `SUBMITTED`, 정상 전달 시 `PROCESSING`으로 구분하고 결과 화면 polling을 `PROCESSING`에만 적용했습니다.
- 실제 로컬 PostgreSQL에서 migration, 진단 제출, 상담 신청, 관리자 로그인·조회·상태 변경을 검증했습니다.
- AI callback payload는 실제 JSON 숫자만 허용하며 `null`·빈 문자열·boolean의 숫자 변환을 차단합니다. 구현 단계는 배열 위치와 `order`가 1부터 중복·누락 없이 연속돼야 합니다.
- rate limit은 신뢰 프록시 설정이 명시적으로 켜진 경우에만 유효한 `X-Real-IP`를 사용하고 `X-Forwarded-For`를 무시합니다. 만료 버킷 정리와 10,000개 저장소 상한을 적용했으며 현재 운영 모델은 단일 앱 인스턴스로 확정했습니다.
- 공개 결과 DTO에 추천 업무와 구현 단계의 구체적인 타입을 적용하고 점수·요약·절감 시간·난이도·기술 스택·구축 단계를 모두 표시합니다. 과거·불완전 배열과 선택 필드에는 명시적인 fallback을 제공합니다.
- Telegram Bot API 알림 모듈을 진단 최초 완료와 신규 상담 저장 뒤 transaction 밖에 연결했습니다. 설정 누락은 건너뛰고 timeout·전송 실패는 안전하게 기록하되 핵심 API 성공을 유지합니다.
- callback의 결과 upsert와 진단 `COMPLETED` 변경을 하나의 DB transaction으로 묶었습니다.
- 같은 진단에 callback을 두 번 보내 결과 행이 하나만 유지되는 upsert를 실제 DB에서 확인했습니다.
- 프로젝트 전용 n8n 2.37.10 컨테이너, Webhook secret 검사, 로컬 구조화 분석 및 callback 워크플로를 추가·import·publish했습니다.
- 로컬 n8n은 외부 AI 대신 결정론적 분석 노드를 사용합니다. 운영 전 OpenAI/Gemini 노드와 n8n credential 연결이 별도로 필요합니다.
- `.dockerignore`로 실제 환경 파일과 로컬 빌드 산출물을 Docker 컨텍스트에서 제외하고, 환경 변수는 컨테이너 실행 시 주입하도록 문서화했습니다. 검증 이미지 내부에 `.env*`, Git 메타데이터 및 작업 문서가 없고 런타임 변수 주입이 작동하는 것을 확인했습니다.
- 독립 상담 폼과 서버 검증 경계에서 빈 진단 ID를 선택 필드로 정규화했습니다. 실제 HTTP 요청에서 독립 상담 201, 잘못된 ID 422, 존재하지 않는 UUID 404를 확인했습니다.
- 진단 제출 API가 n8n 호출 전에 `PROCESSING`으로 전환하고 실패 시 해당 상태만 `FAILED`로 바꾸도록 수정했습니다. callback 선완료 시 `COMPLETED`가 보존되며 제출 응답은 DB 최종 조회 상태를 사용합니다.
- n8n 2.37 로컬 노드의 환경 변수 접근 설정을 명시해 Webhook secret 401 분기와 callback URL·secret 사용을 복구했습니다. 실제 제출 한 번으로 callback, 결과 저장, `COMPLETED` 응답과 공개 결과 조회까지 확인했습니다.
- 관리자 비밀번호를 salt 없는 SHA-256에서 Argon2id로 전환하고 15분당 5회 로그인 제한과 성공 시 제한 초기화를 적용했습니다. 기존 로컬 SHA-256 해시는 새 명령으로 재생성해야 합니다.
- 서버 오류 로깅을 공통 안전 로거로 통합해 쿼리, 매개변수, 개인정보, secret과 stack 대신 요청 ID와 제한된 오류 유형·코드만 기록하도록 했습니다.
- 진단의 lead·diagnosis와 독립 상담의 lead·consultation을 각각 transaction으로 저장하고 외부 n8n 호출은 transaction 완료 후 수행하도록 분리했습니다.
- 브라우저가 생성한 UUID `Idempotency-Key`와 서버 요청 지문·DB 고유 제약으로 진단·상담 중복 생성을 막고, 동일 재전송에는 기존 ID를 반환하며 키 충돌은 409로 거부합니다.
- 핵심 진단 저장 후 `automation_logs` 저장만 실패하면 제출 성공 응답을 유지하고 개인정보 없는 서버 오류 이벤트를 남기도록 정책을 확정했습니다.
- 진단·상담·관리자 로그인과 결과 조회에 공통 timeout·안전한 JSON 파싱을 적용하고, 멱등 POST와 결과 GET은 일시적 네트워크·게이트웨이 오류를 한 번 재시도하도록 했습니다.
- 결과 polling은 5초 간격·최대 2분으로 제한하고 장기 대기·조회 실패의 수동 재확인 UI와 `COMPLETED` 결과 누락 상태를 별도로 표시합니다.
- 관리자 상담 상세에서 이메일·전화번호·희망 일정·요청 내용·상태·메모를 관리하고 진단·상담 목록에 25건 단위 페이지 이동을 추가했습니다.
- 진단 연결 상담은 기존 진단의 리드 연락처를 사용하며 폼에서 이를 안내하고, 독립 상담만 별도 연락처를 저장하도록 클라이언트·검증·API 계약을 통일했습니다.

### 바로 이어서 할 일

1. R1 완료: `.dockerignore`, 런타임 환경 변수 주입 절차 및 이미지 산출물 검증을 반영했습니다.
2. R2 완료: 독립 상담 폼의 빈 진단 ID 정규화와 실제 요청 형태의 회귀 검증을 반영했습니다.
3. R3 완료: 상태 경합, 조건부 실패 전이와 최종 응답 상태를 수정하고 4A 로컬 왕복을 검증했습니다.
4. R4·R5 완료: 관리자 로그인 제한·Argon2id와 개인정보 없는 오류 로그를 적용했습니다.
5. R6 완료: 저장 transaction, 제출 중복 방지 및 로그 저장 실패의 응답 정책을 반영하고 실제 PostgreSQL 재전송을 검증했습니다.
6. R7 완료: 네트워크 오류·비 JSON 응답·timeout 후 상태 복구, 안전 재시도와 결과 polling 상한을 반영했습니다.
7. R8 완료: 관리자 상담 상세·연락처·메모, 진단·상담 페이지 이동과 연결 연락처 정책을 반영했습니다.
8. R9 완료: AI 숫자 타입과 구현 단계 순서를 엄격히 검증하고 callback 422·정상 저장 회귀 테스트를 추가했습니다.
9. R10 완료: 신뢰 프록시 IP 계약, 위조 헤더 차단, 만료 정리, 저장소 상한과 단일 인스턴스 운영 결정을 반영했습니다.
10. 결과 화면(5번) 완료: 공개 DTO 타입과 전체 구조화 결과 표시, 상태·빈 데이터 fallback을 검증했습니다.
11. Telegram 알림(6번) 완료: 진단 최초 완료·신규 상담 알림, timeout, 실패 격리와 중복 방지를 검증했고 실제 Telegram 채널 수신까지 확인했습니다. **다음 항목은 핵심 E2E(7번)입니다.** 실제 AI 연결(4B)은 공개 운영 전에 완료합니다.
12. 운영 이미지(8번)를 검증하고, 운영 환경 준비(9번)와 백업·복원(10번)을 완료한 뒤 공개 운영합니다. 문서 동기화는 각 작업 완료 시 함께 진행합니다.

### 4A 완료 및 재검증 기록

1. **상태 경합 수정 완료:** Webhook이 설정된 경우 n8n 호출 직전에 `SUBMITTED → PROCESSING`으로 전환하고 정상 전달 이후에는 상태를 다시 갱신하지 않습니다.
2. **실패 전이 보호 완료:** Webhook 최종 실패 시 `status = PROCESSING`인 행만 `FAILED`로 변경합니다. callback이 먼저 완료된 경우 `COMPLETED`를 유지하고 제출 API 응답은 DB 최종 조회 상태를 사용합니다.
3. Webhook 미설정, 호출 전 `PROCESSING` 전환, 정상 전달, callback 선완료, 최종 실패 및 callback 선완료 후 Webhook 실패를 단위 테스트로 검증했습니다.
4. 잘못된 `x-webhook-secret`의 401과 정상 진단 제출의 n8n 수신 → callback → DB `COMPLETED` 및 결과 행 저장을 실제 HTTP로 검증했습니다.
5. 검증 후 PostgreSQL, `webagent-n8n`, Next.js 개발 서버를 모두 중지하고 합성 데이터를 삭제했습니다.
6. `task.md`, `README.md`, `AGENTS.md`, 개발실행서, `.env.example`의 구현 현황과 실제 계약을 동기화했습니다.
7. 운영용 실제 AI 모델 연결은 4B로 별도 관리합니다.

4A 재검증용 명령:

```bash
docker compose --profile automation up -d
docker compose --profile automation ps
npm run dev -- --port 3001
# 별도 터미널에서 상태 경합 수정 후
npm run lint
npm run test
npm run build
```

로컬 설정 기준:

- n8n UI/Webhook 호스트 포트: `5679`
- Next.js 개발 서버 포트: `3001`
- workflow ID: `JQYlR9kR0Zx2webA`
- workflow 파일: `docker/n8n/workflows/webagent-diagnosis-local.json`
- 실행 안내: `docker/n8n/README.md`
- `.env`는 Git 제외 상태이며 실제 secret 값은 이 문서에 기록하지 않습니다.

## 권장 작업 순서

기존 단계 번호는 인수인계 참조를 위해 유지합니다. 실제 착수 순서는 위 `바로 이어서 할 일`을 따릅니다.

### 1. 공개 결과 API 개인정보 노출 차단 ✅

- [x] `GET /api/diagnosis/[publicId]`가 DB 객체 전체를 반환하지 않도록 공개 응답 DTO 정의
- [x] 이메일, 전화번호, 담당자 이름, 내부 ID, 원본 응답 등 불필요한 개인정보와 내부 필드 제거
- [x] 결과 화면에 필요한 회사명, 상태, 진단 입력 요약, 공개 가능한 분석 결과만 반환
- [x] 정상 응답과 개인정보 미노출 테스트 추가

완료 조건:

- 공개 ID만으로 이메일, 전화번호 및 내부 식별자를 조회할 수 없습니다.
- 결과 페이지가 제한된 응답 구조로 정상 작동합니다.

### 2. n8n 실패 상태 및 재시도 정책 정리 ✅

- [x] Webhook 최종 실패 시 진단 상태를 `FAILED`로 변경
- [x] `automation_logs.error_message`에 URL·secret을 포함하지 않는 안전한 오류 정보 저장
- [x] Webhook 미설정(`skipped`)과 실제 호출 실패(`failed`)의 사용자 화면 처리 분리
- [x] 관리자 화면에서 실행 로그와 실패 원인 표시
- [x] MVP 재처리는 관리자 확인 후 새 진단 제출로 처리
- [x] `PROCESSING` 상태에서만 결과 페이지가 polling하도록 테스트

완료 조건:

- Webhook 실패 후 결과 페이지가 유한 시간 안에 실패 또는 재처리 안내를 표시합니다.
- 제출 데이터와 실패 로그가 DB에 보존됩니다.

### 3. PostgreSQL 로컬 통합 검증 ✅

- [x] `.env.example`을 기준으로 Git에서 제외되는 로컬 `.env` 구성
- [x] `docker compose up -d`로 PostgreSQL 실행 및 healthy 상태 확인
- [x] `npm run db:migrate` 적용
- [x] `/api/health`의 DB 연결 성공 확인
- [x] 진단 제출과 상담 신청 데이터가 PostgreSQL에 저장되는지 확인
- [x] 관리자 비로그인 차단, 로그인, 조회 및 상태 변경의 실제 DB 반영 확인

완료 조건:

- PostgreSQL 컨테이너가 healthy 상태입니다.
- migration과 핵심 CRUD 흐름이 실제 DB에서 정상 작동합니다.

### 4A. n8n 로컬 분석 전체 왕복 연결 ✅ 핵심 왕복 완료

- [x] n8n 진단 수신 Webhook 생성
- [x] `x-webhook-secret` 검증 설정
- [x] `N8N_DIAGNOSIS_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `INTERNAL_API_SECRET` 로컬 설정
- [x] AI structured output 기본 구조 정의
- [x] R9의 엄격한 숫자 타입과 단계 순서 검증 보완
- [x] AI 결과를 `/api/internal/diagnosis-result`로 callback하는 workflow 구성
- [x] 중복 callback의 upsert 동작 확인
- [x] 잘못된 Webhook secret의 HTTP 401 응답 확인
- [x] 제출 API와 동기 callback 사이의 상태 경합 수정
- [x] callback 선완료 또는 Webhook 실패 시 DB와 제출 API 응답의 최종 상태 일치 확인
- [x] 진단 상태가 `SUBMITTED → PROCESSING → COMPLETED`로 전환되는지 확인

필수 AI 결과 필드:

- `diagnosisPublicId`
- `automationScore`
- `recommendedTasks`
- `estimatedSavedHoursMin`
- `estimatedSavedHoursMax`
- `difficulty`
- `recommendedStack`
- `implementationSteps`
- `aiSummary`
- `modelName`

완료 조건:

- 진단 제출 한 번으로 n8n 수신, 로컬 구조화 분석, 결과 저장 및 결과 페이지 갱신이 완료됩니다.
- callback과 제출 API의 실행 순서가 달라도 `COMPLETED` 상태가 이전 상태로 되돌아가지 않습니다.
- 제출 API가 반환하는 상태와 DB에 저장된 최종 상태가 일치합니다.
- 성공과 실패 실행이 `automation_logs`에서 구분됩니다.

### 4B. 운영용 실제 AI 모델 연결

- [ ] 로컬 결정론적 분석 노드를 OpenAI 또는 Gemini 노드로 교체
- [ ] n8n credential store에 운영용 AI credential 등록
- [ ] 실제 AI 응답이 `lib/validators/diagnosis-result.ts` 계약을 통과하는지 확인
- [ ] invalid structured output의 실패 처리와 로그 확인
- [ ] 실제 모델명과 분석 결과가 callback 및 DB에 저장되는지 확인

완료 조건:

- AI credential이 workflow JSON이나 애플리케이션 환경 변수에 노출되지 않습니다.
- 실제 AI 모델을 사용한 진단 제출이 동일한 structured output 계약으로 완료됩니다.

### 5. 구조화된 진단 결과 화면 완성

- [x] 자동화 점수와 AI 요약 기본 표시
- [x] fetch 또는 JSON 파싱 실패 시 오류 UI와 재시도 동작 추가
- [x] 요청 timeout 및 polling 최대 대기 시간 적용, 장기 대기 시 수동 재조회·상담 안내
- [x] `COMPLETED`이지만 결과가 없는 불일치 상태에서 점수 `0`을 표시하지 않도록 처리
- [x] 예상 절감 시간 표시
- [x] 추천 자동화 업무 표시
- [x] 난이도와 추천 기술 스택 표시
- [x] 구현 단계 표시
- [x] `SUBMITTED`, `PROCESSING`, `COMPLETED`, `FAILED` 상태별 UI 검증
- [x] 빈 배열과 선택 필드 누락 시 fallback UI 추가
- [x] 추천 업무와 구현 단계의 공개 DTO를 구체적인 타입으로 정의

검증 결과:

- 공개 결과 API에서 추천 업무·기술 스택·구현 단계를 기존 callback schema로 재검증하고 유효하지 않은 과거 데이터는 안전한 빈 배열 또는 `null`로 정규화합니다.
- 완료 화면에 자동화 점수, AI 요약, 월 예상 절감 시간, 전체·업무별 난이도, 추천 업무와 이유, 업무별 절감 시간, 기술 스택과 권장 구축 단계를 표시합니다.
- 예상 효과가 입력값 기반 추정치이며 실제 운영 환경에 따라 달라질 수 있음을 안내합니다.
- 네 가지 진단 상태 문구와 장기 대기 상태, 전체 결과 필드 렌더링, 빈 배열·선택 필드 fallback을 단위 검증했습니다.
- 전체 ESLint, Vitest 17개 파일·105개 테스트와 Next.js webpack production build가 통과했습니다.

완료 조건:

- 저장된 structured output의 사용자용 필드가 읽기 쉬운 형태로 모두 표시됩니다.
- 네트워크 오류, 잘못된 응답 및 결과 불일치 상태에서 무한 loading이나 오해를 일으키는 기본 점수가 표시되지 않습니다.

### 6. Telegram 관리자 알림 구현

- [x] `.env.example`에 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 추가
- [x] 서버 전용 Telegram 알림 모듈 구현
- [x] 진단 완료 알림 연결
- [x] 상담 신청 알림 연결
- [x] 회사명, 담당자, 이메일, 관리자 또는 진단 결과 링크 포함
- [x] Telegram 실패가 진단 및 상담 저장을 취소하지 않도록 처리
- [x] 실패 로그 및 테스트 추가
- [x] 로컬 `.env`에서 Bot token과 chat ID 로드 확인
- [x] 실제 Telegram 채널 메시지 수신 확인

검증 결과:

- Bot API 요청은 5초 timeout과 일반 텍스트 메시지를 사용하며 설정 누락은 `skipped`로 처리합니다.
- 진단 상태가 처음 `COMPLETED`로 바뀐 callback에만 완료 알림을 보내 중복 callback 알림을 방지합니다.
- 신규 상담 저장 뒤 기존 진단 또는 독립 상담의 실제 연락처와 관리자 상세 링크를 보내며 멱등 재전송은 알림을 다시 보내지 않습니다.
- Telegram HTTP 실패와 예외는 token·응답 원문 없이 이벤트명과 내부 ID만 안전하게 기록하고 API 성공 응답을 유지합니다.
- 전체 ESLint, Vitest 18개 파일·112개 테스트와 Next.js webpack production build가 통과했습니다.
- 2026-09-09에 교체한 Bot token으로 `getMe`가 성공했고, 실제 진단 callback·상담 제출 후 운영 채널에 두 종류의 메시지가 도착한 것을 확인했습니다. 같은 멱등 키 재전송은 기존 ID를 반환했고 DB에 중복 행을 만들지 않았습니다.

완료 조건:

- 진단 완료와 상담 신청 시 운영 채널에 알림이 도착합니다.
- 알림 장애가 핵심 데이터 저장 흐름에 영향을 주지 않습니다.

### 7. 핵심 통합 및 E2E 테스트 추가

- [ ] 진단 제출 → PostgreSQL 저장 → n8n 호출
- [ ] 필수값 누락, 잘못된 이메일, 동의 거부 검증
- [ ] n8n 실패 시 데이터 및 로그 보존
- [ ] AI callback → 결과 upsert → `COMPLETED` 전환
- [ ] 공개 결과 API 개인정보 미노출
- [ ] 상담 신청 → DB 저장 → Telegram 알림
- [ ] 관리자 비로그인 차단, 로그인 성공·실패
- [ ] 관리자 진단·상담 조회 및 상태 변경
- [x] 독립 상담의 빈 진단 ID와 실제 폼 요청 payload 검증
- [ ] callback 선완료 및 Webhook 실패 경합에서 완료 상태 보존
- [ ] 부분 저장 실패 rollback, 같은 제출 재전송의 중복 방지
- [ ] 진단·상담·로그인·결과 조회의 연결 단절 및 비 JSON 응답 복구
- [x] AI 숫자 null과 단계 순서 중복·누락 거부
- [ ] 관리자 로그인 반복 시도 제한 및 DB 오류 로그 개인정보 미노출

완료 조건:

- 실제 사용자 핵심 흐름을 자동 테스트로 반복 검증할 수 있습니다.
- 외부 서비스는 테스트 환경에서 예측 가능한 mock 또는 test endpoint를 사용합니다.

### 8. Production Docker image 검증

- [x] R1의 빌드 환경 파일 제외와 최종 산출물 검사 완료
- [ ] 운영 Compose에 앱 서비스, runtime 환경 변수 주입, 내부 DB 연결과 앱 healthcheck 구성
- [x] production image build
- [ ] 컨테이너에서 Next.js standalone 서버 실행
- [ ] 환경 변수 주입과 DB 내부 네트워크 연결 확인
- [ ] `/` 및 `/api/health` HTTP 응답 확인
- [ ] 컨테이너 재시작 후 정상 복구 확인
- [ ] PostgreSQL 포트가 외부에 공개되지 않는지 확인

완료 조건:

- 새 환경에서 Docker 구성만으로 앱과 DB를 재현할 수 있습니다.
- 앱 healthcheck와 DB healthcheck가 모두 정상입니다.
- 최종 이미지에 실제 `.env`와 개발용 파일이 포함되지 않습니다.

### 9. 운영 환경 및 도메인 배포

- [ ] production `.env`를 저장소 외부에서 안전하게 관리
- [ ] 운영용 `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` 설정
- [ ] Nginx Proxy Manager reverse proxy 구성
- [ ] Cloudflare DNS 연결
- [ ] HTTPS/SSL 적용 및 자동 갱신 확인
- [ ] `webagent.kr` 공개 접속 확인
- [ ] 관리자 경로 검색 엔진 차단 및 접근 제어 재확인
- [ ] 공개 운영 전 R4·R5·R10의 인증·로그·프록시 IP 처리 검증
- [ ] 실제 AI 연결, 관리자 알림 및 백업·복원 검증 완료 확인

완료 조건:

- HTTPS로 공개 페이지와 관리자 페이지에 정상 접근할 수 있습니다.
- 비밀값과 PostgreSQL 포트가 외부에 노출되지 않습니다.

### 10. DB 자동 백업 및 복원 검증

- [ ] 매일 `pg_dump` 백업 스크립트 작성
- [ ] VPS 외부 저장소로 백업 전송
- [ ] 일간 7일, 주간 4주, 월간 6개월 보관 정책 적용
- [ ] 백업 실패 Telegram 알림 연결
- [ ] 복원 절차 문서화
- [ ] 별도 DB에서 실제 복원 테스트
- [ ] 월 1회 복원 테스트 결과 기록 방식 마련

완료 조건:

- 자동 백업 파일이 외부 저장소에 생성됩니다.
- 문서만 보고 새로운 PostgreSQL 인스턴스로 데이터를 복원할 수 있습니다.

## 전체 프로젝트 검토 및 개선 작업 (2026-09-07)

검토 결론: MVP 기본 구조는 갖췄고 R1~R10은 수정과 검증을 완료했습니다. 공개 운영 전 결과 표시, 외부 연동, E2E와 배포·백업 준비가 남아 있습니다.

### 검증 근거와 범위

- 이번 전체 검토에서 ESLint와 Vitest 10개 파일·35개 테스트가 통과했습니다. production build 통과는 같은 날 앞선 검토의 결과입니다.
- 합성 입력으로 독립 상담의 빈 진단 ID 거부, AI 숫자 `null`의 `0` 변환, 단계 순서 `[2, 2]` 허용을 재현했습니다.
- 합성 요청에서 `x-forwarded-for` 변경 시 별도 rate limit 버킷이 적용되는 것을 확인했습니다. 실제 우회 가능성은 배포 프록시의 헤더 정리 정책에 따라 달라집니다.
- 합성 DB 오류 메시지에 쿼리 매개변수의 이메일이 포함되는 것을 설치된 Drizzle 코드와 실행으로 확인했습니다.
- R1 수정 전 로컬 `.next/standalone/.env`의 존재와 로컬 `.env`와의 내용 일치를 확인했습니다. 실제 값은 출력하거나 문서에 저장하지 않았습니다.
- R1 수정 후 `webagent:r1-verify` 이미지를 새로 빌드했습니다. 이미지 내부에 `.env*`, `.git`, `task.md`, `AGENTS.md`가 없고 런타임 환경 변수 주입이 작동하는 것을 종료 코드로 확인했습니다. 이미지 기본 환경에는 Node·Next 런타임 설정만 있으며 프로젝트 secret은 없었습니다.
- Docker Compose 실행 목록은 비어 있었습니다. 이번 전체 검토에서 실제 PostgreSQL·n8n 왕복과 브라우저 E2E는 재검증하지 않았습니다.
- 전체 검토 당시 35개 테스트에는 실제 폼의 빈 진단 ID, callback 선완료, 로그인 제한과 개인정보 없는 오류 로그 사례가 없었습니다. R2~R5에서 49개, R6에서 55개, R7에서 63개, R8에서 77개, R9에서 89개, R10의 rate limit 검증을 더해 현재 97개가 통과합니다.

### R1. [높음] 빌드 산출물의 환경 파일 포함 ✅

수정 전 근거: [Dockerfile](Dockerfile)은 `COPY . .`와 standalone 전체 복사를 사용하며 `.dockerignore`가 없었습니다. 당시 로컬 standalone에 `.env`가 그대로 존재했고 로컬 `node_modules`와 `.next`도 Docker 빌드 컨텍스트에 포함됐습니다.

- [x] `.dockerignore`에 실제 환경 파일, `node_modules`, `.next`, `.git` 등 개발용 파일 제외 규칙 추가
- [x] 환경 파일 없는 빌드와 실행 시 런타임 환경 변수 주입 절차 확립
- [x] 새 standalone 기반 최종 이미지에 실제 환경 파일이 없는지 검사

검증 결과:

- `docker build --tag webagent:r1-verify .` 성공
- Docker 빌드 컨텍스트 약 1.4MB로 축소
- 최종 이미지에서 `.env`, `.env.*`, `.git`, `task.md`, `AGENTS.md` 부재 확인
- `docker run --env ...` 방식의 런타임 환경 변수 주입 확인
- 이미지 기본 환경 변수에 프로젝트 secret이 없음을 확인

완료 조건: 빌드와 이미지에 실제 시크릿 파일이 포함되지 않고, 실행 시 주입된 설정으로 정상 동작합니다.

### R2. [높음] 독립 상담 신청 실패 ✅

수정 전 근거: [상담 폼](components/consultation/consultation-form.tsx)은 `diagnosisPublicId: ""`를 전송했지만 [스키마](lib/validators/consultation.ts)는 UUID 또는 필드 생략만 허용했습니다. 빈 문자열 실패·필드 생략 성공을 재현했습니다.

- [x] 폼과 서버 경계에서 빈 진단 ID를 선택 필드로 정규화
- [x] 진단 없이 회사명·담당자·이메일·동의를 입력한 실제 요청 형태로 회귀 검증
- [x] 유효하지 않은 비어 있지 않은 ID와 존재하지 않는 진단 ID 거부 유지

검증 결과:

- 상담 관련 테스트 2개 파일·8개 및 전체 11개 파일·39개 테스트 통과
- 빈 진단 ID를 포함한 독립 상담 실제 HTTP 요청이 PostgreSQL에 저장되고 201을 반환
- 잘못된 형식의 ID는 422, 존재하지 않는 정상 형식 UUID는 404 반환
- ESLint 및 Next.js production build 통과

완료 조건: `/consultation` 직접 방문으로 신청한 상담이 정상 저장되고 잘못된 진단 연결은 거부됩니다.

### R3. [높음] callback과 진단 제출 상태 경합 ✅

수정 전 근거: [진단 제출 API](app/api/diagnosis/route.ts)는 n8n 호출 이후 상태를 덮어써 callback 선완료 후 `COMPLETED → PROCESSING` 또는 `FAILED` 전이가 가능했습니다.

- [x] 4A 재개 절차의 호출 전 상태 전환과 조건부 실패 갱신 구현
- [x] 제출 응답이 서버의 최종 조회 시점 상태를 반영하도록 처리
- [x] 정상 전달, 미설정, callback 선완료, 선완료 후 전달 실패를 회귀 검증

검증 결과:

- Webhook 설정 시 `SUBMITTED` 조건으로 `PROCESSING`을 기록한 뒤 n8n을 호출
- 최종 전달 실패 시 `PROCESSING` 조건으로만 `FAILED`를 기록
- callback 선완료 성공·실패 테스트에서 `COMPLETED` 응답과 상태 보존 확인
- 실제 n8n 요청에서 잘못된 secret 401, 정상 제출 `delivered`, callback 200 확인
- 실제 제출 응답·DB·공개 결과 API 모두 `COMPLETED`, 결과 행 1개 및 automation log `delivered` 확인
- 전체 11개 파일·41개 테스트, ESLint 및 production build 통과

완료 조건: 제출 API가 완료 상태를 되돌리지 않습니다. 응답 직후 비동기 callback으로 상태가 더 진행되는 정상 동작은 허용합니다.

### R4. [높음] 관리자 인증 방어 부족 ✅

수정 전 근거: [로그인 API](app/api/admin/login/route.ts)에 반복 시도 제한이 없었고, [인증 모듈](lib/auth/admin.ts)은 salt 없는 SHA-256 비밀번호 해시를 사용했습니다.

- [x] 관리자 로그인 시도 제한과 성공 시 제한 초기화 구현
- [x] Argon2id 비밀번호 해시로 전환하고 해시 생성·설정 안내 갱신
- [x] 정상·잘못된 자격 증명, 반복 실패 및 설정 누락 검증

검증 결과:

- Argon2id `m=19456`, `t=2`, `p=1`과 무작위 salt 적용
- 기존 `sha256:...` 설정 거부와 `npm run auth:hash-password` 생성 명령 확인
- production Alpine 이미지에서 Argon2id 해시·검증 성공
- 실제 HTTP에서 동일 IP 1~5회 실패 401, 6회 429, 별도 IP 정상 로그인 200 확인
- 현재 로컬 `.env`의 해시는 기존 형식이므로 실제 관리자 비밀번호로 새 Argon2id 해시를 생성해 교체해야 함

완료 조건: 로그인 반복 시도가 제한되고, 새 비밀번호 저장·검증 방식으로 인증이 정상 동작합니다.

### R5. [높음] DB 오류 로그의 개인정보 노출 ✅

수정 전 근거: [진단 API](app/api/diagnosis/route.ts), [상담 API](app/api/consultation/route.ts), [결과 callback API](app/api/internal/diagnosis-result/route.ts)가 DB 오류 객체 전체를 출력했습니다. Drizzle 오류는 쿼리 매개변수를 포함할 수 있습니다.

- [x] 요청 식별자·이벤트명·허용된 오류 코드 중심의 공통 오류 로깅 구현
- [x] SQL 매개변수, 연락처, 진단 원문, secret 및 stack trace 출력 제거
- [x] 합성 개인정보가 포함된 저장 실패에서 로그 미노출 테스트

검증 결과:

- 진단 제출·조회, 상담 제출, callback과 health 오류 출력을 공통 안전 로거로 통합
- 서버 오류 응답에 로그와 연결되는 `x-request-id` 헤더 추가
- 합성 Drizzle 쿼리 오류에서 이메일, 전화번호, SQL, 내부 원인 메시지 미출력 확인
- R5 완료 당시 관련 5개 파일·21개 테스트와 전체 12개 파일·49개 테스트 통과

완료 조건: 저장 실패를 추적할 수 있고 로그에는 개인정보·시크릿·원문 쿼리 매개변수가 남지 않습니다.

### R6. [중간] 부분 저장과 중복 제출 ✅

근거: 진단과 독립 상담의 lead·하위 레코드 저장이 transaction으로 묶여 있지 않습니다. 진단 저장 후 실행 로그 저장이 실패하면 500을 반환하며, 재제출 중복 방지 장치도 없습니다.

- [x] lead·diagnosis 및 독립 상담의 lead·consultation 저장을 각각 transaction으로 처리
- [x] DB transaction 밖에서 외부 n8n 호출 수행
- [x] 제출 중복 방지 키와 동일 요청 재전송 시 기존 결과 반환 정책 구현
- [x] 핵심 저장 성공 후 실행 로그 저장 실패의 응답·복구 정책 정의

검증 결과:

- 기존 행을 안전하게 백필하는 migration을 실제 PostgreSQL에 적용했습니다.
- 진단과 독립 상담을 각각 같은 `Idempotency-Key`로 두 번 전송해 최초 201, 재전송 200과 동일 리소스 ID를 확인했습니다.
- DB에서 각 키당 하위 레코드가 1행만 존재하고 검증용 합성 데이터 정리 후 컨테이너가 종료된 것을 확인했습니다.
- 같은 키의 다른 요청 409, concurrent unique 충돌 복구, transaction 선완료 후 n8n 호출, 로그 저장 실패 시 성공 유지 정책을 단위 테스트로 검증했습니다.

완료 조건: 중간 실패가 고립된 lead를 남기지 않고, 동일 요청 재전송이 새 진단·상담을 중복 생성하지 않습니다.

### R7. [중간] 네트워크 오류 후 화면 복구 실패 ✅

근거: 진단·상담·관리자 로그인과 결과 조회에 fetch 예외 처리가 없습니다. 오류 후 제출 버튼 비활성화나 loading이 지속될 수 있습니다. 결과 polling에 대기 상한이 없고 결과 없는 완료 상태는 0점으로 표시됩니다.

- [x] 관련 폼·결과 조회의 예외 처리, 요청 timeout, 재시도와 상태 복구 구현
- [x] 결과 polling의 최대 대기 시간과 장기 대기 안내 추가
- [x] 결과 없는 완료 상태를 유효한 0점과 구분
- [x] 관련 파일: `components/diagnosis/`, `components/consultation/consultation-form.tsx`, `components/admin/login-form.tsx`의 오류 사례 검증

검증 결과:

- 공통 클라이언트 요청 경계에서 네트워크 실패, 502·503·504, timeout과 비 JSON 응답을 안전한 사용자 메시지로 처리합니다.
- 멱등 키가 있는 진단·상담 POST와 읽기 전용 결과 GET은 1회 재시도하고, 로그인 POST는 반복 시도 제한을 왜곡하지 않도록 자동 재시도하지 않습니다.
- 결과 조회는 5초 간격으로 최대 2분 polling한 뒤 자동 확인을 멈추고 수동 재확인 안내를 표시합니다.
- `COMPLETED`이지만 결과가 없으면 0점 대신 데이터 준비 불일치 안내를 표시합니다.

완료 조건: 연결 단절·비 JSON 응답 후 사용자가 재시도할 수 있고 잘못된 점수나 무한 대기가 표시되지 않습니다. 결과 표시 확장은 5번에서 진행합니다.

### R8. [중간] 관리자 상담 후속 업무 정보 부족 ✅

근거: [상담 목록](app/admin/consultations/page.tsx)에 연락처·요청 내용·희망 일정과 상세 링크가 없습니다. 진단·상담 목록 모두 최근 50건만 표시합니다. 진단 연결 상담에서는 새로 입력한 연락처를 저장하지 않습니다.

- [x] 상담 상세와 이메일·전화번호·요청 내용·희망 일정 표시
- [x] 진단·상담 목록의 페이지 이동 구현
- [x] 상담 메모 조회·편집 구현
- [x] 진단 연결 시 기존 연락처 사용 또는 별도 연락처 저장 정책을 확정하고 폼과 API에 일관되게 반영

검증 결과:

- 상담 상세에서 상태와 5,000자 이내 관리자 메모를 저장하고 목록·상세 cache를 함께 갱신합니다.
- 진단·상담 목록은 총 행 수를 기준으로 25건씩 조회하며 잘못된 페이지 값과 범위 초과를 안전하게 정규화합니다.
- 상담 목록과 진단 상세에서 상담 상세로 이동할 수 있고, 상담 상세에서 연결 진단으로 이동할 수 있습니다.
- 진단 연결 상담은 기존 lead를 사용하고 독립 상담만 새 lead를 만들며 API 응답의 `contactSource`로 정책을 구분합니다.

완료 조건: 관리자가 오래된 상담까지 찾아 연락·일정 조율·메모 기록을 할 수 있고, 입력한 연락처가 설명 없이 무시되지 않습니다.

### R9. [중간] AI 숫자와 단계 순서 검증 불충분 ✅

근거: [AI 결과 스키마](lib/validators/diagnosis-result.ts)의 숫자 coercion이 `null`을 0으로 허용하며 단계 순서 `[2, 2]`도 통과합니다.

- [x] AI 숫자 입력을 JSON number로 한정하고 null·빈 문자열·boolean의 숫자 변환 차단
- [x] 구현 단계의 1부터 시작하는 순서, 중복·누락 검사
- [x] 잘못된 payload 거부와 정상 결과 저장 회귀 검증

검증 결과:

- 점수, 추천 업무별 절감 시간, 전체 절감 시간 범위와 구현 단계 순서에 `z.number()`를 적용해 암묵적 형 변환을 제거했습니다.
- 구현 단계의 각 `order`가 배열 위치에 따라 정확히 1부터 연속되는지 검사합니다.
- `null`·빈 문자열·boolean, 시작값 오류, 중복·누락·역순을 단위 테스트로 거부하고 callback API의 422와 정상 transaction 저장을 회귀 검증했습니다.
- 전체 ESLint, Vitest 16개 파일·89개 테스트와 Next.js webpack production build가 통과했습니다.

완료 조건: 잘못된 숫자가 유효한 0으로 저장되지 않고 단계 순서가 검증됩니다. 4A·4B의 공통 callback 계약에 적용합니다.

### R10. [중간] rate limit의 IP 신뢰 및 저장소 관리 ✅

근거: [rate limit](lib/security/rate-limit.ts)은 `x-forwarded-for` 첫 값을 신뢰하며 만료된 Map 항목을 삭제하지 않습니다. 프록시가 헤더를 정리하지 않으면 헤더 변경으로 다른 버킷을 사용할 수 있습니다.

- [x] 운영 프록시에서 신뢰할 수 있는 클라이언트 IP 전달 규칙과 앱 직접 접근 제한 확정
- [x] 만료 버킷 정리와 저장소 크기 제한 적용
- [x] 다중 인스턴스 운영 시 제한 공유 방식 결정
- [x] 위조 전달 헤더, 만료와 로그인·공개 API 제한 동작 검증

검증 결과:

- `RATE_LIMIT_TRUST_PROXY=true`일 때만 유효한 단일 `X-Real-IP`를 사용하며 `X-Forwarded-For`는 항상 무시합니다. 기본값과 잘못된 IP는 공유 fail-closed 버킷을 사용합니다.
- IPv6 주소를 정규화하고 60초 주기로 만료 항목을 삭제하며, 활성 항목 10,000개 도달 시 새 키를 거부해 메모리 증가를 제한합니다.
- 관리자 로그인과 공개 제출 API가 제한 시 429와 `Retry-After`를 반환하는지 확인했습니다.
- `docker/nginx-proxy-manager.md`에 Cloudflare 신뢰 대역, 전달 헤더 덮어쓰기와 앱 포트 직접 접근 차단 계약을 문서화했습니다.
- MVP는 단일 앱 인스턴스로 운영하고 다중 인스턴스 전환 전에 Redis 원자 카운터·TTL 기반 공유 저장소로 교체하기로 결정했습니다.
- 전체 ESLint, Vitest 16개 파일·97개 테스트와 Next.js webpack production build가 통과했습니다.

완료 조건: 배포 경로에서 클라이언트가 제한 키를 임의로 바꿀 수 없고 만료 항목이 무한히 쌓이지 않습니다.

### 추가 출시 보완 및 문서 동기화

- [ ] 동의 시각·정책 버전 저장과 개인정보처리방침의 실제 문의 주소 제공
- [ ] 입력 문자열·배열·요청 크기 상한 설정
- [x] 추천 업무·절감 시간·기술 스택·구현 단계 표시 (5번)
- [ ] 실제 AI 연결(4B), 운영 앱 Compose(8번), 백업·복원(10번) 완료 (Telegram 6번은 완료)
- [ ] `README.md`, `AGENTS.md`, `docs/consolidated/03-PostgreSQL_MVP_개발실행서.md`, `.env.example`의 테스트 현황·환경 변수명·인증 방식·포트 안내를 실제 코드와 동기화
- [ ] 실제 브라우저 요청 형태, DB 실패·중복 제출·callback 경합을 통합/E2E로 검증 (7번)

참고 근거: [Docker 빌드 제외 파일](https://docs.docker.com/build/concepts/context/#dockerignore-files), [OWASP 비밀번호 저장 지침](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## 공통 검증 명령

각 단계가 끝날 때 다음 명령을 실행합니다.

```bash
npm run lint
npm run test
npm run build
```

DB 또는 외부 연동을 변경한 경우 다음 항목도 확인합니다.

```bash
docker compose --profile automation ps
npm run db:migrate
curl http://localhost:3001/api/health
```

## MVP 최종 완료 조건

- [ ] R1~R10 개선 작업과 추가 출시 보완 완료
- [x] 공개 결과 API에서 개인정보가 노출되지 않음
- [x] 실제 n8n Webhook 및 로컬 분석 callback 왕복 성공
- [x] structured output 저장과 결과 페이지 표시 성공
- [x] 상담 신청과 Telegram 알림 성공
- [x] 관리자 인증, 조회 및 상태 변경 검증
- [ ] production Docker image 실행 성공
- [ ] `webagent.kr` HTTPS 연결
- [ ] PostgreSQL 외부 비공개
- [ ] 자동 백업과 실제 복원 검증
- [ ] 핵심 E2E 테스트 통과
- [x] lint, Vitest 112개, production build 통과 (2026-09-09 재검증)
