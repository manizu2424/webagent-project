# WEBAGENT.KR MVP — Codex 개발 실행 문서
## Next.js + WEBAGENT 전용 PostgreSQL + n8n 기반

> 목적: 이 문서는 Codex에서 `WEBAGENT.KR` MVP를 실제로 구현하기 위한 개발 기준서이다.  
> 핵심 원칙: **작동하는 최소 제품을 먼저 완성하고, 이후 기능을 확장한다.**

---

# 0. 프로젝트 한 줄 정의

**중소기업 사용자가 반복 업무를 입력하면 AI가 자동화 가능성을 분석하고, 결과를 보여준 뒤 상담으로 연결하는 AI 자동화 영업 플랫폼**

핵심 흐름:

```text
방문자
→ 무료 자동화 진단
→ PostgreSQL 저장
→ n8n Webhook
→ AI 분석
→ 분석 결과 저장
→ 결과 페이지 표시
→ 관리자 Telegram 알림
→ 상담 신청
```

---

# 1. MVP 개발 목표

## 1.1 반드시 완성할 기능

1. WEBAGENT.KR 랜딩페이지
2. 단계형 무료 AI 자동화 진단 폼
3. 진단 데이터 PostgreSQL 저장
4. n8n Webhook 호출
5. AI 분석 결과 저장
6. 진단 결과 페이지
7. 상담 신청
8. Telegram 관리자 알림
9. 관리자 로그인
10. 관리자 진단 목록 및 상세 조회
11. 개인정보처리방침
12. Docker 기반 배포

---

# 2. MVP에서 제외할 기능

다음 기능은 이번 MVP에서 구현하지 않는다.

- 고객 회원가입
- 고객 전용 포털
- 결제
- 프로젝트 진행 대시보드
- 계약서/견적서 자동 생성
- 자동화 실행 로그 시각화 대시보드
- 자체 CRM 전체 기능
- RAG 문서 검색
- 실시간 채팅
- 다국어
- WordPress CMS 연동
- 모바일 앱

Codex는 위 범위를 임의로 추가하지 않는다.

---

# 3. 기술 스택

## Frontend / Backend

```text
Next.js App Router
TypeScript
React
Tailwind CSS
shadcn/ui
```

## Database

```text
PostgreSQL
Drizzle ORM 권장
```

Prisma도 가능하지만, 기본 구현 기준은 Drizzle ORM으로 한다.

## Validation

```text
Zod
```

## Form

```text
React Hook Form
```

## Authentication

MVP에서는 관리자 전용 로그인만 필요하다.

권장:

```text
Auth.js
Credentials Provider
```

관리자 계정은 `.env` 기반 단일 계정으로 시작할 수 있다.

향후 DB 사용자 테이블 기반 인증으로 변경 가능하도록 구조를 분리한다.

## Automation

```text
n8n
```

## AI

```text
OpenAI 또는 Gemini
```

AI 호출은 기본적으로 n8n에서 수행한다.

Next.js에서 AI API를 직접 호출하지 않는다.

## Notification

```text
Telegram Bot API
```

기본적으로 n8n이 Telegram 알림을 담당한다.

## Email

```text
Resend 또는 SMTP
```

MVP P1 기능으로 구현한다.

## Infrastructure

```text
Contabo VPS
Docker
Docker Compose
Nginx Proxy Manager
Cloudflare
```

---

# 4. 전체 시스템 아키텍처

```text
                       Internet
                          │
                     Cloudflare
                          │
                          ▼
                  Nginx Proxy Manager
                          │
                          ▼
                    webagent-app
                      Next.js
                          │
              ┌───────────┴─────────────┐
              │                         │
              ▼                         ▼
        webagent-db                 n8n Webhook
        PostgreSQL                      │
              ▲                         ▼
              │                    AI Provider
              │                         │
              │                         ▼
              │                    Telegram
              │
              └──────── 결과 업데이트 ────────
```

---

# 5. Docker 구성 원칙

## 5.1 WEBAGENT 전용 DB

