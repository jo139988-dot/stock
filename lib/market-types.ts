export type Region = "global" | "korea" | "us" | "macro";

export type IndicatorTone = "positive" | "negative" | "neutral" | "caution";

export type DataAccess = "free" | "paid" | "manual";

export type DataQuality = {
  source: string;
  sourceUrl?: string;
  frequency: string;
  lastUpdated: string;
  baseDate: string;
  stale: boolean;
  access: DataAccess;
};

export type SparkPoint = {
  date: string;
  value: number;
};

export type Indicator = {
  id: string;
  name: string;
  region: Region;
  group:
    | "price"
    | "future"
    | "breadth"
    | "flow"
    | "liquidity"
    | "rates"
    | "credit"
    | "inflation"
    | "macro"
    | "sentiment"
    | "volatility"
    | "theme"
    | "calendar";
  value: number;
  unit: string;
  previousClose: number;
  changePercent: number;
  tone: IndicatorTone;
  description?: string;
  sparkline: SparkPoint[];
  quality: DataQuality;
};

export type ScoreBreakdown = {
  trend: number;
  breadth: number;
  liquidity: number;
  ratesCredit: number;
  flow: number;
  sentimentVolatility: number;
};

export type MarketScore = {
  id: string;
  label: string;
  value: number;
  region: Region;
  breakdown: ScoreBreakdown;
  updatedAt: string;
};

export type ThemeMomentum = {
  name: string;
  region: "korea" | "us";
  score: number;
  oneDay: number;
  fiveDay: number;
  volumeRatio: number;
  leaders: string[];
  tone: IndicatorTone;
  quality: DataQuality;
};

export type AlertSeverity = "info" | "warning" | "critical";

export type MarketAlert = {
  id: string;
  title: string;
  detail: string;
  severity: AlertSeverity;
  triggeredAt: string;
  region: Region;
  rule: string;
  sourceIndicatorIds: string[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  region: Region;
  startsAt: string;
  importance: "low" | "medium" | "high";
  source: string;
};

export type MarketSnapshot = {
  generatedAt: string;
  timezone: {
    korea: "Asia/Seoul";
    us: "America/New_York";
  };
  scores: MarketScore[];
  indicators: Indicator[];
  themes: ThemeMomentum[];
  alerts: MarketAlert[];
  calendar: CalendarEvent[];
};
