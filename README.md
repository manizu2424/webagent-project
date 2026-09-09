# WEBAGENT.KR MVP

WEBAGENT.KR은 중소기업의 반복 업무를 입력받아 AI 자동화 가능성을 진단하고, 분석 결과를 바탕으로 상담까지 연결하는 서비스입니다.

이 문서는 프로젝트 소개, 로컬 실행 방법, 구현 현황, 운영 원칙, 남은 작업을 관리하는 단일 기준 문서입니다. 세부 제품·DB·구현 결정은 저장소 루트의 번호별 기획 문서를 참고합니다.

## 기술 구성

- Next.js App Router, React, TypeScript
- Tailwind CSS, shadcn/ui 호환 컴포넌트 구조
- PostgreSQL, Drizzle ORM
- n8n Webhook 기반 AI 분석 연동
- Vitest, ESLint
- Docker, Docker Compose

## 주요 사용자 흐름

1. 사용자가 `/diagnosis`에서 5단계 진단 폼을 제출합니다.
2. 서버가 Zod로 입력값과 개인정보 동의를 검증합니다.
3. PostgreSQL의 `leads`, `diagnoses`에 데이터를 저장합니다.
4. `N8N_DIAGNOSIS_WEBHOOK_URL`이 설정되어 있으면 n8n Webhook을 호출합니다.
5. n8n이 AI 분석을 수행하고 `/api/internal/diagnosis-result`로 결과를 전송합니다.
6. 결과 저장 후 진단 상태가 `COMPLETED`로 변경됩니다.
7. `/diagnosis/result/[publicId]`에서 결과를 보여주고 상담 신청으로 연결합니다.

n8n URL이 설정되지 않은 로컬 환경에서는 진단 데이터만 저장되고 Webhook 호출은 `skipped`로 처리됩니다.
현재 PC에서 실행 중인 `n8n-v2:8678`을 재사용하는 방법은 [`04-n8n-v2_WEBAGENT_연결가이드.md`](docs/consolidated/04-n8n-v2_WEBAGENT_연결가이드.md)를 따릅니다. 이 연결은 구성 조사와 문서화만 완료됐고, 외부 Compose·환경 변수·workflow는 아직 변경하지 않았습니다.

## 구현 범위

### 화면

| 경로 | 기능 |
| --- | --- |
| `/` | 랜딩 페이지 |
| `/diagnosis` | 5단계 자동화 진단 폼 |
| `/diagnosis/result/[publicId]` | 진단 처리 상태 및 결과 |
| `/consultation` | 상담 신청 |
| `/privacy` | 개인정보처리방침 |
| `/admin/login` | 관리자 로그인 |
| `/admin/diagnoses` | 관리자 진단 목록 |
| `/admin/diagnoses/[publicId]` | 관리자 진단 상세 |
| `/admin/consultations` | 관리자 상담 목록 |
| `/admin/consultations/[id]` | 관리자 상담 상세·상태·메모 관리 |

### API

| 메서드 및 경로 | 기능 |
| --- | --- |
| `GET /api/health` | 앱 및 DB 연결 상태 확인 |
| `POST /api/diagnosis` | 멱등 키 기반 진단 제출 저장 및 n8n 호출 |
| `GET /api/diagnosis/[publicId]` | 공개 ID로 진단 결과 조회 |
| `POST /api/consultation` | 멱등 키 기반 상담 신청 저장 |
| `POST /api/internal/diagnosis-result` | n8n 분석 결과 저장 |

API 응답은 `{ ok: boolean, data?: unknown, error?: string }` 형식을 사용합니다.
두 공개 제출 API는 UUID 형식의 `Idempotency-Key` 요청 헤더를 필수로 사용합니다. 같은 키와 같은 요청을 재전송하면 새 행을 만들지 않고 기존 리소스를 반환하며, 같은 키에 다른 요청 내용이 오면 409를 반환합니다.

### 데이터 및 보안