n8n 내부 PostgreSQL DB와 WEBAGENT 업무 DB를 분리한다.

권장:

```text
n8n-db
→ n8n 전용

webagent-db
→ webagent 전용
```

가능하면 데이터베이스 컨테이너 자체를 분리한다.

---

# 6. 권장 프로젝트 디렉터리

```text
webagent/
│
├─ app/
│  ├─ page.tsx
│  ├─ diagnosis/
│  │  ├─ page.tsx
│  │  ├─ loading.tsx
│  │  └─ result/[publicId]/page.tsx
│  ├─ consultation/page.tsx
│  ├─ admin/
│  │  ├─ page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ diagnoses/page.tsx
│  │  ├─ diagnoses/[id]/page.tsx
│  │  └─ consultations/page.tsx
│  ├─ privacy/page.tsx
│  └─ api/
│     ├─ diagnosis/route.ts
│     ├─ diagnosis/[publicId]/route.ts
│     ├─ consultation/route.ts
│     ├─ internal/diagnosis-result/route.ts
│     └─ health/route.ts
│
├─ components/
│  ├─ layout/
│  ├─ landing/
│  ├─ diagnosis/
│  ├─ admin/
│  └─ ui/
│
├─ db/
│  ├─ index.ts
│  ├─ schema.ts
│  └─ migrations/
│
├─ lib/
│  ├─ auth/
│  ├─ validators/
│  ├─ n8n/
│  ├─ security/
│  ├─ utils/
│  └─ constants/
│
├─ types/
│  ├─ diagnosis.ts
│  └─ api.ts
│
├─ scripts/
│  ├─ backup-db.sh
│  └─ restore-db.sh
│
├─ Dockerfile
├─ docker-compose.yml
├─ drizzle.config.ts
├─ .env.example
├─ package.json
└─ README.md
```

---

# 7. 환경 변수

`.env.example`

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

POSTGRES_DB=webagent
POSTGRES_USER=webagent_user
POSTGRES_PASSWORD=change_this_password
DATABASE_URL=postgresql://webagent_user:change_this_password@webagent-db:5432/webagent

INTERNAL_API_KEY=change_to_long_random_secret

N8N_DIAGNOSIS_WEBHOOK_URL=https://n8n.example.com/webhook/webagent-diagnosis
N8N_WEBHOOK_SECRET=change_to_long_random_secret

AUTH_SECRET=change_to_long_random_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=

RESEND_API_KEY=
EMAIL_FROM=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 보안 규칙

절대로 실제 `.env` 파일을 Git에 커밋하지 않는다.

`.gitignore`:

```gitignore
.env
.env.local
.env.production
*.log
```

---

# 8. PostgreSQL Docker Compose

```yaml
services:
  webagent-db:
    image: postgres:17-alpine
    container_name: webagent-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - webagent_postgres_data:/var/lib/postgresql/data
    networks:
      - webagent-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  webagent-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: webagent-app
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      webagent-db:
        condition: service_healthy
    networks:
      - webagent-internal
      - proxy

volumes:
  webagent_postgres_data:

networks:
  webagent-internal:
    internal: true
  proxy:
    external: true
```

## 중요

운영 환경에서는 PostgreSQL `5432` 포트를 외부에 노출하지 않는다.

---

# 9. 데이터 모델

## 9.1 leads

```text
id                  UUID PK
company_name        VARCHAR
industry            VARCHAR
employee_count      INTEGER
contact_name        VARCHAR
email               VARCHAR
phone               VARCHAR
consulting_method   VARCHAR
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

## 9.2 diagnoses

```text
id                  UUID PK
public_id           UUID UNIQUE
lead_id             UUID FK
website_status      VARCHAR
current_tools       JSONB
repetitive_tasks    JSONB
daily_hours         NUMERIC
monthly_volume      INTEGER
pain_point          TEXT
budget_range        VARCHAR
raw_answers         JSONB
status              VARCHAR
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

`public_id`는 고객 결과 페이지 URL에 사용한다. DB 내부 `id`를 외부에 노출하지 않는다.

