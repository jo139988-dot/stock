# Market Regime Monitor

한국·미국 주식시장의 위험선호/위험회피 국면을 한눈에 보는 Next.js 대시보드입니다.

## 포함된 기능

- Market Pulse, Korea Dashboard, US Dashboard, Macro & Liquidity, Theme Monitor, Alerts, Data Source & Quality 화면
- 100점 만점 Market Regime Score 산식
- 가격, 선물, 내부강도, 수급, 금리, 유동성, 신용위험, 인플레이션, 테마, 이벤트 데이터 모델
- 모든 데이터 카드의 기준일, 업데이트 시간, 출처, 전일 대비 변화율 표시
- stale 데이터 경고, 무료/유료 데이터 구분
- `/api/snapshot` Next.js API route
- SQLite 시작용 스키마: `db/schema.sql`

## 실행

```powershell
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Cloudflare 배포

이 앱은 `/api/snapshot` route를 포함하므로 정적 Pages export가 아니라 Cloudflare Workers + OpenNext 방식으로 배포합니다.

```powershell
npm.cmd run deploy
```

GitHub 저장소와 Cloudflare Workers Builds를 연결하는 경우 Cloudflare 대시보드의 빌드 설정은 아래처럼 둡니다.

```text
Build command: npx @opennextjs/cloudflare build
Deploy command: npx @opennextjs/cloudflare deploy
```

`npm run build`는 Next.js 산출물만 만들기 때문에 Cloudflare 배포에는 충분하지 않습니다. OpenNext 빌드를 실행해야 `.open-next` 산출물이 생기고, 그 다음 deploy 단계가 성공합니다.

배포 대상 Worker 이름은 `stock`이며, 기본 Workers URL은 `https://stock.jo139988.workers.dev/`입니다.

CLI 배포 전에는 Cloudflare 계정 로그인이 필요합니다.

```powershell
npx wrangler login
```

## 데이터 확장 방향

초기 버전은 UI와 데이터 계약을 검증하기 위한 샘플 스냅샷을 사용합니다. 실데이터 전환 시에는 다음 순서가 자연스럽습니다.

1. `db/schema.sql`로 SQLite 데이터베이스 생성
2. KRX, FRED, CBOE, CFTC, FRED, BLS, BEA, 한국은행 등 수집기 추가
3. APScheduler 또는 cron으로 장중/일간/주간/월간 주기 분리
4. API 실패 시 `indicator_observations`의 마지막 정상 값을 반환하고 `quality_status='stale'` 처리
5. 데이터량이 커지면 PostgreSQL로 이전 후 `indicator_observations`, `market_scores`, `theme_momentum`를 TimescaleDB hypertable로 전환

## 점수 산식

- 가격 추세: 25점
- 시장 내부강도: 20점
- 유동성: 20점
- 금리·신용: 15점
- 수급: 10점
- 심리·변동성: 10점

점수 구간은 80~100 강한 위험선호, 60~79 완만한 상승, 40~59 중립/혼조, 20~39 위험관리, 0~19 강한 위험회피로 표시됩니다.
