# WEBAGENT.KR 기초 웹 MVP 기획서

## 1. 문서 목적

이 문서는 `WEBAGENT.KR`의 기초 웹 MVP를 실제 개발·배포 가능한 수준으로 정의한다.

MVP의 핵심은 단순 회사 소개 홈페이지가 아니라, 방문자가 자신의 반복 업무를 입력하면 AI가 자동화 가능성을 분석하고 상담으로 연결하는 **무료 AI 자동화 진단 서비스**이다.

DB 구성은 다음 두 가지 시나리오를 모두 포함한다.

1. **Supabase 기반 구성**
2. **WEBAGENT 전용 PostgreSQL 자체 구축 구성**

두 방식은 프론트엔드와 서비스 기능은 동일하게 유지하고, 데이터베이스·인증·운영 구조만 다르게 설계한다.

---

# 2. 서비스 개요

## 2.1 브랜드

**WEBAGENT.KR**

## 2.2 핵심 슬로건

> AI로 일하는 회사를 만듭니다.

## 2.3 보조 메시지

> 홈페이지 제작부터 n8n 업무 자동화, AI Agent 구축까지  
> 반복 업무를 줄이는 실전형 자동화 시스템을 구축합니다.

## 2.4 서비스 포지셔닝

WEBAGENT.KR은 일반적인 홈페이지 제작 회사가 아니라 다음과 같이 포지셔닝한다.

> **중소기업을 위한 AI 자동화 구축 전문기업**

홈페이지 제작은 독립된 주력 상품이 아니라, 문의 접수·고객 관리·AI 분석·업무 자동화와 연결되는 **Smart Website** 서비스로 포함한다.

---

# 3. MVP 목표

## 3.1 핵심 목표

방문자가 사이트에 접속한 후 다음 과정을 완료하도록 한다.

```text
사이트 방문
→ 서비스 이해
→ 무료 자동화 진단 시작
→ 진단 제출
→ AI 분석 결과 확인
→ 상담 신청
→ 실제 프로젝트 제안
```

## 3.2 MVP 검증 가설

> 중소기업 대표자와 실무자는 단순 문의 폼보다 자신의 회사 업무를 분석해 주는 무료 자동화 진단에 더 적극적으로 반응할 것이다.

## 3.3 MVP 성공 기준

다음 흐름이 처음부터 끝까지 정상적으로 작동하면 MVP 개발을 완료한 것으로 본다.

1. 사용자가 `webagent.kr`에 접속한다.
2. 무료 자동화 진단을 시작한다.
3. 회사와 업무 정보를 입력한다.
4. 데이터가 DB에 저장된다.
5. n8n이 AI 분석을 실행한다.
6. 분석 결과가 DB에 저장된다.
7. 사용자가 결과 페이지를 확인한다.
8. 관리자에게 Telegram 또는 이메일 알림이 전달된다.
9. 사용자가 상담을 신청할 수 있다.

---

# 4. 핵심 타깃

## 4.1 1차 고객

- 직원 5~50명 규모 중소기업
- 내부 개발자가 없는 회사
- 엑셀·이메일·문서 작업이 많은 회사
- 홈페이지 문의를 수동으로 관리하는 회사
- 블로그·SNS 콘텐츠 제작에 시간이 많이 드는 회사
- AI를 도입하고 싶지만 시작 방법을 모르는 대표자

## 4.2 초기 집중 업종

1. 건설·인테리어·부동산
2. 전문서비스업
3. 교육·학원·컨설팅
4. 제조·유통업
5. 1인 기업

초기 포트폴리오는 사용자의 경험을 활용할 수 있는 **건설·전문서비스업 자동화 사례**를 우선 제작한다.

---

# 5. MVP 기능 범위

## 5.1 필수 기능