- `leads`, `diagnoses`, `diagnosis_results`, `consultations`, `automation_logs` 테이블
- 단일 관리자 이메일·비밀번호 및 쿠키 세션 인증
- 관리자 route protection 및 검색 엔진 차단
- 내부 결과 API secret 검증
- 공개 POST API in-memory rate limit
- security headers, error boundary, 404 페이지
- validation, health API, internal secret, rate limit, admin auth 테스트
- 진단·독립 상담의 핵심 저장 transaction 및 제출 중복 방지

## 로컬 개발

### 요구 사항

- Node.js와 npm
- Docker 및 Docker Compose

### 처음 실행

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. DB 상태는 다음 명령으로 확인합니다.

```bash
curl http://localhost:3000/api/health
```

### 종료 및 재실행

개발 서버는 실행한 터미널에서 `Ctrl+C`로 종료합니다.

```bash
docker compose down
```

`docker compose down`은 PostgreSQL 데이터 볼륨을 삭제하지 않습니다. 이후에는 다음 순서로 다시 실행합니다.

```bash
docker compose up -d
npm run dev
```

### DB 작업

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

PostgreSQL은 로컬 개발 편의를 위해 `127.0.0.1:5432`에만 바인딩됩니다. 운영 환경에서는 DB 포트를 외부에 공개하지 않고 Docker 내부 네트워크로만 연결합니다.

## 환경 변수

`.env.example`을 복사해 `.env`를 만들고 필요한 값을 설정합니다.

| 변수 | 용도 |
| --- | --- |
| `POSTGRES_DB` | 로컬 PostgreSQL DB 이름 |
| `POSTGRES_USER` | 로컬 PostgreSQL 사용자 |
| `POSTGRES_PASSWORD` | 로컬 PostgreSQL 비밀번호 |
| `POSTGRES_PORT` | 로컬 PostgreSQL 포트 |
| `DATABASE_URL` | 애플리케이션 DB 연결 문자열 |
| `N8N_DIAGNOSIS_WEBHOOK_URL` | 진단을 전달할 n8n Webhook URL |
| `N8N_WEBHOOK_SECRET` | n8n 요청 인증 secret |
| `INTERNAL_API_SECRET` | 분석 결과 수신 API 인증 secret |
| `AUTH_SECRET` | 관리자 세션 서명 secret |
| `ADMIN_EMAIL` | 관리자 로그인 이메일 |
| `ADMIN_PASSWORD_HASH` | Argon2id 관리자 비밀번호 해시 |
| `NEXT_PUBLIC_SITE_URL` | 공개 사이트 기본 URL |
| `RATE_LIMIT_TRUST_PROXY` | 신뢰 프록시의 `X-Real-IP` 사용 여부 |
| `TELEGRAM_BOT_TOKEN` | 관리자 알림용 Telegram Bot token |
| `TELEGRAM_CHAT_ID` | 관리자 알림을 받을 Telegram chat ID |

관리자 비밀번호 해시는 다음 순서로 생성합니다. 비밀번호 입력은 화면과 shell history에 표시되지 않으며, 출력된 `$argon2id$...` 전체 값을 `ADMIN_PASSWORD_HASH`로 설정합니다.

```bash
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run auth:hash-password
unset ADMIN_PASSWORD
```

기존 `sha256:...` 값은 더 이상 로그인에 사용할 수 없습니다. 배포 전에 위 명령으로 새 해시를 생성해 저장소 밖의 환경 설정을 교체해야 합니다.

`.env`, DB 인증 정보, API 키, Telegram 토큰, n8n 인증 정보는 커밋하지 않습니다. 서버 전용 비밀값에는 `NEXT_PUBLIC_` 접두사를 사용하지 않습니다.

### Production Docker 이미지와 환경 변수

Docker 이미지는 실제 환경 파일 없이 빌드합니다. 저장소 루트의 `.dockerignore`가 `.env*`, 기존 `.next`, 로컬 `node_modules`, Git 메타데이터와 개발 전용 파일을 빌드 컨텍스트에서 제외합니다.

```bash
docker build --tag webagent:local .
```

