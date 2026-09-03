# WEBAGENT.KR PostgreSQL MVP 개발 실행서

## 1. 역할과 우선순위

이 문서는 현재 채택된 자체 PostgreSQL 방식의 구현 계약이다. 제품 목적과 카피는 `01-MVP_통합_제품기획서.md`, DB 대안과 선택 근거는 `02-데이터베이스_아키텍처_선택지.md`를 참조한다.

핵심 구현 흐름은 다음과 같다.

```text
진단 폼 → Next.js API → PostgreSQL 저장 → n8n Webhook
→ AI 구조화 분석 → 내부 결과 API → PostgreSQL 결과 저장
→ 결과 페이지 → 상담 신청 → 관리자 확인
```

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 앱 | Next.js App Router, React, TypeScript strict |
| UI·폼 | Tailwind CSS, shadcn/ui, React Hook Form |
| 검증 | Zod |
| DB·ORM | PostgreSQL, Drizzle ORM, migration |
| 관리자 인증 | Auth.js Credentials 또는 안전한 서버 세션, 단일 관리자 |
| 자동화·AI | n8n에서 OpenAI 또는 Gemini 호출 |
| 알림·메일 | Telegram Bot, Resend 또는 SMTP |
| 인프라 | Contabo, Docker Compose, Nginx Proxy Manager, Cloudflare |

## 3. 시스템 경계

- Next.js는 외부 입력 검증, 원본 저장, n8n 호출, 공개 결과 조회, 상담 저장을 담당한다.
- n8n은 AI 호출, 결과 검증 전 전달, Telegram과 선택적 이메일을 담당한다.
- AI 제공자 키는 브라우저와 Next.js Client Component에 노출하지 않는다.
- n8n 호출 실패가 이미 저장된 진단 원본을 유실시키면 안 된다.
- 결과 저장 API는 내부 키를 검증하고 AI 출력을 다시 Zod로 검증한다.
- 공개 결과 응답에는 이름, 이메일, 전화번호, 내부 ID, 원본 프롬프트를 포함하지 않는다.

