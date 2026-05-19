-- SQLite-first schema for the top-down quality investment dashboard.
-- Every analytical table keeps tradeDate, lastUpdated, source, and status so it can
-- later move to PostgreSQL/TimescaleDB without losing freshness metadata.

-- Cloudflare D1 pipeline tables for scheduled snapshot generation.
-- Status values here follow the runtime pipeline contract:
-- live, delayed, stale, modeled, fallback, error.

create table if not exists latest_snapshots (
  id text primary key,
  generated_at text not null,
  payload text not null
);

create table if not exists latest_indicators (
  indicator_id text primary key,
  name text not null,
  category text not null,
  value real,
  change_1d real,
  change_5d real,
  change_20d real,
  data_date text,
  fetched_at text not null,
  source text not null,
  status text not null check (status in ('live', 'delayed', 'stale', 'modeled', 'fallback', 'error')),
  reliability_score real
);

create table if not exists indicator_history (
  date text not null,
  indicator_id text not null,
  value real,
  source text not null,
  status text not null check (status in ('live', 'delayed', 'stale', 'modeled', 'fallback', 'error')),
  fetched_at text not null,
  valid_from text,
  primary key (date, indicator_id, fetched_at)
);

create table if not exists etf_latest (
  ticker text primary key,
  name text not null,
  country text,
  category text,
  price real,
  return_1m real,
  return_3m real,
  return_6m real,
  return_1y real,
  aum real,
  trading_value real,
  fee real,
  tracking_error real,
  premium_discount real,
  data_date text,
  fetched_at text not null,
  status text not null check (status in ('live', 'delayed', 'stale', 'modeled', 'fallback', 'error'))
);

create table if not exists strategy_snapshot_history (
  generated_at text primary key,
  signal_date text not null,
  tradable_from text not null,
  macro_regime text,
  regime_confidence real,
  active_tilt_limit real,
  data_reliability real,
  recommended_assets text,
  risk_alerts text
);

create table if not exists portfolio_recommendation_history (
  generated_at text not null,
  benchmark_id text not null,
  asset text not null,
  target_weight real not null,
  action text not null,
  reason text,
  source_status text not null check (source_status in ('live', 'delayed', 'stale', 'modeled', 'fallback', 'error')),
  primary key (generated_at, benchmark_id, asset)
);

create table if not exists modeled_signal_history (
  id integer primary key autoincrement,
  generated_at text not null,
  model_name text not null,
  model_version text not null,
  signal_key text not null,
  value real,
  text_value text,
  input_data_date text,
  calculated_at text not null,
  confidence real,
  status text not null check (status in ('modeled', 'fallback', 'error'))
);

create table if not exists update_logs (
  id integer primary key autoincrement,
  job_name text not null,
  source text not null,
  started_at text not null,
  finished_at text,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error', 'live', 'delayed', 'stale', 'modeled', 'fallback', 'error')),
  rows_updated integer not null default 0,
  error_message text,
  next_run text,
  created_at text not null default (datetime('now'))
);

