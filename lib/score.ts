import type { Indicator, MarketScore, Region, ScoreBreakdown } from "@/lib/market-types";

const weights: Record<keyof ScoreBreakdown, number> = {
  trend: 25,
  breadth: 20,
  liquidity: 20,
  ratesCredit: 15,
  flow: 10,
  sentimentVolatility: 10
};

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreLabel(score: number) {
  if (score >= 80) return "강한 위험선호";
  if (score >= 60) return "완만한 상승";
  if (score >= 40) return "중립/혼조";
  if (score >= 20) return "위험관리";
  return "강한 위험회피";
}

export function scoreTone(score: number) {
  if (score >= 60) return "positive";
  if (score >= 40) return "neutral";
  if (score >= 20) return "caution";
  return "negative";
}

export function weightedScore(breakdown: ScoreBreakdown) {
  const total =
    breakdown.trend * (weights.trend / 100) +
    breakdown.breadth * (weights.breadth / 100) +
    breakdown.liquidity * (weights.liquidity / 100) +
    breakdown.ratesCredit * (weights.ratesCredit / 100) +
    breakdown.flow * (weights.flow / 100) +
    breakdown.sentimentVolatility * (weights.sentimentVolatility / 100);

  return clampScore(total);
}

export function makeMarketScore(
  id: string,
  label: string,
  region: Region,
  breakdown: ScoreBreakdown,
  updatedAt: string
): MarketScore {
  return {
    id,
    label,
    region,
    breakdown,
    updatedAt,
    value: weightedScore(breakdown)
  };
}

export function changePercent(value: number, previous: number) {
  if (previous === 0) return 0;
  return Number((((value - previous) / previous) * 100).toFixed(2));
}

export function movingAverage(values: number[], window: number) {
  if (values.length < window) return null;
  const slice = values.slice(values.length - window);
  const sum = slice.reduce((acc, item) => acc + item, 0);
  return sum / window;
}

export function rsi(values: number[], period = 14) {
  if (values.length <= period) return null;
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = recent.filter((change) => change > 0).reduce((acc, item) => acc + item, 0) / period;
  const losses = Math.abs(recent.filter((change) => change < 0).reduce((acc, item) => acc + item, 0) / period);
  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return Number((100 - 100 / (1 + relativeStrength)).toFixed(1));
}

export function isStale(indicator: Indicator) {
  return indicator.quality.stale;
}
