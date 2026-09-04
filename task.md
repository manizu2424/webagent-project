# WEBAGENT.KR MVP 작업 목록

최종 업데이트: 2026-09-04

이 문서는 현재 구현 상태를 기준으로 남은 작업의 우선순위와 완료 조건을 관리합니다. 제품 범위와 기술 기준은 `README.md` 및 `docs/consolidated/` 문서를 따릅니다.

## 현재 상태

- [x] Next.js App Router, TypeScript, Tailwind CSS 프로젝트 구성
- [x] 랜딩 페이지와 5단계 진단 폼
- [x] PostgreSQL 및 Drizzle schema/migration
- [x] 진단 제출, 결과 조회, 상담 신청 API
- [x] n8n Webhook 호출 모듈과 내부 결과 callback API
- [x] 관리자 인증, 진단·상담 조회 및 상태 변경
- [x] 개인정보처리방침, rate limit, 보안 헤더, 오류 화면
- [x] ESLint 통과
- [x] Vitest 35개 테스트 통과
- [x] Next.js production build 통과
- [x] 실제 PostgreSQL 로컬 저장 및 관리자 흐름 검증
- [ ] 실제 n8n 전체 흐름 검증
- [ ] Telegram 관리자 알림
- [ ] 운영 배포, 백업 및 복원 검증
- [ ] 핵심 E2E 테스트

## 다음 재개 지점 (인수인계)

> **현재 위치: 4번 `n8n 및 AI 분석 전체 왕복 연결` 진행 중**  
> 다음 작업은 아래 1번부터 시작합니다. 1~3번 작업은 완료되어 다시 구현할 필요가 없습니다.

### 지금까지 반영된 내용

- 공개 진단 결과 API를 공개용 DTO로 제한해 이메일, 전화번호, 담당자, 내부 ID 및 원본 AI 응답이 노출되지 않도록 했습니다.
- n8n 전달 실패 시 `FAILED`, Webhook 미설정 시 `SUBMITTED`, 정상 전달 시 `PROCESSING`으로 구분하고 결과 화면 polling을 `PROCESSING`에만 적용했습니다.
- 실제 로컬 PostgreSQL에서 migration, 진단 제출, 상담 신청, 관리자 로그인·조회·상태 변경을 검증했습니다.
- AI callback payload의 배열·객체 구조, 글자 수, 숫자 범위와 단계 순서를 Zod schema로 확정했습니다.
- callback의 결과 upsert와 진단 `COMPLETED` 변경을 하나의 DB transaction으로 묶었습니다.
- 같은 진단에 callback을 두 번 보내 결과 행이 하나만 유지되는 upsert를 실제 DB에서 확인했습니다.
- 프로젝트 전용 n8n 2.37.10 컨테이너, Webhook secret 검사, 로컬 구조화 분석 및 callback 워크플로를 추가·import·publish했습니다.
- 로컬 n8n은 외부 AI 대신 결정론적 분석 노드를 사용합니다. 운영 전 OpenAI/Gemini 노드와 n8n credential 연결이 별도로 필요합니다.

### 바로 이어서 할 일

1. **상태 경합 수정:** 현재 n8n이 동기 callback을 완료한 뒤 진단 제출 API가 `PROCESSING`을 기록하면 `COMPLETED`가 되돌아갈 수 있습니다. `app/api/diagnosis/route.ts`에서 n8n 호출 전에 `PROCESSING`으로 전환하고, callback 이후에는 상태를 덮어쓰지 않도록 수정합니다. 실패 갱신도 이미 `COMPLETED`인 행을 덮어쓰지 않게 보호합니다.
2. 관련 단위 테스트를 갱신해 정상 전달, callback 선완료, 최종 실패의 상태 전이를 검증합니다.
3. 테스트 종료 후 PostgreSQL과 `webagent-n8n`은 의도적으로 중지했습니다. `docker compose --profile automation up -d`로 다시 시작하고 healthy 상태를 확인합니다.
4. Next.js 개발 서버도 중지했습니다. 로컬 n8n callback URL과 일치하는 `3001` 포트로 다시 실행합니다.
5. 잘못된 `x-webhook-secret` 요청이 401인지 확인하고, 정상 진단 제출 한 번으로 n8n 수신 → callback → DB `COMPLETED`까지 왕복 검증합니다.
6. 왕복 성공 후 4번 작업을 완료 처리하고 5번 결과 화면 작업으로 이동합니다.

재개용 명령:

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

### 4. n8n 및 AI 분석 전체 왕복 연결 🚧 진행 중