| 구분 | 기능 | 우선순위 |
|---|---|---:|
| 랜딩페이지 | Hero, 문제 제시, 서비스 소개 | P0 |
| 무료 진단 | 단계형 자동화 진단 폼 | P0 |
| DB 저장 | 고객·진단 원본 저장 | P0 |
| AI 분석 | 진단 답변 기반 추천 생성 | P0 |
| 결과 페이지 | 자동화 점수·추천 항목 표시 | P0 |
| 관리자 알림 | Telegram 또는 이메일 알림 | P0 |
| 상담 연결 | 상담 폼 또는 예약 링크 | P0 |
| 개인정보 보호 | 동의·처리방침·보관 기준 | P0 |
| 자동화 사례 | 문의·견적·콘텐츠 자동화 | P1 |
| 관리자 화면 | 진단 및 상담 조회 | P1 |
| 블로그 | 기본 목록·상세 | P1 |
| 결과 이메일 | 고객에게 결과 전송 | P1 |

## 5.2 2차 이후 기능

- 고객 회원가입
- 고객 전용 대시보드
- 결제
- 프로젝트 진행 관리
- 자동화 실행 로그
- 견적서·계약서 관리
- 사내 문서 RAG 검색
- 자체 실시간 채팅
- 다국어 서비스

---

# 6. 사이트 정보구조

```text
webagent.kr
│
├─ 홈
├─ 무료 자동화 진단
├─ 자동화 사례
│   ├─ 문의 자동화
│   ├─ 견적 자동화
│   └─ 콘텐츠 자동화
├─ 블로그
├─ 회사소개
├─ 상담신청
└─ 개인정보처리방침
```

## 6.1 홈 화면 구성

1. Hero
2. 고객 문제 제시
3. 자동화 전후 비교
4. 서비스 5종
5. 자동화 사례 3종
6. 무료 자동화 진단 CTA
7. 구축 진행 절차
8. 운영자 및 기술 신뢰 요소
9. FAQ
10. 최종 상담 CTA

---

# 7. 핵심 기능: 무료 AI 자동화 진단

## 7.1 진단 폼

### Step 1. 회사 기본정보

- 회사명
- 업종
- 직원 수
- 홈페이지 유무

### Step 2. 현재 사용하는 도구

- Excel
- Google Sheets
- 이메일
- 카카오톡
- ERP
- CRM
- WordPress
- 네이버
- Slack
- Telegram
- 기타

### Step 3. 반복 업무

- 고객 문의
- 견적 작성
- 고객정보 관리
- 이메일 발송
- 보고서 작성
- 블로그 작성
- SNS 운영
- 문서 정리
- 상담 내용 정리
- 내부 알림

### Step 4. 업무량과 문제점

- 하루 반복 업무 시간
- 업무 담당 인원
- 월간 처리 건수
- 가장 불편한 업무
- 현재 업무 처리 방식

### Step 5. 상담 및 연락 정보

- 자동화 도입 목적
- 예상 예산 범위
- 상담 희망 방식
- 담당자 이름
- 연락처
- 이메일
- 개인정보 수집 동의

---

# 8. AI 분석 결과 구성

## 8.1 결과 화면

### 자동화 준비도

```text
자동화 준비도: 72점
```

### 우선 추천 업무

1. 고객 문의 자동화
2. 견적 초안 자동화
3. 상담 기록 자동화
4. 블로그 콘텐츠 자동화

### 예상 효과

```text
예상 절감 시간: 월 35~50시간
예상 구축 난이도: 중간
권장 구축 단계: 3단계
```

### 추천 시스템 예시

```text
웹 문의 폼
→ n8n
→ DB
→ AI 분석
→ Telegram 알림
→ 이메일 자동 발송
```

### CTA

- 상담 신청하기
- 결과 이메일로 받기
- 진단 다시 하기

---

# 9. 공통 기술 스택

DB 선택과 무관하게 다음 스택을 공통으로 사용한다.

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js App Router |
| 언어 | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 자동화 | n8n |
| AI | OpenAI 또는 Gemini |
| 이메일 | Resend 또는 SMTP |
| 관리자 알림 | Telegram Bot |
| 블로그 | 초기 MDX |
| 분석 | GA4 + Microsoft Clarity |
| 배포 | Contabo VPS + Docker |
| 리버스 프록시 | Nginx Proxy Manager |
| DNS·보안 | Cloudflare |

---

# 10. DB 시나리오 A: Supabase 기반 구성

