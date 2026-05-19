import { marketSnapshot } from "../lib/market-data";
import { getLiveMarketSnapshot } from "../lib/live-market-data";
import type { DataStatus, Indicator, MarketSnapshot, PipelineFreshness, SourceFetchLog } from "../lib/market-types";

type D1DatabaseLike = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
    };
    run(): Promise<unknown>;
    first<T = unknown>(): Promise<T | null>;
  };
  batch?(statements: Array<{ run(): Promise<unknown> }>): Promise<unknown>;
};

export type PipelineEnv = {
  DB?: D1DatabaseLike;
};

export type PipelineJobGroup =
  | "prices_fx_etf"
  | "rates_commodities_volatility"
  | "issues_disclosures_events"
  | "korea_close"
  | "us_close"
  | "morning_strategy"
  | "midnight_audit";

const PIPELINE_VERSION = "pipeline-2026-05-19-v1";

export function jobGroupForCron(cron?: string): PipelineJobGroup {
  if (cron === "*/5 * * * *") return "prices_fx_etf";
  if (cron === "*/15 * * * *") return "rates_commodities_volatility";
  if (cron === "7 * * * *") return "issues_disclosures_events";
  if (cron === "10 7 * * 1-5") return "korea_close";
  if (cron === "10 21 * * 1-5") return "us_close";
  if (cron === "0 22 * * 0-4") return "morning_strategy";
  if (cron === "0 15 * * *") return "midnight_audit";
  return "prices_fx_etf";
}

function isoNow() {
  return new Date().toISOString();
}

function kstDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function nextRunFor(group: PipelineJobGroup, now = new Date()) {
  const next = new Date(now);
  if (group === "prices_fx_etf") next.setUTCMinutes(Math.ceil((next.getUTCMinutes() + 1) / 5) * 5, 0, 0);
  else if (group === "rates_commodities_volatility") next.setUTCMinutes(Math.ceil((next.getUTCMinutes() + 1) / 15) * 15, 0, 0);
  else if (group === "issues_disclosures_events") next.setUTCHours(next.getUTCHours() + 1, 7, 0, 0);
  else next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

function statusToPipeline(status: DataStatus | undefined, stale: boolean): PipelineFreshness["status"] {
  if (status === "Error") return "error";
  if (stale || status === "Stale") return "stale";
  if (status === "Delayed") return "delayed";
  return "live";
}

function reliabilityScore(indicators: Indicator[]) {
  if (!indicators.length) return 0;
  const score = indicators.reduce((sum, indicator) => {
    const status = statusToPipeline(indicator.quality.status, indicator.quality.stale);
    if (status === "live") return sum + 100;
    if (status === "delayed") return sum + 78;
    if (status === "stale") return sum + 25;
    if (status === "error") return sum;
    return sum + 55;
  }, 0);
  return Math.round(score / indicators.length);
}

function latestForGroups(snapshot: MarketSnapshot, groups: Indicator["group"][]) {
  const dates = snapshot.indicators
    .filter((indicator) => groups.includes(indicator.group))
    .map((indicator) => indicator.quality.lastUpdated || indicator.quality.tradeDate || indicator.quality.baseDate)
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? snapshot.generatedAt;
}

function dataBasisDate(snapshot: MarketSnapshot) {
  const dates = snapshot.indicators
    .map((indicator) => indicator.quality.tradeDate || indicator.quality.baseDate)
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? kstDate();
}

function buildFreshness(snapshot: MarketSnapshot, group: PipelineJobGroup, now: string, logs: SourceFetchLog[]): PipelineFreshness {
  const staleSources = snapshot.indicators.filter((indicator) => indicator.quality.stale || indicator.quality.status === "Stale").length;
  const errors = logs.filter((log) => log.status === "Error").length;
  const basis = dataBasisDate(snapshot);
  return {
    marketPriceUpdatedAt: latestForGroups(snapshot, ["price", "future", "volatility"]),
    fxRatesUpdatedAt: latestForGroups(snapshot, ["rates", "credit"]),
    macroUpdatedAt: latestForGroups(snapshot, ["macro", "inflation", "liquidity"]),
    etfHoldingsUpdatedAt: now,
    fundamentalsUpdatedAt: now,
    modeledSignalsRecalculatedAt: now,
    errors,
    staleSources,
    nextScheduledUpdate: nextRunFor(group),
    tradableSignalDate: basis,
    dataBasisDate: basis,
    signalDate: basis,
    dataDate: basis,
    generatedAt: now,
    issueUpdatedAt: now,
    status: errors ? "error" : staleSources ? "stale" : "live"
  };
}

function buildJobLog(input: {
  id: string;
  jobName: string;
  source: string;
  status: DataStatus;
  startedAt: string;
  finishedAt: string;
  rowsUpdated: number;
  message: string;
  errorMessage?: string;
  nextRun: string;
  affectedIndicatorIds: string[];
}): SourceFetchLog {
  return {
    ...input,
    lastAttemptAt: input.finishedAt,
    lastUpdated: input.finishedAt,
    latencyMs: Date.parse(input.finishedAt) - Date.parse(input.startedAt)
  } as SourceFetchLog;
}

function recalculateModeledSignals(snapshot: MarketSnapshot, now: string): MarketSnapshot {
  const reliability = reliabilityScore(snapshot.indicators);
  return {
    ...snapshot,
    generatedAt: now,
    scores: snapshot.scores.map((score) => ({
      ...score,
      updatedAt: now,
      value: score.id === "global-risk" && reliability < 75 ? Math.max(0, score.value - 5) : score.value,
      summary: `${score.summary ?? "Modeled score recalculated"} Model ${PIPELINE_VERSION}; reliability ${reliability}/100.`
    }))
  };
}

async function withRetry<T>(job: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await job();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function storeSnapshot(env: PipelineEnv, snapshot: MarketSnapshot) {
  if (!env.DB) return;
  const payload = JSON.stringify(snapshot);
  const generatedAt = snapshot.generatedAt;
  await env.DB.prepare(
    "insert into latest_snapshots (id, generated_at, payload) values ('market', ?, ?) on conflict(id) do update set generated_at=excluded.generated_at, payload=excluded.payload"
  ).bind(generatedAt, payload).run();

  for (const indicator of snapshot.indicators) {
    const status = statusToPipeline(indicator.quality.status, indicator.quality.stale);
    const reliability = status === "live" ? 100 : status === "delayed" ? 78 : status === "stale" ? 25 : status === "error" ? 0 : 55;
    const dataDate = indicator.quality.tradeDate ?? indicator.quality.baseDate;
    await env.DB.prepare(
      "insert into latest_indicators (indicator_id, name, category, value, change_1d, change_5d, change_20d, data_date, fetched_at, source, status, reliability_score) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(indicator_id) do update set name=excluded.name, category=excluded.category, value=excluded.value, change_1d=excluded.change_1d, change_5d=excluded.change_5d, change_20d=excluded.change_20d, data_date=excluded.data_date, fetched_at=excluded.fetched_at, source=excluded.source, status=excluded.status, reliability_score=excluded.reliability_score"
    ).bind(indicator.id, indicator.name, indicator.group, indicator.value, indicator.changePercent, null, null, dataDate, indicator.quality.lastUpdated, indicator.quality.source, status, reliability).run();
    await env.DB.prepare(
      "insert or replace into indicator_history (date, indicator_id, value, source, status, fetched_at, valid_from) values (?, ?, ?, ?, ?, ?, ?)"
    ).bind(dataDate, indicator.id, indicator.value, indicator.quality.source, status, indicator.quality.lastUpdated, dataDate).run();
  }

  await env.DB.prepare(
    "insert or replace into strategy_snapshot_history (generated_at, signal_date, tradable_from, macro_regime, regime_confidence, active_tilt_limit, data_reliability, recommended_assets, risk_alerts) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    generatedAt,
    snapshot.pipeline?.signalDate ?? generatedAt.slice(0, 10),
    snapshot.pipeline?.tradableSignalDate ?? generatedAt.slice(0, 10),
    snapshot.scores[0]?.label ?? "Mixed",
    snapshot.scores[0]?.value ?? null,
    snapshot.scores[0]?.value && snapshot.scores[0].value >= 80 ? 30 : snapshot.scores[0]?.value && snapshot.scores[0].value >= 65 ? 20 : snapshot.scores[0]?.value && snapshot.scores[0].value >= 50 ? 10 : 0,
    reliabilityScore(snapshot.indicators),
    JSON.stringify(snapshot.themes?.slice(0, 5).map((theme) => theme.name) ?? []),
    JSON.stringify(snapshot.alerts?.slice(0, 10).map((alert) => alert.title) ?? [])
  ).run();
}

async function storeUpdateLogs(env: PipelineEnv, logs: SourceFetchLog[]) {
  if (!env.DB) return;
  for (const log of logs) {
    await env.DB.prepare(
      "insert into update_logs (job_name, source, started_at, finished_at, status, rows_updated, error_message, next_run) values (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(log.jobName ?? log.id, log.source, log.startedAt ?? log.lastAttemptAt, log.finishedAt ?? log.lastAttemptAt, log.status, log.rowsUpdated ?? 0, log.errorMessage ?? "", log.nextRun ?? "").run();
  }
}

export async function readLatestSnapshot(env: PipelineEnv): Promise<MarketSnapshot | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare("select payload from latest_snapshots where id = 'market'").first<{ payload: string }>();
  if (!row?.payload) return null;
  return JSON.parse(row.payload) as MarketSnapshot;
}

export async function runDataPipeline(env: PipelineEnv, group: PipelineJobGroup): Promise<MarketSnapshot> {
  const startedAt = isoNow();
  const nextRun = nextRunFor(group);
  try {
    const liveSnapshot = await withRetry(() => getLiveMarketSnapshot(), 3);
    const finishedAt = isoNow();
    const logs = [
      buildJobLog({
        id: `${group}-${finishedAt}`,
        jobName: group,
        source: "scheduled-worker raw data pipeline",
        status: "Fresh",
        startedAt,
        finishedAt,
        rowsUpdated: liveSnapshot.indicators.length,
        message: "fetch raw data -> validate -> store latest -> recalculate modeled signals -> save snapshot",
        nextRun,
        affectedIndicatorIds: liveSnapshot.indicators.map((indicator) => indicator.id)
      })
    ];
    const recalculated = recalculateModeledSignals(liveSnapshot, finishedAt);
    const snapshot: MarketSnapshot = {
      ...recalculated,
      sourceLogs: [...logs, ...(recalculated.sourceLogs ?? [])],
      updateLogs: logs,
      pipeline: buildFreshness(recalculated, group, finishedAt, logs)
    };
    await storeSnapshot(env, snapshot);
    await storeUpdateLogs(env, logs);
    return snapshot;
  } catch (error) {
    const finishedAt = isoNow();
    const fallback = recalculateModeledSignals(marketSnapshot, finishedAt);
    const logs = [
      buildJobLog({
        id: `${group}-error-${finishedAt}`,
        jobName: group,
        source: "scheduled-worker raw data pipeline",
        status: "Error",
        startedAt,
        finishedAt,
        rowsUpdated: 0,
        message: "primary fetch failed after retry; fallback snapshot served and related signals disabled",
        errorMessage: error instanceof Error ? error.message : "unknown pipeline error",
        nextRun,
        affectedIndicatorIds: fallback.indicators.map((indicator) => indicator.id)
      })
    ];
    const snapshot: MarketSnapshot = {
      ...fallback,
      indicators: fallback.indicators.map((indicator) => ({
        ...indicator,
        quality: {
          ...indicator.quality,
          stale: true,
          status: "Error",
          lastUpdated: finishedAt,
          errorMessage: error instanceof Error ? error.message : "unknown pipeline error"
        }
      })),
      sourceLogs: [...logs, ...(fallback.sourceLogs ?? [])],
      updateLogs: logs,
      pipeline: buildFreshness(fallback, group, finishedAt, logs)
    };
    await storeSnapshot(env, snapshot);
    await storeUpdateLogs(env, logs);
    return snapshot;
  }
}