- [x] n8n 진단 수신 Webhook 생성
- [x] `x-webhook-secret` 검증 설정
- [x] `N8N_DIAGNOSIS_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `INTERNAL_API_SECRET` 로컬 설정
- [x] AI structured output schema 확정
- [x] AI 결과를 `/api/internal/diagnosis-result`로 callback하는 workflow 구성
- [x] 중복 callback의 upsert 동작 확인
- [ ] 잘못된 Webhook secret의 HTTP 401 응답 확인
- [ ] 제출 API와 동기 callback 사이의 상태 경합 수정
- [ ] 진단 상태가 `SUBMITTED → PROCESSING → COMPLETED`로 전환되는지 확인
- [ ] 운영용 실제 AI 모델과 n8n credential 연결

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

- 진단 제출 한 번으로 n8n 수신, AI 분석, 결과 저장 및 결과 페이지 갱신이 완료됩니다.
- 성공과 실패 실행이 `automation_logs`에서 구분됩니다.

### 5. 구조화된 진단 결과 화면 완성

- [ ] 자동화 점수와 AI 요약 표시
- [ ] 예상 절감 시간 표시
- [ ] 추천 자동화 업무 표시
- [ ] 난이도와 추천 기술 스택 표시
- [ ] 구현 단계 표시
- [ ] `SUBMITTED`, `PROCESSING`, `COMPLETED`, `FAILED` 상태별 UI 검증
- [ ] 빈 배열과 선택 필드 누락 시 fallback UI 추가

완료 조건:

- 저장된 structured output의 사용자용 필드가 읽기 쉬운 형태로 모두 표시됩니다.
- 모든 처리 상태에서 잘못된 빈 결과나 무한 loading이 발생하지 않습니다.

### 6. Telegram 관리자 알림 구현

- [ ] `.env.example`에 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 추가
- [ ] 서버 전용 Telegram 알림 모듈 구현
- [ ] 진단 완료 알림 연결
- [ ] 상담 신청 알림 연결
- [ ] 회사명, 담당자, 이메일, 관리자 또는 진단 결과 링크 포함
- [ ] Telegram 실패가 진단 및 상담 저장을 취소하지 않도록 처리
- [ ] 실패 로그 및 테스트 추가

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

완료 조건:

- 실제 사용자 핵심 흐름을 자동 테스트로 반복 검증할 수 있습니다.
- 외부 서비스는 테스트 환경에서 예측 가능한 mock 또는 test endpoint를 사용합니다.

### 8. Production Docker image 검증

- [ ] production image build
- [ ] 컨테이너에서 Next.js standalone 서버 실행
- [ ] 환경 변수 주입과 DB 내부 네트워크 연결 확인
- [ ] `/` 및 `/api/health` HTTP 응답 확인
- [ ] 컨테이너 재시작 후 정상 복구 확인
- [ ] PostgreSQL 포트가 외부에 공개되지 않는지 확인

완료 조건:

- 새 환경에서 Docker 구성만으로 앱과 DB를 재현할 수 있습니다.
- 앱 healthcheck와 DB healthcheck가 모두 정상입니다.

### 9. 운영 환경 및 도메인 배포

- [ ] production `.env`를 저장소 외부에서 안전하게 관리
- [ ] 운영용 `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` 설정
- [ ] Nginx Proxy Manager reverse proxy 구성
- [ ] Cloudflare DNS 연결
- [ ] HTTPS/SSL 적용 및 자동 갱신 확인
- [ ] `webagent.kr` 공개 접속 확인
- [ ] 관리자 경로 검색 엔진 차단 및 접근 제어 재확인

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

## 공통 검증 명령

각 단계가 끝날 때 다음 명령을 실행합니다.

```bash
npm run lint
npm run test
npm run build
```

DB 또는 외부 연동을 변경한 경우 다음 항목도 확인합니다.

```bash
docker compose ps
npm run db:migrate
curl http://localhost:3000/api/health
```

## MVP 최종 완료 조건

- [x] 공개 결과 API에서 개인정보가 노출되지 않음
- [ ] 실제 n8n Webhook 및 AI callback 왕복 성공
- [ ] structured output 저장과 결과 페이지 표시 성공
- [ ] 상담 신청과 Telegram 알림 성공
- [ ] 관리자 인증, 조회 및 상태 변경 검증
- [ ] production Docker image 실행 성공
- [ ] `webagent.kr` HTTPS 연결
- [ ] PostgreSQL 외부 비공개
- [ ] 자동 백업과 실제 복원 검증
- [ ] 핵심 E2E 테스트 통과
- [ ] lint, test, build 통과
