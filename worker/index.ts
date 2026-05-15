import { marketSnapshot } from "../lib/market-data";
import { getLiveMarketSnapshot } from "../lib/live-market-data";

type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/snapshot") {
      try {
        const snapshot = await getLiveMarketSnapshot();
        return Response.json(snapshot, {
          headers: {
            "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
          }
        });
      } catch (error) {
        const fallback = {
          ...marketSnapshot,
          generatedAt: new Date().toISOString(),
          indicators: marketSnapshot.indicators.map((indicator) => ({
            ...indicator,
            quality: {
              ...indicator.quality,
              stale: true,
              source: `${indicator.quality.source} / fallback after live fetch failure`,
              lastUpdated: new Date().toISOString()
            }
          }))
        };
        return Response.json(fallback, {
          headers: {
            "Cache-Control": "no-store",
            "X-Market-Data-Error": error instanceof Error ? error.message : "live fetch failed"
          }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