create table if not exists indicators (
  id text primary key,
  name text not null,
  market text not null check (market in ('global', 'korea', 'us', 'macro', 'KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  category text not null,
  value real,
  prevValue real,
  unit text,
  changePercent real,
  tradeDate text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  sourceUrl text,
  access text not null default 'free' check (access in ('free', 'paid', 'manual')),
  rawPayload text,
  createdAt text not null default (datetime('now'))
);

create index if not exists idx_indicators_market_category
  on indicators(market, category);

create table if not exists regime_scores (
  tradeDate text not null,
  market text not null check (market in ('global', 'korea', 'us', 'macro')),
  totalScore real not null,
  trendScore real not null,
  breadthScore real not null,
  liquidityScore real not null,
  creditScore real not null,
  flowScore real not null,
  sentimentScore real not null,
  change1D real,
  change5D real,
  change20D real,
  summary text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (tradeDate, market)
);

create table if not exists regime_score_components (
  id integer primary key autoincrement,
  tradeDate text not null,
  market text not null check (market in ('global', 'korea', 'us', 'macro')),
  scoreId text not null,
  component text not null check (component in ('trend', 'breadth', 'liquidity', 'ratesCredit', 'flow', 'sentimentVolatility')),
  metricName text not null,
  metricValue real,
  metricText text,
  contribution real,
  weight real,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  unique (tradeDate, market, scoreId, component, metricName)
);

create table if not exists themes (
  id text primary key,
  name text not null,
  market text not null check (market in ('korea', 'us')),
  linkedThemeId text,
  description text,
  leaderStocks text,
  followerStocks text,
  laggardStocks text,
  tradeDate text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error'))
);

create table if not exists theme_scores (
  tradeDate text not null,
  themeId text not null,
  theme text not null,
  market text not null check (market in ('korea', 'us')),
  themeScore real not null,
  return1D real,
  return5D real,
  return20D real,
  volumeRatio20D real,
  advancingRatio real,
  newHighCount20D integer,
  leaderContribution real,
  concentrationRisk integer not null default 0,
  koreaUsLinkageScore real,
  priceMomentumScore real not null,
  volumeExpansionScore real not null,
  advancingRatioScore real not null,
  newHighParticipationScore real not null,
  leaderStrengthScore real not null,
  qualityScore real not null,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (tradeDate, themeId)
);

create table if not exists stocks (
  ticker text primary key,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  themeId text,
  theme text,
  sector text,
  marketCap real,
  freeFloatMarketCap real,
  tradeDate text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error'))
);

create table if not exists stock_prices (
  tradeDate text not null,
  ticker text not null,
  close real not null,
  open real,
  high real,
  low real,
  volume real,
  tradingValue real,
  change1D real,
  return5D real,
  return20D real,
  return60D real,
  volumeRatio20D real,
  rsi14 real,
  ma20Position real,
  ma60Position real,
  ma120Position real,
  high52wProximity real,
  relativeStrength20D real,
  foreignFlow5D real,
  institutionFlow5D real,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, ticker)
);

create index if not exists idx_stock_prices_ticker_date
  on stock_prices(ticker, tradeDate desc);

create table if not exists stock_signals (
  tradeDate text not null,
  ticker text not null,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  theme text,
  close real,
  change1D real,
  return5D real,
  return20D real,
  return60D real,
  volumeRatio20D real,
  relativeStrength20D real,
  ma20Position real,
  ma60Position real,
  rsi14 real,
  foreignFlow5D real,
  institutionFlow5D real,
  signalType text not null check (signalType in ('Breakout', 'Pullback', 'Pullback Buy', 'Trend Leader', 'Momentum Fade', 'Reversal', 'Valuation Stretched', 'Fundamental Deterioration', 'Avoid')),
  signalScore real not null,
  reason text not null,
  actionTag text not null check (actionTag in ('Core Hold', 'Accumulate', 'Accumulate Watch', 'Buy on Weakness', 'Valuation Watch', 'Deep Dive Needed', 'Trim', 'Trim / Rebalance', 'Risk Review', 'Thesis Review', 'Position Sizing', 'Avoid')),
  riskComment text,
  candidateGroup text check (candidateGroup in ('Core Quality Candidate', 'Accumulate Watch', 'Risk Review Candidate')),
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (tradeDate, ticker, signalType)
);

create index if not exists idx_stock_signals_action_score
  on stock_signals(actionTag, signalScore desc);

create table if not exists stock_signals_history (
  id integer primary key autoincrement,
  signalTradeDate text not null,
  evaluationDate text,
  ticker text not null,
  signalType text not null,
  actionTag text not null,
  signalScore real,
  entryClose real,
  close5D real,
  close10D real,
  close20D real,
  close60D real,
  return5D real,
  return10D real,
  return20D real,
  return60D real,
  maxDrawdown20D real,
  maxDrawdown60D real,
  hit5D integer,
  hit10D integer,
  hit20D integer,
  hit60D integer,
  tradeDate text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  unique (signalTradeDate, ticker, signalType)
);

create table if not exists alerts (
  id text primary key,
  tradeDate text not null,
  severity text not null check (severity in ('Red', 'Orange', 'Yellow')),
  category text not null,
  title text not null,
  message text not null,
  triggerCondition text not null,
  releaseCondition text,
  suggestedAction text,
  affectedAssets text,
  affectedThemes text,
  affectedSignalTypes text,
  sourceIndicatorIds text,
  acknowledgedAt text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now'))
);

create index if not exists idx_alerts_date_severity
  on alerts(tradeDate desc, severity);

create table if not exists backtest_results (
  id text primary key,
  tradeDate text not null,
  targetType text not null check (targetType in ('signalType', 'theme', 'regime')),
  targetKey text not null,
  targetLabel text not null,
  holdingPeriod text not null check (holdingPeriod in ('5D', '10D', '20D', '60D')),
  averageReturn real,
  medianReturn real,
  hitRatio real,
  maxDrawdown real,
  profitLossRatio real,
  sampleSize integer not null default 0,
  bestCase real,
  worstCase real,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now')),
  unique (tradeDate, targetType, targetKey, holdingPeriod)
);

create table if not exists source_fetch_logs (
  id integer primary key autoincrement,
  tradeDate text,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  lastAttemptAt text not null,
  lastUpdated text not null,
  latencyMs integer,
  message text,
  affectedIndicatorIds text,
  createdAt text not null default (datetime('now'))
);

create table if not exists macro_regime_matrix (
  tradeDate text not null,
  regime text not null check (regime in ('Goldilocks', 'Reflation', 'Slowdown', 'Stagflation')),
  quadrant text not null,
  probability real not null,
  changeMoM real,
  preferredAssets text,
  preferredSectors text,
  avoidSectors text,
  recommendedEtfs text,
  keyRisks text,
  growthScore real,
  inflationScore real,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, regime)
);

