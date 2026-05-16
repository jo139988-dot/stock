-- SQLite-first schema for Market Regime Monitor.
-- The date columns can become TimescaleDB hypertable time dimensions later.

create table if not exists indicators (
  id text primary key,
  name text not null,
  market text not null check (market in ('global', 'korea', 'us', 'macro', 'KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  category text not null,
  value real,
  prevValue real,
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
  date text not null,
  market text not null check (market in ('global', 'korea', 'us', 'macro')),
  totalScore real not null,
  trendScore real not null,
  breadthScore real not null,
  liquidityScore real not null,
  creditScore real not null,
  flowScore real not null,
  sentimentScore real not null,
  summary text,
  createdAt text not null default (datetime('now')),
  primary key (date, market)
);

create table if not exists theme_scores (
  date text not null,
  theme text not null,
  market text not null check (market in ('korea', 'us')),
  score real not null,
  momentumScore real not null,
  volumeScore real not null,
  breadthScore real not null,
  leaderScore real not null,
  qualityScore real not null,
  newsScore real default 0,
  concentrationRisk integer not null default 0,
  leaders text,
  followers text,
  laggards text,
  linkedThemes text,
  createdAt text not null default (datetime('now')),
  primary key (date, market, theme)
);

create table if not exists stock_signals (
  date text not null,
  ticker text not null,
  name text not null,
  market text not null check (market in ('KOSPI', 'KOSDAQ', 'NASDAQ', 'S&P500')),
  theme text,
  signalType text not null check (signalType in ('Breakout', 'Pullback', 'Trend Leader', 'Reversal', 'Overheated', 'Breakdown')),
  score real not null,
  reason text not null,
  actionTag text not null check (actionTag in ('Buy Watch', 'Hold', 'Take Profit', 'Avoid')),
  price real,
  change1d real,
  change5d real,
  change1m real,
  volumeRatio real,
  rsi real,
  relativeStrength real,
  fundFlow text,
  createdAt text not null default (datetime('now')),
  primary key (date, ticker, signalType)
);

create index if not exists idx_stock_signals_market_score
  on stock_signals(market, score desc);

create table if not exists alerts (
  date text not null,
  severity text not null check (severity in ('Red', 'Orange', 'Yellow')),
  category text not null,
  title text not null,
  message text not null,
  triggerCondition text not null,
  releaseCondition text,
  affectedAssets text,
  sourceIndicatorIds text,
  acknowledgedAt text,
  createdAt text not null default (datetime('now'))
);

create index if not exists idx_alerts_date_severity
  on alerts(date desc, severity);

create table if not exists alert_rules (
  id text primary key,
  name text not null,
  severity text not null check (severity in ('Red', 'Orange', 'Yellow')),
  category text not null,
  triggerCondition text not null,
  releaseCondition text,
  affectedAssets text,
  enabled integer not null default 1,
  createdAt text not null default (datetime('now')),
  updatedAt text
);

create table if not exists source_fetch_logs (
  id integer primary key autoincrement,
  source text not null,
  status text not null check (status in ('Fresh', 'Delayed', 'Stale', 'Error')),
  lastAttemptAt text not null,
  latencyMs integer,
  message text,
  affectedIndicatorIds text,
  createdAt text not null default (datetime('now'))
);

create table if not exists signal_backtest_results (
  id integer primary key autoincrement,
  date text not null,
  signalType text not null check (signalType in ('Breakout', 'Pullback', 'Trend Leader', 'Reversal', 'Overheated', 'Breakdown')),
  horizonDays integer not null check (horizonDays in (20, 60)),
  sampleSize integer not null default 0,
  hitRatio real,
  averageReturn real,
  maxDrawdown real,
  createdAt text not null default (datetime('now')),
  unique (date, signalType, horizonDays)
);
