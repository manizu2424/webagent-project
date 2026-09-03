# Repository Guidelines

## 프로젝트 구조 및 모듈 구성

이 저장소는 WEBAGENT.KR MVP의 기획 문서와 Next.js App Router 기반 앱 골격을 포함합니다.

- `docs/consolidated/01-MVP_통합_제품기획서.md`: 제품 포지셔닝, 타깃 고객, 기능 범위, 사용자 흐름의 단일 기준.
- `docs/consolidated/02-데이터베이스_아키텍처_선택지.md`: Supabase와 자체 PostgreSQL의 비교 및 선택 근거.
- `docs/consolidated/03-PostgreSQL_MVP_개발실행서.md`: Next.js, PostgreSQL, n8n 기반 구현 기준.
- `app/`: App Router 페이지와 향후 API routes.
- `components/`: layout, landing, diagnosis, admin, ui 컴포넌트.
- `lib/`, `db/`, `types/`, `docker/`: 공용 유틸, DB, 타입, 인프라 설정.

주요 아키텍처 결정은 `docs/consolidated/`의 통합 문서와 `README.md`의 개발 현황 및 다음 작업 목록과 일관되게 유지합니다.

## 빌드, 테스트, 개발 명령

현재 프로젝트는 npm 기반입니다. 주요 명령은 다음과 같습니다.

- `npm install`: 프로젝트 의존성 설치.
- `npm run dev`: 로컬 Next.js 개발 서버 실행.
- `npm run lint`: ESLint 검사 실행.
- `npm run build`: webpack 기반 Next.js 프로덕션 빌드 생성.
- `docker compose up -d`: 로컬 PostgreSQL 컨테이너 실행.
- `npm run db:generate`: Drizzle migration 생성.
- `npm run db:migrate`: Drizzle migration 적용.

테스트 스크립트는 아직 없습니다. 테스트 도구가 도입되기 전까지 `npm test`를 사용하지 않습니다.

## 코딩 스타일 및 이름 규칙

향후 구현에서는 TypeScript와 React 함수형 컴포넌트를 사용합니다. `AutomationDiagnosisForm`, `consultationRequest`, `analysisResult`처럼 도메인이 드러나는 명확한 이름을 선호합니다. 라우트 폴더와 파일 시스템 경로에는 kebab-case를, React 컴포넌트에는 PascalCase를 사용합니다.

한국어 비즈니스 문구는 기획 문서의 표현과 일관되게 유지합니다. 주석은 복잡한 워크플로, 외부 연동, 데이터 저장 동작처럼 코드만으로 의도가 분명하지 않은 경우에만 짧게 작성합니다.

## 테스트 지침

아직 테스트 프레임워크는 설정되어 있지 않습니다. 코드가 추가되면 핵심 MVP 흐름을 중심으로 테스트를 작성합니다. 대상은 진단 폼 제출, PostgreSQL 저장, n8n Webhook 호출, 분석 결과 조회, 상담 신청, 관리자 접근 제어입니다. 테스트 파일은 동작 기준으로 이름을 짓습니다. 예: `diagnosis-form-submits-valid-request.test.ts`.

## 커밋 및 풀 리퀘스트 지침

현재 디렉터리는 Git 저장소로 초기화되어 있지 않아 로컬 커밋 규칙을 추론할 수 없습니다. Git을 사용하게 되면 `Add diagnosis form schema`, `Document PostgreSQL deployment flow`처럼 짧은 명령형 커밋 메시지를 사용합니다.

풀 리퀘스트에는 간단한 요약, 영향을 받는 MVP 영역, 검증 절차, 연결된 이슈 또는 작업, UI 변경 시 스크린샷을 포함합니다.

## 보안 및 설정 팁

시크릿, 데이터베이스 URL, API 키, Telegram 토큰, n8n Webhook 인증 정보는 절대 커밋하지 않습니다. 환경 변수를 사용하고, 앱이 생성되면 필요한 변수명을 `.env.example` 같은 예시 파일에 문서화합니다.