create table if not exists asset_allocation (
  tradeDate text not null,
  assetClass text not null,
  currentSignal text not null check (currentSignal in ('Overweight', 'Neutral+', 'Neutral', 'Neutral-', 'Underweight', 'Avoid')),
  suggestedWeight real not null,
  previousWeight real,
  weightChange real,
  rationale text,
  riskLevel text check (riskLevel in ('Low', 'Medium', 'High')),
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, assetClass)
);

create table if not exists etf_allocation_scores (
  tradeDate text not null,
  ticker text not null,
  name text not null,
  assetClass text not null,
  sector text,
  macroFitScore real not null,
  trendScore real not null,
  valuationScore real not null,
  cycleScore real not null,
  liquidityScore real not null,
  drawdownRisk real not null,
  correlationToPortfolio real,
  allocationScore real not null,
  action text not null check (action in ('Overweight', 'Neutral+', 'Neutral', 'Neutral-', 'Underweight', 'Avoid')),
  rationale text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, ticker)
);

create table if not exists quality_stock_candidates (
  tradeDate text not null,
  ticker text not null,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  sector text,
  theme text,
  marketCap real,
  tradingValue real,
  qualityScore real not null,
  businessQualityScore real not null,
  financialQualityScore real not null,
  growthDurabilityScore real not null,
  valuationScore real not null,
  earningsRevisionScore real not null,
  momentumScore real,
  liquidityRisk real,
  balanceSheetRisk real,
  action text not null check (action in ('Core Hold', 'Accumulate', 'Buy on Weakness', 'Valuation Watch', 'Deep Dive Needed', 'Trim', 'Avoid')),
  investmentThesis text,
  keyRisk text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, ticker)
);

