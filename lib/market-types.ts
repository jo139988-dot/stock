export type Region = "global" | "korea" | "us" | "macro";

export type IndicatorTone = "positive" | "negative" | "neutral" | "caution";

export type DataAccess = "free" | "paid" | "manual";

export type DataStatus = "Fresh" | "Delayed" | "Stale" | "Error";

export type DataQuality = {
  source: string;
  sourceUrl?: string;
  frequency: string;
  lastUpdated: string;
  baseDate: string;
  tradeDate?: string;
  status?: DataStatus;
  stale: boolean;
  access: DataAccess;
  errorMessage?: string;
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
  change1d?: number;
  change5d?: number;
  change20d?: number;
  history?: SparkPoint[];
  summary?: string;
};

export type ThemeScoreBreakdown = {
  momentumScore: number;
  volumeScore: number;
  breadthScore: number;
  leaderScore: number;
  qualityScore: number;
  newsScore: number;
  priceMomentum?: number;
  volumeExpansion?: number;
  advancingRatio?: number;
  newHighParticipation?: number;
  leaderStrength?: number;
};

export type ThemeMomentum = {
  name: string;
  region: "korea" | "us";
  score: number;
  oneDay: number;
  fiveDay: number;
  return20d?: number;
  volumeRatio: number;
  volumeRatio20d?: number;
  advancingRatio?: number;
  newHighCount20d?: number;
  leaderContribution?: number;
  linkageScore?: number;
  leaders: string[];
  followers?: string[];
  laggards?: string[];
  linkedThemes?: string[];
  concentrationRisk?: boolean;
  scoreBreakdown?: ThemeScoreBreakdown;
  tone: IndicatorTone;
  quality: DataQuality;
};

export type AlertSeverity = "yellow" | "orange" | "red" | "info" | "warning" | "critical";

export type MarketAlert = {
  id: string;
  title: string;
  detail: string;
  severity: AlertSeverity;
  triggeredAt: string;
  region: Region;
  rule: string;
  sourceIndicatorIds: string[];
  affectedAssets?: string[];
  affectedThemes?: string[];
  affectedSignalTypes?: SignalType[];
  suggestedAction?: string;
  triggerCondition?: string;
  releaseCondition?: string;
  category?: string;
  userEditable?: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  region: Region;
  startsAt: string;
  importance: "low" | "medium" | "high";
  source: string;
};

export type SourceFetchLog = {
  id: string;
  source: string;
  status: DataStatus;
  lastAttemptAt: string;
  latencyMs?: number;
  message: string;
  affectedIndicatorIds: string[];
};

export type SignalType = "Breakout" | "Pullback" | "Pullback Buy" | "Trend Leader" | "Momentum Fade" | "Reversal" | "Overheated" | "Breakdown" | "Avoid";

export type ActionTag = "Buy Watch" | "Hold" | "Take Profit" | "Reduce" | "Avoid";

export type StockSignal = {
  date: string;
  ticker: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "NASDAQ" | "S&P500";
  theme: string;
  price: number;
  close?: number;
  change1d: number;
  change5d: number;
  return5d?: number;
  return20d?: number;
  return60d?: number;
  change1m: number;
  marketCap?: number;
  tradingValue?: number;
  volumeRatio: number;
  volumeRatio20d?: number;
  rsi: number;
  rsi14?: number;
  relativeStrength: number;
  relativeStrength20d?: number;
  ma20Position?: number;
  ma60Position?: number;
  high52wProximity?: number;
  foreignFlow5d?: number;
  institutionFlow5d?: number;
  fundFlow: string;
  signalType: SignalType;
  score: number;
  signalScore?: number;
  reason: string;
  riskComment?: string;
  actionTag: ActionTag;
  candidateGroup: "Long Candidate" | "Watch Candidate" | "Risk-Off Candidate";
  maStatus: {
    ma20: boolean;
    ma60: boolean;
    ma120: boolean;
  };
};

export type BacktestMetric = {
  id?: string;
  targetType?: "signalType" | "theme" | "regime";
  label?: string;
  signalType?: SignalType;
  theme?: string;
  regime?: string;
  holdingPeriod?: "5D" | "10D" | "20D" | "60D";
  sampleSize: number;
  averageReturn?: number;
  medianReturn?: number;
  hitRatio?: number;
  maxDrawdown?: number;
  profitLossRatio?: number;
  bestCase?: number;
  worstCase?: number;
  return20d?: number;
  return60d?: number;
  status: "planned" | "collecting" | "ready";
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
  sourceLogs?: SourceFetchLog[];
  stockSignals?: StockSignal[];
  backtestMetrics?: BacktestMetric[];
};