## 9.3 diagnosis_results

```text
id                          UUID PK
diagnosis_id                UUID FK UNIQUE
automation_score            INTEGER
recommended_tasks           JSONB
estimated_saved_hours_min   NUMERIC
estimated_saved_hours_max   NUMERIC
difficulty                  VARCHAR
recommended_stack           JSONB
implementation_steps        JSONB
ai_summary                  TEXT
raw_ai_result               JSONB
model_name                  VARCHAR
created_at                  TIMESTAMPTZ
```

## 9.4 consultations

```text
id                  UUID PK
lead_id             UUID FK
diagnosis_id        UUID FK nullable
preferred_date      TIMESTAMPTZ nullable
consultation_type   VARCHAR
message             TEXT
status              VARCHAR
memo                TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

## 9.5 automation_logs

```text
id                  UUID PK
diagnosis_id        UUID FK nullable
workflow_name       VARCHAR
execution_id        VARCHAR
status              VARCHAR
error_message       TEXT
started_at          TIMESTAMPTZ
finished_at         TIMESTAMPTZ
created_at          TIMESTAMPTZ
```

---

# 10. 상태값

## DiagnosisStatus

```text
SUBMITTED
PROCESSING
COMPLETED
FAILED
```

## ConsultationStatus

```text
NEW
CONTACT_PENDING
SCHEDULED
PROPOSAL_SENT
CONTRACTED
HOLD
CLOSED
```

상태 문자열은 코드 여러 곳에 하드코딩하지 않고 상수 또는 enum으로 관리한다.

---

# 11. Drizzle ORM 스키마 원칙

예시:

```ts
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  employeeCount: integer("employee_count"),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  consultingMethod: varchar("consulting_method", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

전체 테이블은 `db/schema.ts`에 정의하고 migration을 사용한다.

운영 환경에서 임의 SQL로 테이블 구조를 수정하지 않는다.

---

# 12. DB Migration

권장 명령:

```bash
npm run db:generate
npm run db:migrate
```

`package.json` 예:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

# 13. 진단 폼 UX

## Step 1 — 회사 정보

```text
회사명
업종
직원 수
홈페이지 유무
```

## Step 2 — 사용하는 도구

```text
Excel
Google Sheets
Email
KakaoTalk
ERP
CRM
WordPress
Naver
Slack
Telegram
기타
```

## Step 3 — 반복 업무

```text
고객 문의
견적 작성
고객정보 관리
이메일 발송
보고서 작성
블로그 작성
SNS 운영
문서 정리
상담 기록
내부 알림
```

## Step 4 — 업무량

```text
하루 반복업무 시간
월 처리 건수
가장 불편한 업무
현재 처리 방식
```

## Step 5 — 상담 정보

```text
자동화 도입 목적
예상 예산
담당자 이름
이메일
전화번호
상담 희망 방식
개인정보 동의
```

---

# 14. Frontend 폼 구현 원칙

사용:

```text
React Hook Form
Zod
```

구조:

```text
DiagnosisWizard
├─ ProgressIndicator
├─ CompanyStep
├─ ToolsStep
├─ TasksStep
├─ WorkloadStep
└─ ContactStep
```

각 Step 컴포넌트는 자체적으로 API를 호출하지 않는다. 최종 제출 시 한 번만 API를 호출한다.

---

# 15. Diagnosis API

## POST `/api/diagnosis`

### 역할

1. 요청 validation
2. lead 생성
3. diagnosis 생성
4. status = `SUBMITTED`
5. n8n webhook 호출
6. publicId 반환

### Request 예

```json
{
  "companyName": "ABC건설",
  "industry": "건설",
  "employeeCount": 12,
  "websiteStatus": "HAS_WEBSITE",
  "currentTools": ["EXCEL", "EMAIL"],
  "repetitiveTasks": ["INQUIRY", "ESTIMATE", "REPORT"],
  "dailyHours": 4,
  "monthlyVolume": 80,
  "painPoint": "문의와 견적 관리가 수작업입니다.",
  "budgetRange": "1M_3M",
  "contactName": "홍길동",
  "email": "example@example.com",
  "phone": "010-0000-0000",
  "consultingMethod": "PHONE",
  "privacyConsent": true
}
```

### Response

```json
{
  "success": true,
  "publicId": "376d1789-...",
  "status": "PROCESSING"
}
```

---

# 16. n8n Webhook Payload

Next.js → n8n:

```json
{
  "event": "diagnosis.submitted",
  "diagnosisId": "internal-uuid",
  "publicId": "public-uuid",
  "company": {
    "name": "ABC건설",
    "industry": "건설",
    "employeeCount": 12
  },
  "diagnosis": {
    "currentTools": ["EXCEL", "EMAIL"],
    "repetitiveTasks": ["INQUIRY", "ESTIMATE", "REPORT"],
    "dailyHours": 4,
    "monthlyVolume": 80,
    "painPoint": "문의와 견적 관리가 수작업입니다."
  }
}
```

Header:

```text
X-Webagent-Webhook-Secret
```

값은 `.env`의 `N8N_WEBHOOK_SECRET`과 일치해야 한다.

---

# 17. n8n Workflow

기본 Workflow 이름:

```text
WEBAGENT - AI Diagnosis
```

권장 흐름:

```text
Webhook
↓
Secret 검증
↓
입력 데이터 정리
↓
AI Model
↓
Structured Output 검증
↓
WEBAGENT Internal API 호출
↓
Telegram 관리자 알림
↓
필요 시 고객 이메일 발송
```

---

# 18. AI Structured Output

AI는 자유 텍스트가 아닌 구조화된 JSON을 반환한다.

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
  "totalEstimatedSavedHours": {
    "min": 35,
    "max": 50
  },
  "recommendedStack": [
    "Next.js",
    "n8n",
    "PostgreSQL",
    "Telegram",
    "Gemini"
  ],
  "implementationSteps": [
    "문의 데이터 수집",
    "담당자 알림",
    "AI 문의 분류",
    "답변 초안 생성"
  ],
  "summary": "고객 문의와 견적 업무부터 자동화하는 것이 효과적입니다."
}
```

---

# 19. Internal Result API

## POST `/api/internal/diagnosis-result`

이 API는 일반 사용자가 호출할 수 없어야 한다.

Header:

```text
X-Internal-Api-Key
```

값:

```env
INTERNAL_API_KEY
```

### 역할

1. 내부 API Key 검증
2. diagnosisId 확인
3. AI 결과 Zod validation
4. diagnosis_results 저장
5. diagnoses.status = COMPLETED
6. 응답 반환

---

# 20. AI 결과 검증

Zod 예:

```ts
const diagnosisResultSchema = z.object({
  automationScore: z.number().min(0).max(100),
  priorityTasks: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      difficulty: z.enum(["LOW", "MEDIUM", "HIGH"]),
      estimatedMonthlySavedHours: z.number().min(0),
    })
  ),
  totalEstimatedSavedHours: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
  recommendedStack: z.array(z.string()),
  implementationSteps: z.array(z.string()),
  summary: z.string(),
});
```

AI 응답을 validation 없이 DB에 저장하지 않는다.

---

# 21. 결과 페이지

URL:

```text
/diagnosis/result/[publicId]
```

## PROCESSING

```text
AI가 귀사의 업무를 분석하고 있습니다.
잠시 후 자동으로 결과가 표시됩니다.
```

2~3초 간격 polling을 사용할 수 있다.

## COMPLETED

표시:

```text
자동화 준비도
우선 추천 자동화
예상 절감시간
구축 난이도
추천 시스템
구축 단계
AI 요약
상담 CTA
```

## FAILED

```text
분석 중 문제가 발생했습니다.

