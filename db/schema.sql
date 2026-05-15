-- Initial SQLite schema. The same logical model can be promoted to PostgreSQL
-- and then TimescaleDB by turning indicator_observations into a hypertable.

create table if not exists data_sources (
  id text primary key,
  name text not null,
  source_url text,
  access text not null check (access in ('free', 'paid', 'manual')),
  frequency text not null,
  timezone text not null default 'Asia/Seoul',
  notes text
);

create table if not exists indicators (
  id text primary key,
  name text not null,
  region text not null check (region in ('global', 'korea', 'us', 'macro')),
  indicator_group text not null,
  unit text not null,
  source_id text not null references data_sources(id),
  stale_after_minutes integer not null default 1440,
  is_active integer not null default 1
);

create table if not exists indicator_observations (
  id integer primary key autoincrement,
  indicator_id text not null references indicators(id),
  observed_at text not null,
  base_date text not null,
  value real not null,
  previous_close real,
  change_percent real,
  raw_payload text,
  quality_status text not null default 'fresh' check (quality_status in ('fresh', 'stale', 'failed')),
  created_at text not null default (datetime('now'))
);

create index if not exists idx_observations_indicator_time
  on indicator_observations(indicator_id, observed_at desc);

create table if not exists market_scores (
  id integer primary key autoincrement,
  score_id text not null,
  region text not null,
  observed_at text not null,
  trend_score real not null,
  breadth_score real not null,
  liquidity_score real not null,
  rates_credit_score real not null,
  flow_score real not null,
  sentiment_volatility_score real not null,
  total_score real not null
);

create index if not exists idx_market_scores_time
  on market_scores(score_id, observed_at desc);

create table if not exists alerts (
  id integer primary key autoincrement,
  rule_id text not null,
  region text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  detail text not null,
  triggered_at text not null,
  acknowledged_at text
);

create table if not exists theme_momentum (
  id integer primary key autoincrement,
  theme_name text not null,
  region text not null check (region in ('korea', 'us')),
  observed_at text not null,
  score real not null,
  one_day_change real not null,
  five_day_change real not null,
  volume_ratio real not null,
  leaders text not null
);
