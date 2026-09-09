# n8n-v2 WEBAGENT 워크플로우 연결 가이드

최종 확인: 2026-09-09

이 문서는 현재 PC에 실행 중인 n8n 인스턴스 중 `n8n-v2`를 WEBAGENT.KR의 진단 워크플로우와 연결하는 방법을 정리한다. 실제 secret과 credential은 이 문서나 workflow JSON에 저장하지 않는다.

## 1. 현재 PC의 n8n 구성

| 컨테이너 | 이미지 | 접속 | WEBAGENT 용도 |
|---|---|---|---|
| `n8n-v2` | `n8nio/n8n:2.12.2` | `http://localhost:8678` | 재사용 권장 |
| `n8n-v2-runners` | `n8nio/runners:custom-test` | Docker 내부 `5680/tcp` | Code 노드 실행용, 직접 연결하지 않음 |
| `n8n` | `n8nio/n8n:1.123.7` | `http://localhost:5678` | 구버전이므로 사용하지 않음 |
| `n8n-v1-postgres-1` | `postgres:16-alpine` | Docker 내부 `5432/tcp` | 구버전 n8n 전용 DB |

`n8n-v2`는 PostgreSQL과 external task runner를 사용하는 별도 Compose 프로젝트다.

- Compose 디렉터리: `/Users/joymacmini/N8N_Server/N8N-V2`
- Compose 파일: `/Users/joymacmini/N8N_Server/N8N-V2/docker-compose.yml`
- Docker network: `n8n-v2_n8n-v2-network`
- n8n DB: `postgresdb`
- runner: `N8N_RUNNERS_ENABLED=true`, `N8N_RUNNERS_MODE=external`

WEBAGENT 연결에 필요한 `N8N_WEBHOOK_SECRET`, `INTERNAL_API_SECRET`, `WEBAGENT_CALLBACK_URL`은 현재 `n8n-v2` 컨테이너에 설정되어 있지 않다.

## 2. 권장 연결 구조

```text
사용자
  → Next.js :3001
  → n8n-v2 :8678/webhook/webagent-diagnosis
  → 로컬 분석 또는 실제 AI
  → Next.js :3001/api/internal/diagnosis-result
  → PostgreSQL 결과 저장
  → Telegram 진단 완료 알림
```

- Next.js → n8n: `x-webhook-secret`
- n8n → Next.js callback: `x-internal-api-secret`
- n8n이 WEBAGENT PostgreSQL에 직접 접속하지 않고 내부 callback API를 통해 결과를 저장한다.
- Telegram 알림은 n8n이 아니라 Next.js callback·상담 API가 보낸다.

## 3. n8n-v2 Compose 설정

`/Users/joymacmini/N8N_Server/N8N-V2/docker-compose.yml`의 `x-n8n.environment`에 다음 항목을 추가한다.

```yaml
- N8N_BLOCK_ENV_ACCESS_IN_NODE=false
- N8N_WEBHOOK_SECRET
- INTERNAL_API_SECRET
- WEBAGENT_CALLBACK_URL
```

같은 디렉터리의 Git 제외 `.env`에 실제 값을 설정한다.

```dotenv
N8N_WEBHOOK_SECRET=<강한 임의값>
INTERNAL_API_SECRET=<다른 강한 임의값>
WEBAGENT_CALLBACK_URL=http://host.docker.internal:3001/api/internal/diagnosis-result
```

두 secret은 서로 다른 값을 사용한다. `n8n-v2-runners`는 현재 로컬 분석 Code 노드만 실행하며 secret 표현식은 n8n 메인 프로세스에서 처리하므로, WEBAGENT secret을 runner에 별도로 주입하지 않는다.

로컬 PC 외부에서 n8n에 접속할 필요가 없다면 포트를 loopback에만 바인딩한다.

```yaml
ports:
  - "127.0.0.1:8678:5678"
```

현재 `0.0.0.0:8678` 바인딩은 같은 네트워크의 다른 기기에서 접속될 수 있으므로 의도한 구성인지 확인한다.

## 4. n8n-v2 재시작

변경 전에 기존 workflow와 n8n PostgreSQL을 백업한다. 그런 다음 n8n 서비스를 재생성한다.

```bash
cd /Users/joymacmini/N8N_Server/N8N-V2
docker compose up -d --force-recreate n8n
```

재시작 후 설정 여부만 확인하고 secret 값은 출력하지 않는다.

## 5. WEBAGENT workflow import·publish

n8n 관리 화면 `http://localhost:8678`에서 **Import from File**을 선택하고 다음 파일을 import한다.

```text
/Users/joymacmini/projects/webagent-project/docker/n8n/workflows/webagent-diagnosis-local.json
```

workflow 이름은 `WEBAGENT Diagnosis Local`이다. 주요 노드는 다음과 같다.

1. `Diagnosis Webhook`
2. `Verify Webhook Secret`
3. `Build Local Structured Analysis`
4. `Save Diagnosis Result`
5. `Respond Completed` 또는 `Respond Unauthorized`

