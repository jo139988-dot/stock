import { marketSnapshot } from "../lib/market-data";
import type { DataStatus, MarketSnapshot } from "../lib/market-types";
import { jobGroupForCron, readLatestSnapshot, runDataPipeline, type PipelineEnv } from "./pipeline";

type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
} & PipelineEnv;

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

type WorkerScheduledController = {
  cron?: string;
  scheduledTime?: number;
};

type SnapshotCache = {
  snapshot: MarketSnapshot;
  fetchedAt: number;
};

const SNAPSHOT_TTL_MS = 60_000;
let snapshotCache: SnapshotCache | null = null;

function normalizeFallbackStatus(status: DataStatus | undefined, stale: boolean): DataStatus {
  if (status === "Error") return "Error";
  return stale ? "Stale" : status ?? "Delayed";
}

function snapshotResponse(snapshot: MarketSnapshot, cacheState: "hit" | "miss" | "fallback") {
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      "X-Snapshot-Cache": cacheState
    }
  });
}

async function refreshSnapshotCache() {
  const snapshot = await runDataPipeline({}, "prices_fx_etf");
  snapshotCache = {
    snapshot,
    fetchedAt: Date.now()
  };
  return snapshot;
}

function fallbackSnapshot(error: unknown): MarketSnapshot {
  const now = new Date().toISOString();
  return {
    ...marketSnapshot,
    generatedAt: now,
    indicators: marketSnapshot.indicators.map((indicator) => ({
      ...indicator,
      quality: {
        ...indicator.quality,
        stale: true,
        status: normalizeFallbackStatus(indicator.quality.status, true),
        tradeDate: indicator.quality.tradeDate ?? indicator.quality.baseDate,
        source: `${indicator.quality.source} / fallback after live fetch failure`,
        lastUpdated: now,
        errorMessage: error instanceof Error ? error.message : "live fetch failed"
      }
    })),
    sourceLogs: [
      {
        id: "live-snapshot-error",
        source: "Worker live snapshot collector",
        status: "Error",
        lastAttemptAt: now,
        message: error instanceof Error ? error.message : "live fetch failed",
        affectedIndicatorIds: marketSnapshot.indicators.map((indicator) => indicator.id)
      },
      ...(marketSnapshot.sourceLogs ?? [])
    ]
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/snapshot") {
      const persisted = await readLatestSnapshot(env);
      if (persisted) return snapshotResponse(persisted, "hit");

      if (snapshotCache && Date.now() - snapshotCache.fetchedAt < SNAPSHOT_TTL_MS) {
        return snapshotResponse(snapshotCache.snapshot, "hit");
      }

      try {
        const now = new Date().toISOString();
        const snapshot: MarketSnapshot = {
          ...marketSnapshot,
          generatedAt: now,
          pipeline: {
            marketPriceUpdatedAt: marketSnapshot.generatedAt,
            fxRatesUpdatedAt: marketSnapshot.generatedAt,
            macroUpdatedAt: marketSnapshot.generatedAt,
            etfHoldingsUpdatedAt: marketSnapshot.generatedAt,
            fundamentalsUpdatedAt: marketSnapshot.generatedAt,
            modeledSignalsRecalculatedAt: marketSnapshot.generatedAt,
            errors: (marketSnapshot.sourceLogs ?? []).filter((log) => log.status === "Error").length,
            staleSources: marketSnapshot.indicators.filter((indicator) => indicator.quality.stale).length,
            nextScheduledUpdate: "waiting for scheduled worker",
            tradableSignalDate: marketSnapshot.generatedAt.slice(0, 10),
            dataBasisDate: marketSnapshot.generatedAt.slice(0, 10),
            signalDate: marketSnapshot.generatedAt.slice(0, 10),
            dataDate: marketSnapshot.generatedAt.slice(0, 10),
            generatedAt: now,
            issueUpdatedAt: marketSnapshot.generatedAt,
            status: "fallback"
          },
          updateLogs: [
            {
              id: "latest-snapshot-not-yet-created",
              jobName: "serve_latest_snapshot",
              source: "latest snapshot store",
              status: "Stale",
              startedAt: now,
              finishedAt: now,
              lastAttemptAt: now,
              message: "No persisted scheduled snapshot found yet. Serving bundled fallback until the next cron job completes.",
              rowsUpdated: 0,
              nextRun: "next Cloudflare scheduled trigger",
              affectedIndicatorIds: marketSnapshot.indicators.map((indicator) => indicator.id)
            }
          ]
        };
        ctx.waitUntil(runDataPipeline(env, "prices_fx_etf").catch(() => undefined));
        return snapshotResponse(snapshot, "fallback");
      } catch (error) {
        return Response.json(fallbackSnapshot(error), {
          headers: {
            "Cache-Control": "no-store",
            "X-Snapshot-Cache": "fallback",
            "X-Market-Data-Error": error instanceof Error ? error.message : "live fetch failed"
          }
        });
      }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(controller: WorkerScheduledController, env: Env, ctx: WorkerExecutionContext): Promise<void> {
    const group = jobGroupForCron(controller.cron);
    ctx.waitUntil(runDataPipeline(env, group).then((snapshot) => {
      snapshotCache = { snapshot, fetchedAt: Date.now() };
    }).catch((error) => {
      console.error("scheduled data pipeline failed", group, error);
    }));
  }
};
