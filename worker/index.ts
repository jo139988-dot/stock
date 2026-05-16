import { marketSnapshot } from "../lib/market-data";
import { getLiveMarketSnapshot } from "../lib/live-market-data";
import type { DataStatus, MarketSnapshot } from "../lib/market-types";

type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

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
  const snapshot = await getLiveMarketSnapshot();
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
      if (snapshotCache && Date.now() - snapshotCache.fetchedAt < SNAPSHOT_TTL_MS) {
        return snapshotResponse(snapshotCache.snapshot, "hit");
      }

      try {
        const refresh = refreshSnapshotCache();
        ctx.waitUntil(refresh.catch(() => undefined));
        return snapshotResponse(await refresh, "miss");
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

  async scheduled(_controller: WorkerScheduledController, _env: Env, ctx: WorkerExecutionContext): Promise<void> {
    ctx.waitUntil(refreshSnapshotCache().catch((error) => {
      console.error("scheduled snapshot refresh failed", error);
    }));
  }
};