[다시 분석 요청]
[상담 문의]
```

내부 오류 상세는 사용자에게 표시하지 않는다.

---

# 22. 결과 조회 API

## GET `/api/diagnosis/[publicId]`

응답에서 개인정보를 반환하지 않는다.

허용:

```text
status
automationScore
recommendedTasks
estimatedSavedHours
difficulty
recommendedStack
implementationSteps
summary
```

금지:

```text
phone
email
contactName
internalId
AI raw prompt
internal log
```

---

# 23. 상담 API

## POST `/api/consultation`

입력:

```json
{
  "publicDiagnosisId": "376d1789-...",
  "consultationType": "PHONE",
  "message": "문의 자동화 상담을 희망합니다."
}
```

처리:

```text
publicDiagnosisId
→ diagnosis 검색
→ lead_id 확인
→ consultations 저장
→ n8n 또는 Telegram 알림
```

---

# 24. 관리자 기능

경로:

```text
/admin
/admin/diagnoses
/admin/diagnoses/[id]
/admin/consultations
```

## Dashboard

```text
오늘 신규 진단
이번 주 신규 진단
상담 대기
제안서 발송
계약
```

초기에는 그래프 없이 숫자 카드만 구현한다.

## 진단 목록

```text
회사명
업종
담당자
진단 상태
자동화 점수
상담 상태
등록일
```

## 진단 상세

```text
회사 정보
진단 입력
AI 분석 결과
상담 내역
관리자 메모
상태 변경
```

---

# 25. 관리자 인증

MVP 원칙:

```text
일반 사용자 회원가입 없음
관리자만 로그인
```

초기에는 1명 관리자 기준.

비밀번호를 평문 `.env`에 저장하지 않는다.

```env
ADMIN_PASSWORD_HASH=
```

bcrypt 또는 argon2 해시 사용.

---

# 26. Landing Page

섹션 순서:

```text
Hero
↓
고객 문제
↓
자동화 Before / After
↓
서비스 5종
↓
자동화 사례 3종
↓
무료 진단 CTA
↓
구축 프로세스
↓
회사/기술 신뢰
↓
FAQ
↓
최종 CTA
```

## Hero

제목:

> AI로 일하는 회사를 만듭니다.

설명:

> 홈페이지 제작부터 n8n 업무 자동화, AI Agent 구축까지  
> 반복 업무를 줄이는 실전형 자동화 시스템을 구축합니다.

CTA:

```text
무료 자동화 진단
자동화 사례 보기
```

---

# 27. 서비스 카드

5종:

```text
AI Automation
n8n Automation
Smart Website
AI Agent
AI Consulting
```

MVP에서는 각 서비스 상세페이지를 만들지 않는다.

---

# 28. 자동화 사례

## 문의 자동화

```text
문의
→ AI 분류
→ DB 저장
→ 담당자 알림
→ 접수 이메일
→ 답변 초안
```

## 견적 자동화

```text
견적 신청
→ 요구사항 분석
→ 추가 질문
→ 견적 초안
→ 관리자 승인
```

## 콘텐츠 자동화

```text
키워드
→ 자료 수집
→ AI 초안
→ 이미지
→ WordPress 초안
→ 관리자 검수
```

---

# 29. UI 디자인 원칙

## Tone

```text
B2B
신뢰
실용
명확
```

피해야 할 것:

```text
과도한 네온
AI 로봇 이미지
불필요한 3D 그래픽
블랙 배경 위주의 사이버펑크 디자인
```

권장:

```text
밝은 배경
진한 네이비 텍스트
포인트 컬러 1개
넓은 여백
카드 UI
업무 흐름 Diagram
```

---

# 30. SEO

필수:

```text
metadata
title
description
Open Graph
robots.txt
sitemap.xml
canonical
```

관리자 페이지 `/admin/*`는 검색 인덱싱을 금지한다.

---

# 31. 로그 정책

개인정보를 로그로 남기지 않는다.

금지:

```ts
console.log(body);
```

특히 다음을 log하지 않는다.

```text
email
phone
contactName
rawAnswers
```

운영 로그는 다음 정도로 제한한다.

```text
requestId
diagnosisId
event
status
duration
```

---

# 32. Rate Limit

최소한 다음 API에는 rate limit을 적용한다.

```text
POST /api/diagnosis
POST /api/consultation
```

예:

```text
동일 IP
10분당 5회
```

Cloudflare 또는 애플리케이션 레벨로 처리한다.

---

# 33. 개인정보

최소 수집 원칙.

필요:

```text
이름
이메일
전화번호(선택 가능)
회사명
진단 데이터
```

반드시 포함:

```text
개인정보 수집 목적
수집 항목
보관 기간
파기 방법
동의 여부
```

구체적인 법률 문구는 실제 사업자 환경에 맞춰 별도 검토한다.

---

# 34. DB Backup

기본:

```text
매일 pg_dump
→ gzip
→ 외부 스토리지
```

같은 Contabo VPS 내부에만 백업하지 않는다.

권장:

```text
일간 7개
주간 4개
월간 6개
```

---

# 35. 백업 스크립트 예시

`scripts/backup-db.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/webagent"
FILE="$BACKUP_DIR/webagent_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec webagent-db \
  pg_dump \
  -U "$POSTGRES_USER" \
  "$POSTGRES_DB" \
  | gzip > "$FILE"

find "$BACKUP_DIR" \
  -type f \
  -name "webagent_*.sql.gz" \
  -mtime +7 \
  -delete
```

실제 운영에서는 외부 저장소 복사를 추가한다.

---

# 36. Health Check

## GET `/api/health`

```json
{
  "status": "ok",
  "database": "ok"
}
```

민감한 서버 정보를 반환하지 않는다.

---

# 37. 에러 처리

성공:

```json
{
  "success": true,
  "data": {}
}
```

실패:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 내용을 확인해 주세요."
  }
}
```

사용자에게 stack trace를 반환하지 않는다.

---

# 38. Codex 개발 규칙

## 반드시 할 것

- TypeScript strict mode
- Server/Client Component 구분
- Zod validation
- DB transaction 필요 시 사용
- 환경변수 검증
- API 에러 타입 통일
- 재사용 가능한 컴포넌트
- migration 사용
- secrets 하드코딩 금지
- lint/typecheck/build 통과

## 하지 말 것

- `any` 남용
- UI 컴포넌트에 DB 코드 작성
- Client Component에서 DB 접근
- AI API Key 브라우저 노출
- PostgreSQL 포트 외부 공개
- DB ID를 public URL에 직접 사용
- `.env` Git commit
- n8n DB와 WEBAGENT DB 공유
- MVP 범위 밖 기능 임의 추가

---

# 39. Phase 0 — 프로젝트 초기화

Codex 작업:

1. Next.js 프로젝트 생성
2. TypeScript 설정
3. Tailwind 설정
4. shadcn/ui 초기화
5. 기본 디렉터리 생성
6. `.env.example`
7. ESLint
8. README
9. Dockerfile
10. docker-compose.yml

완료 조건:

```bash
npm run dev
npm run lint
npm run build
```

모두 통과.

---

# 40. Phase 1 — PostgreSQL

Codex 작업:

1. PostgreSQL Docker 구성
2. Drizzle 설치
3. schema 작성
4. migrations 설정
5. database connection 작성
6. health API 작성

완료 조건:

```text
docker compose up -d
→ PostgreSQL healthy
→ migration 완료
→ Next.js에서 DB query 성공
→ /api/health 정상
```

---

# 41. Phase 2 — Landing Page

Codex 작업:

1. Header
2. Hero
3. Problem Section
4. Before/After
5. Services
6. Automation Cases
7. Process
8. FAQ
9. CTA
10. Footer

완료 조건:

```text
Desktop 정상
Tablet 정상
Mobile 정상
CTA → /diagnosis 이동
```

---

# 42. Phase 3 — Diagnosis Form

Codex 작업:

1. 5-step wizard
2. validation
3. progress
4. previous/next
5. submit
6. loading state
7. API integration

완료 조건:

```text
필수값 검증
중간 단계 이동
최종 제출
DB 저장
publicId 반환
```

---

# 43. Phase 4 — n8n Integration

Codex 작업:

1. n8n client utility
2. webhook payload
3. secret header
4. timeout
5. 최소 retry 정책
6. 오류 처리

중요:

```text
DB 저장 성공
→ n8n 호출
```

n8n 호출 실패로 진단 데이터 자체가 유실되면 안 된다.

---

# 44. Phase 5 — AI Result API

Codex 작업:

1. internal API
2. API key validation
3. Zod result validation
4. diagnosis result 저장
5. diagnosis status 갱신

완료 조건:

```text
n8n
→ internal API
→ result DB 저장
→ COMPLETED
```

---

# 45. Phase 6 — Result Page

Codex 작업:

1. processing state
2. completed state
3. failed state
4. result card
5. consulting CTA

완료 조건:

```text
진단 제출
→ processing
→ AI 완료
→ 자동 결과 표시
```

---

# 46. Phase 7 — Admin

Codex 작업:

1. admin auth
2. admin route protection
3. dashboard
4. diagnosis list
5. diagnosis detail
6. consultation list
7. status update

완료 조건:

```text
로그인 없이 /admin 접근 불가
관리자 로그인 가능
DB 데이터 조회 가능
상태 변경 가능
```

---

# 47. Phase 8 — Security / QA

Codex 작업:

1. rate limit
2. security headers
3. input validation 점검
4. 개인정보 로그 제거
5. admin noindex
6. env validation
7. Docker production build
8. error boundary
9. loading state
10. 404

---

# 48. Phase 9 — Deployment

배포 구조:

```text
Cloudflare
↓
Nginx Proxy Manager
↓
webagent-app:3000
```

PostgreSQL:

```text
webagent-db:5432
```

Docker 내부 전용.

Nginx Proxy Manager:

```text
webagent.kr
→ webagent-app:3000
```

SSL 적용.

---

# 49. Git 브랜치 전략

MVP에서는 단순화한다.

```text
main
feature/*
fix/*
```

예:

```text
feature/database
feature/diagnosis-form
feature/n8n-integration
feature/admin
```

---

# 50. Commit 규칙

```text
feat: add diagnosis wizard
feat: add postgres schema
feat: integrate n8n webhook
fix: prevent duplicate diagnosis submission
refactor: separate database service
docs: update deployment guide
```

---

# 51. 테스트 우선순위

## Diagnosis API

- 정상 입력
- 필수값 누락
- 이메일 오류
- 개인정보 동의 false
- DB 오류
- n8n 오류

## Internal Result API

- 정상 API key
- 잘못된 API key
- 잘못된 AI JSON
- 존재하지 않는 diagnosis

## Admin

- 비로그인 접근
- 로그인 성공
- 로그인 실패

---

# 52. E2E 핵심 시나리오

```text
사용자 사이트 접속
→ 무료 진단 클릭
→ 5단계 입력
→ 제출
→ DB 저장
→ n8n 실행
→ AI 결과 저장
→ 결과 페이지
→ 상담 신청
→ 관리자 화면 확인
```

이 테스트가 성공하면 MVP 핵심 기능은 완료다.

---

# 53. 성능 목표

초기 목표:

```text
Lighthouse Performance 85+
Accessibility 90+
SEO 90+
Best Practices 90+
```

과도한 애니메이션과 대용량 동영상을 사용하지 않는다.

---

# 54. MVP Definition of Done

- [ ] `webagent.kr` 접속 가능
- [ ] 반응형 랜딩페이지 완성
- [ ] 진단 폼 5단계 작동
- [ ] PostgreSQL 저장
- [ ] n8n webhook 호출
- [ ] AI structured output 생성
- [ ] AI 결과 DB 저장
- [ ] 결과 페이지 표시
- [ ] Telegram 관리자 알림
- [ ] 상담 신청 DB 저장
- [ ] 관리자 로그인
- [ ] 관리자 진단 조회
- [ ] 개인정보처리방침
- [ ] PostgreSQL 외부 포트 비공개
- [ ] DB 자동 백업
- [ ] Docker production build 성공
- [ ] lint/typecheck/build 통과
- [ ] 핵심 E2E 테스트 통과

---

# 55. Codex 첫 작업 지시문

아래 내용을 Codex 첫 프롬프트로 사용한다.

```text
WEBAGENT.KR MVP를 개발한다.

첨부된 WEBAGENT 개발 실행 문서를 프로젝트의 단일 기준 문서로 사용하라.

기술 스택:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Drizzle ORM
- Zod
- React Hook Form
- Docker / Docker Compose

중요 원칙:
1. n8n 내부 DB와 WEBAGENT DB는 분리한다.
2. PostgreSQL은 외부 포트를 공개하지 않는다.
3. AI 호출은 n8n이 담당한다.
4. Next.js는 진단 데이터 저장과 n8n Webhook 호출을 담당한다.
5. n8n은 AI 결과를 WEBAGENT internal API로 반환한다.
6. 모든 외부 입력은 Zod로 검증한다.
7. DB schema 변경은 migration으로 관리한다.
8. secret은 코드에 하드코딩하지 않는다.
9. 구현 범위를 MVP 문서 밖으로 임의 확장하지 않는다.
10. 각 Phase가 끝날 때 lint, typecheck, build를 실행하고 오류를 수정한 뒤 다음 Phase로 진행한다.

먼저 Phase 0과 Phase 1만 진행하라.

Phase 0:
- Next.js 프로젝트 기반 구조
- 의존성
- 디렉터리
- .env.example
- Dockerfile
- docker-compose.yml
- README

Phase 1:
- WEBAGENT 전용 PostgreSQL
- Drizzle ORM
- DB schema
- migration
- DB connection
- /api/health

작업 완료 후:
1. 생성/수정한 파일 목록
2. 구현 내용
3. 실행 명령
4. 테스트 결과
5. 다음 Phase 작업 목록
을 보고하라.
```

---

# 56. Codex Phase별 운영법

전체 프로젝트를 한 번에 구현하도록 지시하지 않는다.

권장:

```text
Phase 0 + 1
↓ 검토
Phase 2
↓ 검토
Phase 3
↓ 검토
Phase 4 + 5
↓ 검토
Phase 6
↓ 검토
Phase 7
↓ 검토
Phase 8 + 9
```

이 방식이 오류 누적을 줄인다.

---

# 57. 프로젝트 핵심 의사결정

```text
DB              WEBAGENT 전용 PostgreSQL 자체 구축
DB 위치         Contabo VPS / Docker
n8n DB 관계     완전 분리
ORM             Drizzle ORM
AI 호출         n8n 담당
결과 URL         public UUID 기반
관리자           MVP 단일 관리자
인증             Auth.js 또는 안전한 서버 세션
배포             Docker + Nginx Proxy Manager + Cloudflare
```

---

# 58. 최종 시스템 목표

```text
              WEBAGENT.KR
                   │
             Next.js App
                   │
           ┌───────┴───────┐
           │               │
           ▼               ▼
   WEBAGENT PostgreSQL    n8n
           ▲               │
           │               ▼
           │            AI Model
           │               │
           │               ▼
           │           Telegram
           │
           └──── Result ────┘
                   │
                   ▼
            Diagnosis Result
                   │
                   ▼
              Consultation
```

MVP에서 가장 중요한 것은 다음 영업 흐름을 완성하는 것이다.

```text
무료 진단
→ 실제 AI 분석
→ 유용한 결과
→ 상담
→ 프로젝트 계약
```

---

# 59. Codex 작업 최종 원칙

> **먼저 작동하게 만들고, 그 다음 정리하고, 마지막으로 고도화한다.**

첫 번째 목표는 완벽한 플랫폼이 아니라 다음 한 문장이다.

```text
한 명의 실제 사용자가
webagent.kr에서
진단을 제출하고
AI 분석 결과를 받고
상담 신청까지 완료한다.
```
