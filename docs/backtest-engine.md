# Three-Year Backtest Engine Design

This design turns the current Macro Cockpit + Top-down Allocation Dashboard into a point-in-time backtest system. The engine replays historical dashboard inputs, generates allocation signals, applies execution and cost assumptions, then calculates portfolio performance against benchmarks.

## Scope

- Lookback: recent 3 years.
- Currency: USD and KRW reporting.
- Rebalancing: weekly, monthly, or signal-change driven.
- Execution: next trading day open or next trading day close after signal generation.
- Costs: transaction cost default 0.15%, FX conversion cost default 0.20%.
- Return basis: total return preferred. Price-return runs must show a dividend-data warning.

## Point-In-Time Inputs

The following history tables are required before the backtest can move from reconstructed to live-grade:

- `macro_snapshot_history`
- `macro_regime_history`
- `asset_allocation_history`
- `etf_score_history`
- `quality_stock_score_history`
- `risk_alert_history`
- `price_history`
- `portfolio_backtest_results`

Each date-stamped row must represent what the dashboard knew at that time. This prevents look-ahead bias from revised macro data, later fundamentals, or future price action.

## Strategy Rules

ETF Allocation Strategy:

- `allocationScore >= 75`: Overweight.
- `65-75`: Neutral+.
- `50-65`: Neutral.
- `40-50`: Neutral-.
- `< 40`: Underweight.
- If `drawdownRisk >= 70`, cap the maximum ETF weight.
- If `dataStatus = Error`, block new additions.
- If `dataStatus = Modeled`, apply a confidence haircut.

Asset Allocation Strategy:

- Use `asset_allocation_history.suggestedWeight` as target weight.
- If Macro Regime Confidence is below 65, keep a tactical cash buffer of at least 3-5%.
- If Data Reliability is below 85, reduce total risk-asset allocation by 5 percentage points.

Quality Stock Strategy:

- Include only stocks with `qualityScore >= 75`.
- Require `valuationScore >= 40`, `earningsRevisionScore >= 60`, `liquidityRisk <= 60`, and `balanceSheetRisk <= 60`.
- Include only actions `Core Hold`, `Accumulate`, or `Buy on Weakness`.
- Single stock cap: 5%.
- Mid/small cap single stock cap: 2%.
- Sector cap: 25%.
- If fundamentals are modeled, mark the run as low-confidence.

## Performance Outputs

The engine calculates:

- cumulative return
- CAGR
- annualized volatility
- Sharpe ratio
- Sortino ratio
- max drawdown
- Calmar ratio
- hit ratio
- best and worst month
- turnover
- transaction cost
- excess return versus benchmark

Charts:

- cumulative return
- monthly return heatmap
- drawdown chart
- asset-class weight changes
- sector contribution
- regime performance
- ETF contribution

Benchmarks:

- SPY
- QQQ
- 60/40 Portfolio
- ACWI
- KOSPI200
- custom benchmark

## Bias And Data Warnings

The backtest UI must show:

- reconstructed backtest warning when point-in-time data is incomplete
- low-confidence warning when modeled fundamentals are used
- next-day execution assumption to reduce look-ahead bias
- survivorship-bias removal status
- total-return versus price-return status
