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
};

export type ThemeMomentum = {
  name: string;
  region: "korea" | "us";
  score: number;
  oneDay: number;
  fiveDay: number;
  volumeRatio: number;
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

export type SignalType = "Breakout" | "Pullback" | "Trend Leader" | "Reversal" | "Overheated" | "Breakdown";

export type ActionTag = "Buy Watch" | "Hold" | "Take Profit" | "Avoid";

export type StockSignal = {
  date: string;
  ticker: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "NASDAQ" | "S&P500";
  theme: string;
  price: number;
  change1d: number;
  change5d: number;
  change1m: number;
  volumeRatio: number;
  rsi: number;
  relativeStrength: number;
  fundFlow: string;
  signalType: SignalType;
  score: number;
  reason: string;
  actionTag: ActionTag;
  candidateGroup: "Long Candidate" | "Watch Candidate" | "Risk-Off Candidate";
  maStatus: {
    ma20: boolean;
    ma60: boolean;
    ma120: boolean;
  };
};

export type BacktestMetric = {
  signalType: SignalType;
  sampleSize: number;
  return20d?: number;
  return60d?: number;
  hitRatio?: number;
  averageReturn?: number;
  maxDrawdown?: number;
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