서버 전용 설정과 secret은 이미지 빌드 인자나 Dockerfile에 넣지 않고 컨테이너 실행 시 주입합니다. 아래 환경 파일은 저장소 밖에서 생성하고 소유자만 읽을 수 있도록 관리합니다.

```bash
docker run --rm --init \
  --publish 3000:3000 \
  --env-file /absolute/path/to/webagent.production.env \
  webagent:local
```

배포 전에는 이미지 파일 시스템에 환경 파일이 없는지 확인합니다. 명령이 아무 경로도 출력하지 않아야 합니다.

```bash
docker run --rm --entrypoint sh webagent:local -c \
  'find /app -type f \( -name ".env" -o -name ".env.*" \) -print'
```

운영 Compose의 앱 서비스와 내부 DB 연결, healthcheck 구성은 별도 배포 작업에서 추가합니다. Docker 런타임 환경 변수는 Docker 데몬 권한이 있는 사용자에게 조회될 수 있으므로 호스트와 배포 계정 접근도 제한해야 합니다.

`RATE_LIMIT_TRUST_PROXY=true`는 Nginx Proxy Manager가 외부 전달 헤더를 덮어쓰고 앱의 3000 포트 직접 접근이 차단된 운영 환경에서만 사용합니다. 구체적인 계약과 배포 확인 절차는 [`docker/nginx-proxy-manager.md`](docker/nginx-proxy-manager.md)를 따릅니다. 현재 in-memory rate limit은 단일 앱 인스턴스 전용이며 다중 인스턴스 배포 전 Redis 기반 공유 제한으로 교체합니다.

## 검증

```bash
npm run lint
npm run test
npm run build
```

2026-09-09 로컬 검증 기준으로 ESLint, Vitest 18개 파일·112개 테스트, Next.js production build가 모두 통과했습니다. PostgreSQL migration, 독립 상담 저장, 진단·상담 중복 제출 방지, n8n 로컬 분석 callback 왕복과 production 컨테이너의 Argon2id 관리자 로그인을 실제 HTTP로 확인했습니다. 클라이언트 요청 복구, 결과 polling 상한, 관리자 상담 메모·상태 변경과 페이지 계산, AI 결과 검증, rate limit, 구조화 결과 표시, Telegram 알림의 성공·실패·중복 방지도 단위 검증했습니다. 교체한 Bot token의 인증과 429 해제, 진단 완료·상담 신청 알림의 실제 Telegram 채널 수신, 멱등 재전송의 DB 중복 방지를 확인했습니다.

## 개발 현황

### 완료

- [x] Next.js, TypeScript, Tailwind CSS 프로젝트 기반
- [x] 반응형 랜딩 페이지 및 공통 레이아웃
- [x] PostgreSQL, Drizzle schema 및 migration
- [x] 진단 제출, 결과 조회, 상담 신청 API
- [x] 5단계 진단 폼과 결과 상태 페이지
- [x] n8n Webhook 호출 경계, timeout, retry, 실패 시 데이터 보존
- [x] 내부 AI 결과 수신·검증·저장 API
- [x] 관리자 로그인, 접근 제어, 진단·상담 조회 및 상태 변경
- [x] 개인정보처리방침 및 기본 보안·오류 처리
- [x] lint, unit test, production build

### 개선 및 출시 작업

작업은 아래 순서로 진행합니다.

#### 우선 개선 순서

- [x] R1: Docker 빌드 컨텍스트와 이미지의 환경 파일 제외
- [x] R2: 독립 상담의 빈 진단 ID 정규화
- [x] R3: n8n callback과 제출 API 상태 경합 제거
- [x] R4: Argon2id 관리자 인증과 로그인 반복 시도 제한
- [x] R5: 개인정보·SQL 매개변수를 출력하지 않는 서버 오류 로그
- [x] R6: 핵심 저장 transaction, 중복 제출 방지와 로그 실패 정책
- [x] R7: 네트워크 오류 복구와 결과 polling 상한
- [x] R8: 관리자 상담 상세·연락처·메모·페이지 이동
- [x] R9: AI 결과의 엄격한 숫자 타입과 구현 단계 순서 검증
- [x] R10: 운영 프록시 계약과 rate limit 만료·저장소 상한 보완