## 4. 필수 환경 변수

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://webagent_user:change_me@webagent-db:5432/webagent
POSTGRES_DB=webagent
POSTGRES_USER=webagent_user
POSTGRES_PASSWORD=change_me
INTERNAL_API_KEY=change_to_long_random_secret
N8N_DIAGNOSIS_WEBHOOK_URL=https://n8n.example.com/webhook/webagent-diagnosis
N8N_WEBHOOK_SECRET=change_to_long_random_secret
AUTH_SECRET=change_to_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
RESEND_API_KEY=
EMAIL_FROM=
```

실제 `.env*`, API 키, 토큰, 평문 관리자 비밀번호는 커밋하지 않는다. 시작 시 필수 환경 변수를 검증하고 누락되면 명확하게 실패한다.

## 5. 데이터 계약

### `leads`

회사명, 업종, 직원 수, 담당자 이름, 이메일, 선택적 전화번호, 상담 방식, 생성·수정 시각을 저장한다.

### `diagnoses`

`lead_id`, 무작위 `public_id`, 홈페이지 유무, 사용 도구, 반복 업무, 하루 시간, 월 처리량, 문제점, 예산 범위, 개인정보 동의 시각, 처리 상태, 생성·수정 시각을 저장한다.

### `diagnosis_results`

진단과 1:1 관계를 유지하며 점수, 추천 업무, 월 절감 시간 범위, 난이도, 추천 스택, 구축 단계, 요약, 모델·분석 시각을 저장한다.

### `consultations`

`lead_id`, 선택적 `diagnosis_id`, 상담 유형, 희망 일자, 메시지, 영업 상태, 관리자 메모, 생성·수정 시각을 저장한다.

### `automation_logs`

진단 ID, 이벤트명, 상태, 오류 코드, 시도 횟수, 처리 시간을 저장한다. 연락처나 진단 원문은 기록하지 않는다.

모든 스키마 변경은 Drizzle migration으로 관리하고 운영 DB를 임의 SQL로 수정하지 않는다.

## 6. API 계약

### `POST /api/diagnosis`

1. 요청과 개인정보 동의를 Zod로 검증한다.
2. lead와 diagnosis를 transaction으로 저장한다.
3. 상태를 `SUBMITTED`에서 `PROCESSING`으로 전환한다.
4. secret header와 timeout을 사용해 n8n Webhook을 호출한다.
5. 무작위 `publicId`와 현재 상태를 반환한다.

n8n 호출 실패 시 원본은 보존하고 상태·재시도 가능 이벤트를 남긴다. 같은 제출의 중복 처리를 막기 위한 idempotency 방식을 둔다.

### `POST /api/internal/diagnosis-result`

`X-Internal-Api-Key`를 상수 시간 방식으로 검증하고, diagnosis 존재 여부와 AI 결과 스키마를 확인한다. 결과 저장과 상태 `COMPLETED` 갱신은 하나의 transaction으로 처리한다. 검증·처리 실패 시 적절한 실패 상태와 오류 코드를 남긴다.

### `GET /api/diagnosis/[publicId]`

`PROCESSING`, `COMPLETED`, `FAILED` 상태 및 공개 가능한 결과 필드만 반환한다. 무작위 UUID를 사용해도 민감도에 따라 만료 토큰·추가 접근 제어를 검토한다.

### `POST /api/consultation`

공개 진단 ID, 상담 유형, 메시지를 검증하고 관련 lead와 연결해 저장한 뒤 관리자 알림을 요청한다.

### `GET /api/health`

애플리케이션과 DB 연결 상태만 반환하며 버전, 호스트명, 연결 문자열 등 민감한 서버 정보는 노출하지 않는다.

## 7. AI 결과 스키마

```json
{
  "automationScore": 72,
  "priorityTasks": [
    {
      "name": "고객 문의 자동화",
      "reason": "문의량이 많고 수동 확인 시간이 큽니다.",
      "difficulty": "LOW",
      "estimatedMonthlySavedHours": 12
    }
  ],
  "totalEstimatedSavedHours": { "min": 35, "max": 50 },
  "recommendedStack": ["Next.js", "n8n", "PostgreSQL", "Telegram"],
  "implementationSteps": ["데이터 수집", "담당자 알림", "AI 분류"],
  "summary": "고객 문의와 견적 업무부터 자동화하는 것이 효과적입니다."
}
```

검증 조건에는 점수 0~100, 음수가 아닌 시간, `min <= max`, 허용된 난이도, 배열 길이 상한, 문자열 길이 상한을 포함한다. 원본 AI 응답을 검증 없이 저장하거나 사용자에게 표시하지 않는다.

## 8. 결과·관리자 화면

- 결과 URL: `/diagnosis/result/[publicId]`
- `PROCESSING`: 2~3초 간격의 제한된 polling과 진행 안내
- `COMPLETED`: 점수, 추천, 절감 시간, 난이도, 스택, 단계, 요약, 상담 CTA
- `FAILED`: 내부 오류를 숨긴 재시도·상담 안내
- 관리자 경로: `/admin`, `/admin/diagnoses`, `/admin/diagnoses/[id]`, `/admin/consultations`
- 로그인 없는 관리자 경로 접근은 차단하고 `/admin/*`는 `noindex` 처리한다.

## 9. 보안·개인정보·운영

- PostgreSQL 5432를 호스트 외부에 publish하지 않는다.
- WEBAGENT DB와 n8n 내부 DB 및 계정을 분리한다.
- 외부 입력은 모두 서버에서 검증하고 진단·상담 API에 rate limit을 둔다.
- 로그는 `requestId`, `diagnosisId`, 이벤트, 상태, 시간만 기록한다.
- 이메일, 전화번호, 이름, raw answers, secret, stack trace를 로그·응답에 노출하지 않는다.
- 관리자 비밀번호는 bcrypt 또는 argon2 해시만 저장한다.
- 보안 헤더, 오류 경계, 404, 로딩 상태를 구성한다.
- 개인정보 수집 목적, 항목, 보관 기간, 파기 방식, 동의를 고지한다. 최종 법률 문구는 사업 환경에 맞게 별도 검토한다.

## 10. 백업·배포

```text
Cloudflare → Nginx Proxy Manager → webagent-app:3000
                                      ↕ 내부 네트워크
                                webagent-db:5432
```

- DB는 매일 `pg_dump` 후 압축해 VPS 밖의 저장소로 전송한다.
- 보관 기준은 일간 7일, 주간 4주, 월간 6개월이다.
- 월 1회 실제 복원 테스트를 하고 결과를 기록한다.
- Docker healthcheck, app health endpoint, 백업 실패 Telegram 알림을 둔다.
- 배포 전 migration과 롤백·복구 절차를 확인한다.

## 11. 구현 Phase와 완료 조건

| Phase | 범위 | 완료 조건 |
|---|---|---|
| 0 | 프로젝트, 의존성, 환경 변수 예시, Docker | dev·lint·build 통과 |
| 1 | PostgreSQL, Drizzle, migration, health | DB healthy, migration·query 성공 |
| 2 | 랜딩페이지 | 데스크톱·태블릿·모바일, CTA 이동 |
| 3 | 5단계 진단 폼과 API | 검증, DB 저장, publicId 반환 |
| 4 | n8n Webhook | secret·timeout·오류 보존 동작 |
| 5 | 내부 결과 API | 결과 검증·저장·상태 갱신 |
| 6 | 결과 페이지 | 처리 중→완료 자동 전환, 실패 UI |
| 7 | 관리자·상담 | 인증, 조회, 메모·상태 변경 |
| 8 | 보안·QA | rate limit, 로그 점검, 오류 UI |
| 9 | 배포·백업 | SSL, DB 비공개, 백업·복원 검증 |

각 Phase가 끝날 때 `npm run lint`, TypeScript 검사, `npm run build`를 실행한다. 테스트 스크립트가 도입되기 전에는 존재하지 않는 `npm test`를 사용하지 않는다.

## 12. 검증 우선순위

- 진단 API: 정상, 필수값 누락, 잘못된 이메일, 동의 거부, DB·n8n 실패, 중복 제출
- 내부 결과 API: 정상·잘못된 키, 잘못된 JSON, 없는 진단, 중복 callback
- 결과 조회: 세 상태와 개인정보 미노출
- 상담 API: 정상 연결, 없는 공개 ID, rate limit
- 관리자: 비로그인 차단, 로그인 성공·실패, 상태 변경
- 핵심 E2E: 방문 → 5단계 제출 → DB → n8n → 결과 저장 → 결과 표시 → 상담 → 관리자 확인

## 13. Definition of Done

- [ ] 반응형 랜딩페이지와 5단계 진단 폼
- [ ] PostgreSQL 원본 저장과 migration
- [ ] n8n Webhook 및 구조화 AI 결과
- [ ] 처리 중·완료·실패 결과 페이지
- [ ] 상담 저장과 관리자 알림
- [ ] 관리자 인증·진단·상담 조회
- [ ] 개인정보처리방침, rate limit, 안전한 로그
- [ ] PostgreSQL 외부 비공개
- [ ] 외부 백업과 복원 테스트
- [ ] Docker production build
- [ ] lint, typecheck, build와 핵심 흐름 검증