import 후 workflow를 저장하고 **Publish**한다. n8n의 테스트 Webhook URL은 `Listen for Test Event`가 활성화된 동안만 작동하며, production Webhook URL은 workflow를 publish한 후 등록된다.

```text
http://localhost:8678/webhook/webagent-diagnosis
```

참고: [n8n Webhook 공식 문서](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## 6. WEBAGENT `.env` 연결

`/Users/joymacmini/projects/webagent-project/.env`에 다음을 설정한다.

```dotenv
N8N_DIAGNOSIS_WEBHOOK_URL=http://localhost:8678/webhook/webagent-diagnosis
N8N_WEBHOOK_SECRET=<n8n-v2와 동일한 값>
INTERNAL_API_SECRET=<n8n-v2와 동일한 값>
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

| 용도 | n8n-v2 | WEBAGENT |
|---|---|---|
| Webhook 요청 인증 | `N8N_WEBHOOK_SECRET` | `N8N_WEBHOOK_SECRET` |
| callback 인증 | `INTERNAL_API_SECRET` | `INTERNAL_API_SECRET` |
| n8n production Webhook | `WEBHOOK_URL=http://localhost:8678` | `N8N_DIAGNOSIS_WEBHOOK_URL` |
| Next.js callback | `WEBAGENT_CALLBACK_URL` | `/api/internal/diagnosis-result` |

현재 로컬 검증 기준은 Next.js `3001`, n8n `8678`이다. Next.js를 `3000`에서 실행하려면 `WEBAGENT_CALLBACK_URL`과 `NEXT_PUBLIC_SITE_URL`도 함께 `3000`으로 변경한다.

## 7. 로컬 실행과 전체 왕복 검증

```bash
cd /Users/joymacmini/projects/webagent-project
docker compose up -d webagent-db
npm run db:migrate
npm run dev -- --port 3001
```

진단 폼을 한 번 제출하고 다음을 확인한다.

- n8n `Executions`에 workflow 실행 성공 기록이 있다.
- WEBAGENT 제출 응답의 `n8nStatus`가 `delivered`다.
- 진단 상태가 `SUBMITTED → PROCESSING → COMPLETED`로 전환된다.
- `diagnosis_results`에 structured output이 저장된다.
- 결과 화면에 점수·요약·추천 업무·절감 시간·기술 스택·구축 단계가 표시된다.
- Telegram에 진단 완료 알림이 도착한다.
- 같은 멱등 키 재전송이 새 DB 행과 중복 알림을 만들지 않는다.

## 8. 버전과 실제 AI 전환 주의사항

- 저장소의 workflow는 n8n `2.37.10`에서 검증했다. `n8n-v2` `2.12.2`에 import한 뒤 노드 호환성과 callback 왕복을 반드시 재검증한다.
- n8n 메인 이미지를 업그레이드할 때 external runner도 호환되는 이미지로 함께 재빌드·검증한다.
- `Build Local Structured Analysis`는 외부 AI 키 없이 전체 왕복을 검증하기 위한 결정론적 로컬 분석기다.
- 운영 전에 해당 노드를 OpenAI 또는 Gemini 노드와 structured output parser로 교체한다.
- AI API key는 n8n Credential Store에만 저장하고 workflow JSON이나 Next.js 환경 변수에 넣지 않는다.
- callback JSON은 `lib/validators/diagnosis-result.ts`의 계약을 그대로 따른다.

## 9. 대안: 프로젝트 전용 n8n 사용

기존 `n8n-v2`의 다른 workflow에 영향을 주지 않으려면 WEBAGENT 저장소의 전용 `webagent-n8n` 컨테이너를 사용한다.

```bash
cd /Users/joymacmini/projects/webagent-project
docker compose --profile automation up -d
docker compose --profile automation exec -T webagent-n8n \
  n8n import:workflow --input=/workflows/webagent-diagnosis-local.json
docker compose --profile automation exec -T webagent-n8n \
  n8n publish:workflow --id=JQYlR9kR0Zx2webA
```

이 경우 n8n은 `http://localhost:5679`에서 실행되며 저장소에서 실제 왕복을 검증한 기준 버전 `2.37.10`을 사용한다. 자세한 명령은 `docker/n8n/README.md`를 따른다.

## 10. 실행 전 체크리스트

- [ ] 기존 `n8n-v2` workflow·PostgreSQL 백업
- [ ] n8n-v2 Compose에 WEBAGENT 환경 변수 전달 설정 추가
- [ ] n8n-v2 `.env`와 WEBAGENT `.env`의 두 secret 일치 확인
- [ ] `n8n-v2` 재생성 후 health 확인
- [ ] workflow import·저장·publish
- [ ] production Webhook URL을 WEBAGENT에 설정
- [ ] 잘못된 Webhook secret의 HTTP 401 확인
- [ ] 진단 제출·callback·DB 저장·결과 화면·Telegram 전체 왕복 확인
- [ ] 동일 멱등 키 재전송의 중복 방지 확인
- [ ] secret, credential, 원문 AI 응답이 Git·응답·오류 로그에 노출되지 않는지 확인