## 10.1 구성 개요

```text
사용자
  ↓
Next.js
  ↓
Supabase API
  ↓
Supabase PostgreSQL
  ↓
n8n
  ↓
AI API / Telegram / Email
```

Supabase는 단순 DB가 아니라 다음 기능을 함께 제공한다.

- PostgreSQL
- 인증
- 자동 API
- 파일 저장소
- Row Level Security
- 관리 콘솔
- 실시간 기능

## 10.2 권장 구성

```text
Frontend          Next.js
Database          Supabase PostgreSQL
Authentication    Supabase Auth
Storage           Supabase Storage
Authorization     Row Level Security
Automation        n8n
AI                OpenAI 또는 Gemini
Deployment        Contabo 또는 Vercel
```

## 10.3 장점

- MVP 개발 속도가 빠르다.
- 별도 PostgreSQL 설치가 필요 없다.
- 관리자 인증을 빠르게 구현할 수 있다.
- JavaScript SDK로 Next.js 연결이 쉽다.
- DB 관리 화면이 기본 제공된다.
- 향후 고객별 데이터 접근 권한을 구현하기 쉽다.
- Storage를 이용해 PDF 보고서나 첨부파일을 관리할 수 있다.
- PostgreSQL 기반이므로 향후 자체 DB로 이전하기 비교적 쉽다.

## 10.4 단점

- 외부 서비스에 의존한다.
- 사용량 증가 시 비용이 증가할 수 있다.
- 무료 플랜은 백업과 운영 기능에 제한이 있을 수 있다.
- RLS 설정을 잘못하면 데이터가 노출되거나 조회되지 않을 수 있다.
- 이미 VPS와 PostgreSQL을 운영할 수 있다면 비용 절감 효과가 낮다.

## 10.5 Supabase 데이터 처리 흐름

```text
진단 폼 제출
→ Next.js Server Action 또는 Route Handler
→ Supabase leads 저장
→ Supabase diagnoses 저장
→ n8n Webhook 호출
→ AI 분석
→ diagnosis_results 저장
→ 결과 페이지 표시
→ Telegram 관리자 알림
→ 결과 이메일 발송
```

## 10.6 Supabase 보안 원칙

- 브라우저에는 `anon key`만 사용한다.
- `service_role key`는 서버와 n8n에서만 사용한다.
- 관리자 전용 테이블 조회는 RLS로 제한한다.
- 공개 사용자는 진단 데이터 INSERT만 허용한다.
- 진단 결과 조회는 무작위 공개 토큰 또는 서버 API를 통해 처리한다.
- 개인정보 테이블을 브라우저에서 직접 전체 조회하지 않는다.

## 10.7 Supabase 권장 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_URL=
AI_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 10.8 Supabase가 적합한 경우

- 빠른 MVP 출시가 최우선인 경우
- 관리자 인증을 빨리 구현해야 하는 경우
- DB 운영 부담을 줄이고 싶은 경우
- 향후 고객 로그인과 사용자별 권한이 필요한 경우
- 서버 인프라보다 서비스 검증에 집중하려는 경우

---

# 11. DB 시나리오 B: WEBAGENT 전용 PostgreSQL 자체 구축

## 11.1 구성 개요

```text
사용자
  ↓
Next.js
  ↓
Next.js 서버 API
  ↓
WEBAGENT 전용 PostgreSQL
  ↓
n8n
  ↓
AI API / Telegram / Email
```

## 11.2 권장 구성

```text
Frontend          Next.js
Database          PostgreSQL
ORM               Drizzle ORM 또는 Prisma
Authentication    Auth.js 또는 자체 관리자 인증
Storage           로컬 볼륨 또는 S3 호환 스토리지
Automation        n8n
AI                OpenAI 또는 Gemini
Infrastructure    Contabo VPS + Docker
```

## 11.3 장점

- DB 데이터가 사용자 서버에 존재한다.
- Supabase 사용료가 발생하지 않는다.
- 기존 Contabo·Docker 운영 경험을 활용할 수 있다.
- n8n과 내부 네트워크 연결이 쉽다.
- DB 구조와 백업 정책을 직접 결정할 수 있다.
- 고객·상담·프로젝트 관계형 데이터에 적합하다.
- 향후 CRM과 고객 포털 확장에 유리하다.
- 외부 DB 서비스 정책에 영향을 적게 받는다.

