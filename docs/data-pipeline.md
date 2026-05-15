# Data Pipeline Plan

This dashboard starts with a typed demo snapshot and is designed to switch to scheduled collectors without changing the UI contract.

## API Contract

- UI reads `GET /api/snapshot`
- Each indicator carries `source`, `lastUpdated`, `frequency`, `baseDate`, `stale`, and `access`
- Failed provider calls should return the last successful observation and mark it as `stale`

## Suggested Collection Schedule

| Group | Examples | Frequency | Timezone |
| --- | --- | --- | --- |
| Korea intraday | KOSPI, KOSDAQ, futures, investor flows | 1-5 min during session | Asia/Seoul |
| US intraday | S&P500, Nasdaq, futures, VIX, ETF flow | 1-5 min during session | America/New_York |
| Breadth | advancers/decliners, MA breadth, 52w highs/lows | daily after close | local exchange |
| Liquidity | Fed assets, TGA, RRP, bank reserves | daily/weekly | America/New_York |
| Credit | HY OAS, IG OAS, MOVE | daily | America/New_York |
| Macro | CPI, PCE, ISM, jobs, exports | release calendar | source timezone |
| Positioning | CFTC, AAII, FINRA margin debt | weekly/monthly | America/New_York |

## Scheduler Options

APScheduler works well for a Python collector service:

```python
from apscheduler.schedulers.blocking import BlockingScheduler

scheduler = BlockingScheduler(timezone="Asia/Seoul")
scheduler.add_job(collect_korea_market, "cron", minute="*/5", day_of_week="mon-fri")
scheduler.add_job(collect_us_market, "cron", minute="*/5", day_of_week="mon-fri", timezone="America/New_York")
scheduler.add_job(calculate_scores, "cron", minute="*/5")
scheduler.start()
```

For a server-only deployment, the same jobs can be expressed as cron entries that call collector endpoints or scripts.

## Source Notes

- Free-friendly: FRED, BLS, BEA, CFTC, AAII, New York Fed, US Treasury, Korea Customs Service
- Usually paid or license-sensitive: KRX full intraday feeds, CME futures, CBOE derived volatility products, ETF flow, index constituent breadth, lending balances
- Internal calculation: moving averages, RSI, MACD, Bollinger Band, ATR, distance from moving average, breadth scores, Net Liquidity Proxy