create table if not exists mid_small_quality_watchlist (
  tradeDate text not null,
  ticker text not null,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  sector text,
  theme text,
  marketCap real,
  tradingValue real,
  salesGrowth real,
  operatingMargin real,
  roe real,
  roic real,
  netDebtToEbitda real,
  fcfPositive integer,
  consensusRevisionUp integer,
  drawdownFrom52wHigh real,
  foreignInstitutionFlow real,
  liquidityRisk real,
  governanceRisk real,
  balanceSheetRisk real,
  earningsVisibilityRisk real,
  overhangRisk real,
  action text not null check (action in ('Core Hold', 'Accumulate', 'Buy on Weakness', 'Valuation Watch', 'Deep Dive Needed', 'Trim', 'Avoid')),
  investmentThesis text,
  keyRisk text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, ticker)
);

create table if not exists commodity_resource_monitor (
  tradeDate text not null,
  category text not null,
  underlyingCommodityTrend text,
  futuresCurve text,
  inventoryTrend text,
  dollarSensitivity text check (dollarSensitivity in ('Low', 'Medium', 'High')),
  chinaDemandSensitivity text check (chinaDemandSensitivity in ('Low', 'Medium', 'High')),
  relatedEtfs text,
  relatedStocks text,
  action text not null,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, category)
);

create table if not exists risk_valuation_alerts (
  id text primary key,
  tradeDate text not null,
  severity text not null check (severity in ('Red', 'Orange', 'Yellow')),
  trigger text not null,
  affectedAssetClasses text,
  affectedSectors text,
  affectedEtfs text,
  affectedStocks text,
  suggestedInvestorAction text,
  alertType text not null check (alertType in ('Tactical', 'Fundamental')),
  confidence real,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error'))
);

create table if not exists portfolio_construction (
  tradeDate text not null,
  bucket text not null check (bucket in ('Core Quality', 'Satellite Growth', 'Satellite Mid/Small Cap', 'Commodity/Resource', 'Sector ETF', 'Cash/Bonds')),
  suggestedWeight real not null,
  minWeight real not null,
  maxWeight real not null,
  currentRegimeFit real,
  rebalanceTrigger text,
  riskComment text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  primary key (tradeDate, bucket)
);

create table if not exists my_watchlist (
  id integer primary key autoincrement,
  asset text not null,
  assetType text not null check (assetType in ('ETF', 'Stock', 'Commodity', 'Asset Class')),
  region text not null check (region in ('US', 'Korea', 'Global', 'Macro')),
  targetWeight real,
  currentAction text not null check (currentAction in ('Overweight', 'Neutral+', 'Neutral', 'Neutral-', 'Underweight', 'Core Hold', 'Accumulate', 'Accumulate Watch', 'Buy on Weakness', 'Valuation Watch', 'Deep Dive Needed', 'Trim', 'Trim / Rebalance', 'Risk Review', 'Thesis Review', 'Position Sizing', 'Avoid')),
  currentScore real,
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  rebalanceNeeded text,
  keyRisk text,
  tradeDate text,
  lastUpdated text not null,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  createdAt text not null default (datetime('now')),
  unique (asset, tradeDate)
);

-- Point-in-time history for the 3-year reconstructed/live backtest engine.
-- These tables preserve the exact inputs shown by the dashboard on each date so
-- portfolio results can be replayed without accidentally using future data.

create table if not exists macro_snapshot_history (
  date text not null,
  indicator text not null,
  value real,
  change1D real,
  change5D real,
  change20D real,
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  source text not null,
  createdAt text not null default (datetime('now')),
  primary key (date, indicator)
);

create index if not exists idx_macro_snapshot_history_indicator_date
  on macro_snapshot_history(indicator, date desc);

create table if not exists macro_regime_history (
  date text primary key,
  goldilocksProbability real not null,
  reflationProbability real not null,
  slowdownProbability real not null,
  stagflationProbability real not null,
  selectedRegime text not null check (selectedRegime in ('Goldilocks', 'Reflation', 'Slowdown', 'Stagflation', 'Mixed')),
  confidence real not null,
  createdAt text not null default (datetime('now'))
);

