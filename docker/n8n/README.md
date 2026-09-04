# n8n 로컬 진단 워크플로

`webagent-diagnosis-local.json`은 Webhook 인증, 구조화 결과 생성, Next.js callback 왕복을 로컬에서 검증하기 위한 워크플로입니다.

## 실행

```bash
docker compose --profile automation up -d webagent-n8n
docker compose --profile automation exec -T webagent-n8n \
  n8n import:workflow --input=/workflows/webagent-diagnosis-local.json
docker compose --profile automation exec -T webagent-n8n \
  n8n publish:workflow --id=JQYlR9kR0Zx2webA
```

workflow import 후 n8n을 재시작하고 `http://localhost:5679/webhook/webagent-diagnosis`를 사용합니다. 로컬 기본 포트 5678과의 충돌을 피하기 위해 호스트 포트는 5679를 사용합니다.

## 보안 계약

- Next.js → n8n: `x-webhook-secret`
- n8n → Next.js: `x-internal-api-secret`
- 두 secret은 `.env`에서만 주입하며 workflow JSON에 저장하지 않습니다.
- Webhook secret이 일치하지 않으면 callback을 호출하지 않고 HTTP 401을 반환합니다.

## 실제 AI 모델 연결

현재 `Build Local Structured Analysis` 노드는 외부 AI 키 없이 전체 왕복을 검증하기 위한 결정론적 로컬 분석기입니다. 운영 전에는 이 노드를 OpenAI 또는 Gemini 호출과 structured output parser로 교체하되, callback JSON은 `lib/validators/diagnosis-result.ts` 계약을 그대로 따라야 합니다.

AI credential은 n8n credential store에만 저장하고 workflow JSON이나 Next.js 환경 변수에 넣지 않습니다.