## 11.4 단점

- PostgreSQL 설치와 업데이트를 직접 관리해야 한다.
- 백업과 복원 체계를 직접 구축해야 한다.
- 인증과 권한 관리를 직접 구현해야 한다.
- 서버 장애 시 서비스와 DB가 동시에 영향을 받을 수 있다.
- 디스크·메모리·로그·보안을 직접 모니터링해야 한다.

## 11.5 권장 Docker 구조

```text
webagent stack
│
├─ webagent-app
├─ webagent-db
├─ optional-redis
└─ internal-network

n8n stack
│
├─ n8n
├─ n8n-worker
├─ n8n-db
└─ n8n-network
```

WEBAGENT DB와 n8n 내부 DB는 반드시 분리한다.

```text
PostgreSQL
├─ n8n_db
│  └─ n8n 내부 데이터 전용
└─ webagent_db
   ├─ leads
   ├─ diagnoses
   ├─ diagnosis_results
   ├─ consultations
   └─ automation_logs
```

가능하면 DB 컨테이너도 별도로 분리한다.

## 11.6 Docker Compose 예시

```yaml
services:
  webagent-db:
    image: postgres:17-alpine
    container_name: webagent-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: webagent
      POSTGRES_USER: webagent_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - webagent_postgres_data:/var/lib/postgresql/data
    networks:
      - webagent-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U webagent_user -d webagent"]
      interval: 10s
      timeout: 5s
      retries: 5

  webagent-app:
    build: .
    container_name: webagent-app
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL}
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

## 11.7 자체 PostgreSQL 보안 원칙

- PostgreSQL `5432` 포트를 외부에 공개하지 않는다.
- Next.js와 n8n은 Docker 내부 네트워크로 접근한다.
- DB 전용 사용자를 생성한다.
- 운영용 DB와 개발용 DB를 분리한다.
- `.env` 파일을 Git 저장소에 포함하지 않는다.
- 최소 권한 원칙을 적용한다.
- 개인정보는 필요한 항목만 수집한다.
- 로그에 이메일·전화번호를 그대로 남기지 않는다.

## 11.8 백업 정책

### 기본 정책

```text
WEBAGENT PostgreSQL
→ 매일 pg_dump
→ 압축
→ 외부 스토리지 전송
→ 보관 기간에 따라 자동 삭제
```

### 권장 보관

- 일간 백업: 7일
- 주간 백업: 4주
- 월간 백업: 6개월

### 필수 항목

- 같은 VPS에만 백업하지 않는다.
- 월 1회 복원 테스트를 한다.
- DB 업데이트 전에 수동 백업한다.
- 백업 로그와 실패 알림을 Telegram으로 전송한다.

## 11.9 자체 PostgreSQL이 적합한 경우

- Contabo VPS를 장기 운영할 계획인 경우
- Docker·PostgreSQL 관리가 가능한 경우
- 외부 서비스 종속을 줄이고 싶은 경우
- 고정 서버 비용 안에서 운영하고 싶은 경우
- DB와 개인정보를 직접 통제하고 싶은 경우
- 향후 고객·프로젝트·CRM 데이터를 확장할 경우

---

# 12. 두 DB 방식 비교

| 기준 | Supabase | 전용 PostgreSQL |
|---|---|---|
| MVP 개발 속도 | 매우 빠름 | 보통 |
| 초기 설정 | 쉬움 | 직접 구성 |
| DB 운영 | Supabase 관리 | 직접 관리 |
| 인증 | Supabase Auth | 직접 구현 |
| 자동 API | 기본 제공 | Next.js API 구현 |
| 관리자 화면 | 기본 DB 콘솔 제공 | 별도 구현 |
| RLS | 기본 지원 | 앱·DB 권한 직접 설계 |
| 파일 저장 | Storage 제공 | 별도 스토리지 필요 |
| n8n 연결 | 쉬움 | 매우 쉬움 |
| 백업 | 플랜에 따라 제공 | 직접 구성 |
| 장애 책임 | 외부 서비스와 분산 | 사용자 서버 책임 |
| 비용 구조 | 사용량 기반 | VPS 비용 중심 |
| 데이터 통제 | 높음 | 매우 높음 |
| 확장성 | 높음 | 높음 |
| 운영 난이도 | 낮음 | 중간 |
| 현재 사용자 환경 적합성 | 높음 | 매우 높음 |

---

# 13. 데이터 모델

두 DB 방식 모두 동일한 논리 구조를 사용한다.

## 13.1 leads

```text
id
company_name
industry
employee_count
contact_name
email
phone
consulting_method
created_at
updated_at
```

## 13.2 diagnoses

```text
id
lead_id
website_status
current_tools
repetitive_tasks
daily_hours
monthly_volume
pain_point
budget_range
raw_answers
status
created_at
updated_at
```

## 13.3 diagnosis_results

```text
id
diagnosis_id
automation_score
recommended_tasks
estimated_saved_hours_min
estimated_saved_hours_max
difficulty
recommended_stack
implementation_steps
ai_summary
raw_ai_result
created_at
```

## 13.4 consultations

```text
id
lead_id
diagnosis_id
preferred_date
consultation_type
status
memo
created_at
updated_at
```

## 13.5 automation_logs

```text
id
diagnosis_id
workflow_name
execution_id
status
error_message
started_at
finished_at
```

## 13.6 JSONB 사용

다음 항목은 PostgreSQL `jsonb` 타입을 권장한다.

- 진단 원본 답변
- 선택 도구 목록
- 반복 업무 목록
- AI 추천 결과
- 추천 기술 스택
- 구축 단계
- n8n 실행 메타데이터

관계가 중요한 고객·상담·프로젝트 정보는 일반 컬럼과 외래키로 관리한다.

---

# 14. AI 응답 구조

AI 응답은 자유 형식 문장이 아니라 JSON으로 받는다.

```json
{
  "automationScore": 72,
  "priorityTasks": [
    {
      "name": "고객 문의 자동화",
      "reason": "월간 문의량이 많고 수동 확인 시간이 큽니다.",
      "difficulty": "낮음",
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
    "담당자 알림 자동화",
    "AI 문의 분류",
    "답변 초안 생성"
  ],
  "summary": "고객 문의와 견적 업무부터 자동화하는 것이 효과적입니다."
}
```

---

# 15. 관리자 기능

```text
/admin
├─ 로그인
├─ 진단 목록
├─ 진단 상세
├─ 상담 신청 목록
├─ 고객 상태 변경
└─ 자동화 실행 상태
```

## 15.1 고객 상태값

```text
신규
연락 대기
상담 예정
제안서 발송
계약
보류
종료
```

## 15.2 Supabase 방식

- Supabase Auth로 관리자 로그인
- RLS로 관리자 권한 제한
- Next.js 관리자 페이지에서 데이터 조회

## 15.3 자체 PostgreSQL 방식

- Auth.js 또는 단일 관리자 계정 인증
- 서버 세션 기반 접근 제어
- ORM을 통해 DB 조회
- 관리자 API는 서버에서만 실행

---

# 16. 자동화 데모

## 16.1 문의 자동화

```text
문의 폼 제출
→ AI 문의 유형 분류
→ 고객 DB 저장
→ 담당자 Telegram 알림
→ 접수 이메일 발송
→ 답변 초안 생성
```

## 16.2 견적 자동화

```text
견적 요청
→ 요구사항 분석
→ 추가 질문 생성
→ 견적서 초안 작성
→ 관리자 검토
→ 고객 발송
```

## 16.3 콘텐츠 자동화

```text
키워드 입력
→ 자료 수집
→ AI 초안 생성
→ 이미지 준비
→ WordPress 임시글 등록
→ 관리자 검수
→ 예약 발행
```

---

# 17. 개발 일정

## 1주차: 기획과 UI

- IA 확정
- 메인 카피 작성
- Figma 와이어프레임
- Next.js 프로젝트 생성
- DB 시나리오 최종 선택
- 데이터 모델 확정

## 2주차: 랜딩페이지와 진단 폼

- 랜딩페이지 구현
- 단계형 진단 폼 구현
- 유효성 검사
- DB 저장
- 반응형 적용

## 3주차: n8n과 AI 분석

- n8n Webhook 연결
- AI 프롬프트 설계
- JSON 결과 생성
- 분석 결과 저장
- 결과 페이지 구현
- Telegram 알림

## 4주차: 관리자·SEO·배포

- 관리자 화면
- 결과 이메일
- 상담 신청
- 개인정보처리방침
- GA4·Clarity
- SEO 메타데이터
- Docker 배포
- 전체 QA

## 자체 PostgreSQL 선택 시 추가 작업

- DB 컨테이너 구성
- 내부 네트워크 설정
- 백업 스크립트
- 외부 백업 저장소 연결
- 복원 테스트
- DB 모니터링

---

# 18. KPI

| 지표 | 의미 |
|---|---|
| 진단 시작률 | 랜딩페이지 설득력 |
| 진단 완료율 | 폼 난이도 |
| 진단 후 상담 전환율 | 결과의 영업 효과 |
| 상담 후 제안 전환율 | 실제 영업 가능성 |
| 상담 후 계약 전환율 | 서비스 사업성 |
| 자동화 데모 체류시간 | 사례 이해도 |

## 초기 목표

- 방문자 대비 진단 시작률: 8% 이상
- 진단 시작 대비 완료율: 50% 이상
- 진단 완료 대비 상담 신청률: 15% 이상
- 상담 대비 유료 제안 전환율: 30% 이상

---

# 19. 최종 선택 기준

## Supabase 선택 권장

다음 조건이 우선이라면 Supabase를 선택한다.

- 최대한 빠르게 MVP를 출시해야 한다.
- 관리자 인증을 빠르게 구현해야 한다.
- DB 운영보다 서비스 검증에 집중하고 싶다.
- 향후 고객별 로그인 기능이 필요하다.
- 초기 인프라 구성을 최소화하고 싶다.

## 전용 PostgreSQL 선택 권장

다음 조건이 우선이라면 자체 PostgreSQL을 선택한다.

- Contabo VPS를 이미 운영하고 있다.
- Docker와 PostgreSQL 관리가 가능하다.
- 외부 서비스 비용과 종속을 줄이고 싶다.
- 개인정보와 데이터를 직접 통제하고 싶다.
- 향후 고객·상담·프로젝트 CRM으로 확장할 계획이다.

---

# 20. 최종 권고안

## 빠른 시장 검증이 최우선일 경우

```text
Next.js
+ Supabase
+ n8n
+ AI API
+ Telegram
```

Supabase를 활용해 진단·관리자 인증·데이터 저장을 빠르게 구현하고, 실제 고객 반응을 먼저 검증한다.

## 인프라 통제와 장기 운영이 최우선일 경우

```text
Next.js
+ WEBAGENT 전용 PostgreSQL
+ Drizzle ORM 또는 Prisma
+ n8n
+ AI API
+ Telegram
```

기존 Contabo·Docker 운영 경험을 활용해 별도의 PostgreSQL을 구축하고, WEBAGENT의 핵심 업무 데이터를 직접 관리한다.

## 현재 사용자 환경을 반영한 추천

사용자는 이미 Contabo VPS, Docker, n8n, PostgreSQL 운영 경험이 있으므로 **장기적으로는 WEBAGENT 전용 PostgreSQL 자체 구축 방식이 더 적합하다.**

다만 MVP를 가장 빠르게 출시하고 시장 반응을 우선 검증하고 싶다면, 1차는 Supabase로 시작한 뒤 표준 PostgreSQL 백업을 이용해 자체 DB로 이전하는 전략도 가능하다.

가장 중요한 것은 DB 제품 자체가 아니라 다음 전체 흐름을 먼저 완성하는 것이다.

```text
진단 폼
→ 데이터 저장
→ n8n
→ AI 분석
→ 결과 페이지
→ 관리자 알림
→ 상담 전환
```
