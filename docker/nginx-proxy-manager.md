# Nginx Proxy Manager와 rate limit IP 계약

운영 요청 경로는 `Cloudflare → Nginx Proxy Manager → webagent-app:3000`으로 고정합니다. `webagent-app`은 호스트 포트를 공개하지 않고 Nginx Proxy Manager와 공유하는 비공개 Docker 네트워크에서만 접근할 수 있어야 합니다.

## 애플리케이션 계약

- 기본값 `RATE_LIMIT_TRUST_PROXY=false`에서는 전달 헤더를 모두 무시하고 하나의 fail-closed 버킷을 사용합니다.
- 아래 프록시 설정과 직접 접근 차단을 적용한 운영 환경에서만 `RATE_LIMIT_TRUST_PROXY=true`로 설정합니다.
- 애플리케이션은 유효한 단일 `X-Real-IP`만 rate limit 키로 사용합니다. `X-Forwarded-For`와 잘못된 IP 값은 신뢰하지 않습니다.
- 현재 MVP는 단일 애플리케이션 인스턴스만 운영합니다. 다중 인스턴스로 확장하기 전에는 in-memory 저장소를 Redis의 원자적 증가·TTL 기반 공유 저장소로 교체해야 합니다.

## Nginx Proxy Manager 설정

Cloudflare 원본 인증서와 방화벽을 적용하고, 원본의 80·443 포트는 Cloudflare 공식 IP 대역에서만 접근할 수 있게 제한합니다. Cloudflare IP 대역은 고정 복사본으로 방치하지 않고 운영 점검 시 공식 목록과 동기화합니다.

Nginx의 real IP 설정은 `CF-Connecting-IP`를 Cloudflare 연결에서만 신뢰하도록 구성합니다. 각 Cloudflare IPv4·IPv6 대역을 `set_real_ip_from`으로 등록한 뒤 다음 전달 규칙을 적용합니다.

```nginx
real_ip_header CF-Connecting-IP;
real_ip_recursive on;

proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
```

이 설정에서 Nginx는 외부 요청이 보낸 기존 `X-Real-IP`와 `X-Forwarded-For`를 전달하지 않고 계산된 주소로 덮어씁니다. Cloudflare를 우회한 원본 접근과 앱 컨테이너 직접 접근이 차단되지 않았다면 `RATE_LIMIT_TRUST_PROXY=true`를 사용하면 안 됩니다.

## 배포 확인

1. 외부에서 앱 컨테이너의 3000 포트에 직접 연결할 수 없는지 확인합니다.
2. Nginx를 거친 요청에서 `X-Real-IP`가 실제 클라이언트 IP 한 개로 전달되는지 확인합니다.
3. 외부 요청의 `X-Forwarded-For` 값을 변경해도 동일 클라이언트의 제한 버킷이 달라지지 않는지 확인합니다.
4. 관리자 로그인 6번째 실패와 공개 제출 11번째 요청이 429 및 `Retry-After`를 반환하는지 확인합니다.