#### 1. n8n 및 AI 분석 연결

- [x] n8n 진단 수신 Webhook과 `x-webhook-secret` 검증 설정
- [x] 로컬 `.env`에 n8n URL과 secret 설정
- [x] 진단 제출 시 `n8nStatus: "delivered"` 및 실패 시 DB 보존 확인
- [x] 로컬 분석용 structured output 필드 확정 및 생성
- [x] n8n에서 `/api/internal/diagnosis-result` callback 연결
- [x] 결과 저장 후 공개 결과 API의 `COMPLETED` 상태 확인
- [ ] 로컬 분석 노드를 운영용 실제 AI 모델과 credential로 교체

AI 결과에는 최소한 `diagnosisPublicId`, `automationScore`, `recommendedTasks`, `estimatedSavedHoursMin`, `estimatedSavedHoursMax`, `difficulty`, `recommendedStack`, `implementationSteps`, `aiSummary`, `modelName`을 포함합니다.

#### 2. 관리자 알림 및 실사용 설정

- [x] Telegram Bot으로 진단 완료 및 상담 신청 알림 코드 연결
- [x] 알림에 회사명, 담당자, 이메일, 진단·관리자 링크 포함
- [x] Telegram Bot API 인증 및 실제 진단·상담 메시지 수신 확인
- [ ] 운영용 `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` 설정
- [x] 관리자 로그인, 조회, 상태 변경의 실제 DB 반영 확인

#### 3. 배포 및 운영

- [ ] Docker production image 실행 검증
- [ ] production `.env` 분리
- [ ] Nginx Proxy Manager, Cloudflare DNS, HTTPS/SSL 설정
- [ ] `webagent.kr` 접속 확인
- [ ] PostgreSQL 외부 포트 비공개 재확인
- [ ] DB 자동 백업 스크립트와 복구 절차 준비 및 검증

#### 4. 핵심 E2E 테스트

- [x] 진단 제출 → PostgreSQL 저장 → n8n 로컬 workflow 호출
- [ ] AI 결과 저장 → 결과 페이지 표시
- [ ] 상담 신청 저장 → Telegram 알림 (실제 수동 왕복 완료, 자동화 미완료)
- [ ] 관리자 페이지의 진단 및 상담 조회

## MVP 완료 조건

- [x] 반응형 랜딩 페이지
- [x] 5단계 진단 폼
- [x] PostgreSQL 저장
- [x] 결과 및 상담 신청 페이지
- [x] 관리자 인증 및 진단 조회
- [x] 개인정보처리방침
- [x] PostgreSQL 로컬 포트 제한
- [x] lint, test, build 통과
- [x] 실제 n8n Webhook 및 로컬 분석 callback 왕복
- [x] 로컬 structured output 및 결과 DB 저장 검증
- [x] Telegram 관리자 알림
- [ ] 운영 Docker image 실행
- [ ] 도메인 및 HTTPS 연결
- [ ] DB 자동 백업 및 복구 검증
- [ ] 핵심 E2E 테스트 통과

## 관련 문서

- `docs/consolidated/README.md`: 통합 문서 구성과 적용 우선순위
- `docs/consolidated/01-MVP_통합_제품기획서.md`: 제품 포지셔닝, 대상 고객, MVP 범위와 사용자 흐름
- `docs/consolidated/02-데이터베이스_아키텍처_선택지.md`: 데이터베이스 구성안과 현재 선택 근거
- `docs/consolidated/03-PostgreSQL_MVP_개발실행서.md`: Next.js, PostgreSQL, n8n 구현 기준
- `docs/consolidated/04-n8n-v2_WEBAGENT_연결가이드.md`: 현재 PC의 n8n-v2 재사용·workflow import·callback 연결 가이드
- `AGENTS.md`: 저장소 작업 및 보안 지침
