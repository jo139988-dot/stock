import { marketSnapshot } from "@/lib/market-data";

export async function GET() {
  return Response.json(marketSnapshot, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
    }
  });
}
