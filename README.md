# Top-down Quality Investment Dashboard

Macro · Sector ETF · Commodity · Quality Stock Allocation

탑다운으로 매크로 국면과 자산군 비중을 판단한 뒤, 섹터 ETF, 원자재 관련 기업, 퀄리티 대형주와 미드스몰캡 후보를 함께 검토하는 Next.js 대시보드입니다.

## 포함된 기능

- Macro Regime Summary, Asset Allocation View, Sector & ETF Allocation Board
- Quality Stock Candidates, Mid/Small Cap Quality Watchlist, Commodity & Resource Equity Monitor
- Risk & Valuation Alerts, Key Market Indicators, Data Reliability
- Goldilocks, Reflation, Slowdown, Stagflation 4분면 Macro Regime Matrix
- 자산군별 Overweight, Neutral+, Neutral, Neutral-, Underweight, Avoid 권고
- 퀄리티 종목별 Core Hold, Accumulate, Buy on Weakness, Valuation Watch, Trim, Avoid 액션
- 지표군별 Market Price, Flow, Macro, ETF, Fundamental, Commodity Reliability 분리 표시
- SQLite 시작용 스키마: `db/schema.sql`

## 실행

```powershell
npm.cmd install
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Cloudflare 배포

이 앱은 Cloudflare Workers static assets 방식으로 배포합니다.

```powershell
npm.cmd run deploy
```

GitHub 저장소와 Cloudflare Workers Builds를 연결하는 경우 Cloudflare 대시보드의 빌드 설정은 아래처럼 둡니다.

```text
Build command: npm run build
Deploy command: npx wrangler deploy
```

배포 대상 Worker 이름은 `stock`이며, 기본 Workers URL은 `https://stock.jo139988.workers.dev/`입니다.

CLI 배포 전에는 Cloudflare 계정 로그인이 필요합니다.

```powershell
npx wrangler login
```