create table if not exists asset_allocation_history (
  date text not null,
  assetClass text not null,
  suggestedWeight real not null,
  previousWeight real,
  currentWeight real,
  minWeight real,
  maxWeight real,
  signal text not null check (signal in ('Overweight', 'Neutral+', 'Neutral', 'Neutral-', 'Underweight', 'Avoid')),
  confidence real,
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (date, assetClass)
);

create index if not exists idx_asset_allocation_history_date
  on asset_allocation_history(date desc);

create table if not exists etf_score_history (
  date text not null,
  ticker text not null,
  allocationScore real not null,
  macroFit real not null,
  trend real not null,
  valuation real not null,
  cycle real not null,
  liquidity real not null,
  drawdownRisk real not null,
  action text not null check (action in ('Overweight', 'Neutral+', 'Neutral', 'Neutral-', 'Underweight', 'Avoid')),
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (date, ticker)
);

create index if not exists idx_etf_score_history_ticker_date
  on etf_score_history(ticker, date desc);

create table if not exists quality_stock_score_history (
  date text not null,
  ticker text not null,
  qualityScore real not null,
  businessQuality real not null,
  financialQuality real not null,
  growthDurability real not null,
  valuationScore real not null,
  earningsRevision real not null,
  liquidityRisk real,
  balanceSheetRisk real,
  action text not null check (action in ('Core Hold', 'Accumulate', 'Buy on Weakness', 'Valuation Watch', 'Deep Dive Needed', 'Trim', 'Avoid')),
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (date, ticker)
);

create index if not exists idx_quality_stock_score_history_ticker_date
  on quality_stock_score_history(ticker, date desc);

create table if not exists risk_alert_history (
  date text not null,
  alertType text not null,
  severity text not null check (severity in ('Red', 'Orange', 'Yellow')),
  affectedAssets text,
  affectedETFs text,
  affectedStocks text,
  suggestedAction text,
  confidence real,
  dataStatus text not null default 'Modeled' check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (date, alertType)
);

create index if not exists idx_risk_alert_history_date_severity
  on risk_alert_history(date desc, severity);

create table if not exists price_history (
  date text not null,
  ticker text not null,
  open real,
  high real,
  low real,
  close real,
  adjustedClose real,
  totalReturn real,
  currency text not null check (currency in ('USD', 'KRW')),
  returnBasis text not null default 'Price Return' check (returnBasis in ('Total Return', 'Price Return')),
  source text not null,
  dataStatus text not null check (dataStatus in ('Live', 'Delayed', 'Stale', 'Modeled', 'Fallback', 'Error')),
  createdAt text not null default (datetime('now')),
  primary key (date, ticker, currency)
);

create index if not exists idx_price_history_ticker_date
  on price_history(ticker, date desc);

create table if not exists portfolio_backtest_results (
  date text not null,
  strategyName text not null,
  portfolioValue real not null,
  dailyReturn real,
  cumulativeReturn real,
  drawdown real,
  turnover real,
  cashWeight real,
  currency text not null check (currency in ('USD', 'KRW')),
  benchmark text not null,
  rebalancePolicy text not null check (rebalancePolicy in ('Weekly', 'Monthly', 'Signal Change')),
  executionPrice text not null check (executionPrice in ('Next Open', 'Next Close')),
  transactionCostBps real not null,
  fxCostBps real not null,
  confidence text not null check (confidence in ('High', 'Medium', 'Low')),
  createdAt text not null default (datetime('now')),
  primary key (date, strategyName, currency, benchmark, rebalancePolicy, executionPrice)
);

create index if not exists idx_portfolio_backtest_results_strategy_date
  on portfolio_backtest_results(strategyName, date desc);
