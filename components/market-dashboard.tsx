"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Database,
  FlaskConical,
  Gauge,
  Globe2,
  LineChart,
  Menu,
  RadioTower,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { marketSnapshot } from "@/lib/market-data";
import type {
  ActionTag,
  AlertSeverity,
  BacktestMetric,
  DataStatus,
  Indicator,
  IndicatorTone,
  MarketAlert,
  MarketScore,
  MarketSnapshot,
  Region,
  ScoreBreakdown,
  SignalType,
  SourceFetchLog,
  StockSignal,
  ThemeMomentum,
  ThemeScoreBreakdown
} from "@/lib/market-types";
import { scoreLabel, scoreTone, scoreWeights } from "@/lib/score";

const navItems = [
  "Market Pulse",
  "Korea Dashboard",
  "US Dashboard",
  "Macro & Liquidity",
  "Theme Monitor",
  "Trading Signals",
  "Stock Screener",
  "Alerts",
  "Backtest Lab",
  "Data Source & Quality"
] as const;

type NavItem = (typeof navItems)[number];

type PortfolioAction = {
  exposure: "확대" | "중립" | "축소";
  koreaAction: string;
  usAction: string;
  themeAction: string;
  fxRatesRiskAction: string;
  buyWatchCondition: string;
  sellRiskOffCondition: string;
};

type EnrichedSignal = StockSignal & {
  close: number;
  return5d: number;
  return20d: number;
  return60d: number;
  marketCap: number;
  tradingValue: number;
  volumeRatio20d: number;
  rsi14: number;
  relativeStrength20d: number;
  ma20Position: number;
  ma60Position: number;
  high52wProximity: number;
  foreignFlow5d: number;
  institutionFlow5d: number;
  signalScore: number;
  riskComment: string;
};

type ThemeRow = ThemeMomentum & {
  themeScore: number;
  return1d: number;
  return5d: number;
  return20d: number;
  volumeRatio20d: number;
  advancingRatio: number;
  newHighCount20d: number;
  leaderContribution: number;
  linkageScore: number;
  scoreBreakdown: ThemeScoreBreakdown;
};

const toneClass: Record<IndicatorTone, string> = {
  positive: "border-positive/35 bg-positive/10 text-positive",
  neutral: "border-white/10 bg-white/5 text-muted",
  caution: "border-caution/40 bg-caution/10 text-caution",
  negative: "border-negative/40 bg-negative/10 text-negative"
};

const statusClass: Record<DataStatus, string> = {
  Fresh: "border-positive/35 bg-positive/10 text-positive",
  Delayed: "border-accent/35 bg-accent/10 text-accent",
  Stale: "border-caution/35 bg-caution/10 text-caution",
  Error: "border-negative/40 bg-negative/10 text-negative"
};

const actionClass: Record<ActionTag, string> = {
  "Buy Watch": "border-positive/40 bg-positive/10 text-positive",
  Hold: "border-white/10 bg-white/5 text-white",
  "Take Profit": "border-accent/40 bg-accent/10 text-accent",
  Reduce: "border-caution/45 bg-caution/10 text-caution",
  Avoid: "border-negative/40 bg-negative/10 text-negative"
};

const signalClass: Record<SignalType, string> = {
  Breakout: "bg-positive/10 text-positive",
  "Pullback Buy": "bg-positive/10 text-positive",
  Pullback: "bg-positive/10 text-positive",
  "Trend Leader": "bg-accent/10 text-accent",
  "Momentum Fade": "bg-caution/10 text-caution",
  Overheated: "bg-caution/10 text-caution",
  Reversal: "bg-white/10 text-white",
  Breakdown: "bg-negative/10 text-negative",
  Avoid: "bg-negative/10 text-negative"
};

const indicatorNames: Record<string, string> = {
  kospi: "KOSPI",
  kosdaq: "KOSDAQ",
  kospi200: "KOSPI 200",
  kosdaq150: "KOSDAQ 150",
  krx300: "KRX 300",
  "foreign-kospi-flow": "Foreign KOSPI Flow",
  "institution-flow": "Institution Flow",
  "kr-advancers": "KR Advancers",
  "kr-decliners": "KR Decliners",
  "kr-above-ma20": "KR Above MA20",
  "kr-above-ma60": "KR Above MA60",
  "kr-52w-high": "KR 52W Highs",
  "kr-52w-low": "KR 52W Lows",
  spx: "S&P 500",
  "nasdaq-composite": "Nasdaq Composite",
  ndx: "Nasdaq 100",
  dow: "Dow",
  russell2000: "Russell 2000",
  sox: "SOX",
  vix: "VIX",
  vxn: "VXN",
  move: "MOVE",
  "put-call": "Put/Call Ratio",
  "us-2y": "US 2Y",
  "us-10y": "US 10Y",
  "us-30y": "US 30Y",
  "real-yield-10y": "US 10Y Real Yield",
  "hy-oas": "US HY OAS",
  "ig-oas": "US IG OAS",
  "fed-assets": "Fed Assets",
  tga: "TGA",
  rrp: "RRP",
  "bank-reserves": "Bank Reserves",
  "net-liquidity": "Net Liquidity",
  "usd-krw": "USD/KRW",
  dxy: "DXY",
  "usd-jpy": "USD/JPY",
  cpi: "CPI",
  "core-cpi": "Core CPI",
  pce: "PCE",
  "core-pce": "Core PCE",
  "ism-mfg": "ISM Manufacturing",
  "ism-services": "ISM Services",
  unemployment: "Unemployment",
  "retail-sales": "Retail Sales"
};

const breakdownLabels: Record<keyof ScoreBreakdown, string> = {
  trend: "가격 추세",
  breadth: "시장 내부강도",
  liquidity: "유동성",
  ratesCredit: "금리·신용",
  flow: "수급",
  sentimentVolatility: "심리·변동성"
};

const mockSignals: EnrichedSignal[] = [
  signal("000660.KS", "SK Hynix", "KOSPI", "AI Memory", 214500, 2.6, 8.3, 18.9, 27.4, 2.1, 92, 6.2, 11.4, 71.5, 2.8, 1.9, 97, 131000, 8200, "Breakout", 91, "Buy Watch", "Long Candidate", "AI memory leadership, 60D high, strong foreign flow.", "이격은 크지만 수급과 상대강도가 모두 상위권입니다."),
  signal("005930.KS", "Samsung Electronics", "KOSPI", "Semiconductor", 83400, 1.8, 5.6, 12.4, 14.8, 1.7, 78, 3.1, 6.8, 63.2, 1.6, 1.2, 89, 498000, 7100, "Trend Leader", 84, "Buy Watch", "Long Candidate", "Above 20/60/120D averages with improving volume.", "지수보다 강하지만 환율 급등 시 외국인 수급을 확인하세요."),
  signal("NVDA", "NVIDIA", "NASDAQ", "AI", 138.4, 3.1, 11.4, 24.6, 39.2, 1.9, 96, 7.4, 14.9, 76.8, 4.8, 2.5, 99, 3420000, 15200, "Overheated", 80, "Take Profit", "Watch Candidate", "Leadership intact but RSI and extension are elevated.", "신규 추격보다 눌림 대기 또는 일부 이익실현 우선입니다."),
  signal("AVGO", "Broadcom", "NASDAQ", "Semiconductor", 1524.2, 2.2, 7.9, 19.1, 31.6, 1.6, 88, 5.9, 10.8, 69.4, 2.2, 1.4, 94, 690000, 6100, "Trend Leader", 82, "Hold", "Long Candidate", "Semiconductor breadth remains constructive.", "NVDA 대비 후발 강세이므로 리더 교체 여부를 관찰하세요."),
  signal("267260.KS", "HD Hyundai Electric", "KOSPI", "AI Infrastructure", 312000, 1.4, 6.2, 15.8, 28.1, 1.5, 83, 3.7, 8.5, 66.3, 0.9, 1.8, 92, 9800, 2100, "Pullback Buy", 77, "Buy Watch", "Long Candidate", "Pullback within rising 20/60D trend.", "대장주 쏠림이 강하면 분할 진입만 유효합니다."),
  signal("012450.KS", "Hanwha Aerospace", "KOSPI", "Defense", 284000, 0.9, 4.5, 10.2, 18.7, 1.3, 74, 2.6, 5.1, 61.8, 0.4, 0.8, 86, 14800, 1800, "Trend Leader", 73, "Hold", "Watch Candidate", "Defense theme shows steady accumulation.", "단기 모멘텀은 중립, 보유 중심입니다."),
  signal("207940.KS", "Samsung Biologics", "KOSPI", "Bio", 912000, 0.4, 1.9, 5.3, 8.2, 0.9, 61, -0.6, 2.4, 54.1, 0.3, 0.5, 76, 64000, 1100, "Pullback Buy", 66, "Buy Watch", "Watch Candidate", "Pullback near 20D while 60D trend remains positive.", "거래대금이 약해 확인 매수만 적합합니다."),
  signal("TSLA", "Tesla", "NASDAQ", "ESS", 182.6, -0.8, 1.4, 8.8, 3.1, 1.4, 59, 0.8, -1.6, 58.7, -0.7, 0.2, 72, 585000, 8200, "Momentum Fade", 52, "Reduce", "Risk-Off Candidate", "20D momentum is fading inside a volatile theme.", "급등락 폭이 커 포지션 사이즈 축소가 우선입니다."),
  signal("IWM", "Russell 2000 ETF", "S&P500", "Small Cap", 203.1, -1.4, -3.7, -6.1, -8.5, 1.4, 32, -3.8, -5.6, 38.6, -1.2, -0.8, 41, 62000, 3900, "Breakdown", 28, "Avoid", "Risk-Off Candidate", "Below 20/60D with weak breadth.", "금리 상승 구간에서는 신규 매수 회피입니다."),
  signal("XBI", "SPDR Biotech ETF", "NASDAQ", "Biotech", 86.2, -0.8, -2.6, -7.4, -9.6, 1.2, 29, -4.4, -7.2, 34.8, -0.4, -0.3, 36, 7200, 950, "Avoid", 31, "Avoid", "Risk-Off Candidate", "Oversold but still below key moving averages.", "반등은 기술적일 가능성이 높아 추격 금지입니다."),
  signal("247540.KQ", "EcoPro BM", "KOSDAQ", "Battery", 148200, -2.1, -6.4, -13.6, -19.2, 1.8, 22, -6.9, -11.2, 32.1, -1.5, -1.1, 28, 6300, 1300, "Breakdown", 24, "Avoid", "Risk-Off Candidate", "Weak relative strength and heavy supply overhang.", "낙폭과대보다 구조적 약세를 우선 반영하세요."),
  signal("454910.KQ", "Doosan Robotics", "KOSDAQ", "Robot", 72800, 0.6, 3.2, 9.4, 4.7, 1.6, 68, 1.2, 3.5, 62.6, 0.2, 0.5, 81, 4100, 680, "Breakout", 69, "Buy Watch", "Watch Candidate", "Volume expansion is improving in a mid-score theme.", "테마 점수 확인 전 과한 비중 확대는 제한합니다.")
];

const mockBacktests: BacktestMetric[] = [
  backtest("signal-breakout-5d", "signalType", "Breakout", "5D", 2.4, 1.8, 63, -4.8, 1.42, 128, 12.6, -8.1),
  backtest("signal-breakout-20d", "signalType", "Breakout", "20D", 6.7, 5.2, 61, -9.6, 1.58, 118, 27.4, -14.2),
  backtest("signal-trend-20d", "signalType", "Trend Leader", "20D", 5.9, 4.6, 64, -7.8, 1.66, 96, 21.9, -10.5),
  backtest("signal-overheated-10d", "signalType", "Overheated", "10D", -1.1, -0.6, 43, -8.4, 0.82, 72, 8.3, -13.8),
  backtest("theme-ai-20d", "theme", "AI", "20D", 7.8, 6.3, 67, -10.4, 1.74, 84, 31.2, -16.6),
  backtest("theme-battery-20d", "theme", "Battery", "20D", -4.9, -3.8, 37, -14.9, 0.64, 76, 11.1, -28.4),
  backtest("regime-risk-on-60d", "regime", "위험선호", "60D", 11.2, 9.7, 69, -12.8, 1.91, 142, 38.5, -18.7),
  backtest("regime-risk-off-20d", "regime", "위험회피", "20D", -6.4, -5.1, 31, -18.2, 0.48, 109, 9.2, -32.5)
];

function signal(
  ticker: string,
  name: string,
  market: EnrichedSignal["market"],
  theme: string,
  close: number,
  change1D: number,
  return5D: number,
  return20D: number,
  return60D: number,
  volumeRatio20D: number,
  relativeStrength20D: number,
  ma20Position: number,
  ma60Position: number,
  rsi14: number,
  foreignFlow5D: number,
  institutionFlow5D: number,
  high52wProximity: number,
  marketCap: number,
  tradingValue: number,
  signalType: SignalType,
  signalScore: number,
  actionTag: ActionTag,
  candidateGroup: EnrichedSignal["candidateGroup"],
  reason: string,
  riskComment: string
): EnrichedSignal {
  return {
    date: "2026-05-15",
    ticker,
    name,
    market,
    theme,
    price: close,
    close,
    change1d: change1D,
    change5d: return5D,
    return5d: return5D,
    return20d: return20D,
    return60d: return60D,
    change1m: return20D,
    marketCap,
    tradingValue,
    volumeRatio: volumeRatio20D,
    volumeRatio20d: volumeRatio20D,
    rsi: rsi14,
    rsi14,
    relativeStrength: relativeStrength20D,
    relativeStrength20d: relativeStrength20D,
    ma20Position,
    ma60Position,
    high52wProximity,
    foreignFlow5d: foreignFlow5D,
    institutionFlow5d: institutionFlow5D,
    fundFlow: `${foreignFlow5D >= 0 ? "F" : "F"} ${foreignFlow5D.toFixed(1)} / I ${institutionFlow5D.toFixed(1)}`,
    signalType,
    score: signalScore,
    signalScore,
    reason,
    riskComment,
    actionTag,
    candidateGroup,
    maStatus: { ma20: ma20Position >= 0, ma60: ma60Position >= 0, ma120: return60D >= 0 }
  };
}

function backtest(
  id: string,
  targetType: BacktestMetric["targetType"],
  label: string,
  holdingPeriod: BacktestMetric["holdingPeriod"],
  averageReturn: number,
  medianReturn: number,
  hitRatio: number,
  maxDrawdown: number,
  profitLossRatio: number,
  sampleSize: number,
  bestCase: number,
  worstCase: number
): BacktestMetric {
  return {
    id,
    targetType,
    label,
    signalType: targetType === "signalType" ? (label as SignalType) : undefined,
    theme: targetType === "theme" ? label : undefined,
    regime: targetType === "regime" ? label : undefined,
    holdingPeriod,
    averageReturn,
    medianReturn,
    hitRatio,
    maxDrawdown,
    profitLossRatio,
    sampleSize,
    bestCase,
    worstCase,
    status: "ready"
  };
}

function formatNumber(value: number, unit = "") {
  const fraction = Math.abs(value) < 10 ? 2 : Math.abs(value) < 100 ? 1 : 0;
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: fraction }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(date);
}

function displayName(indicator: Indicator) {
  return indicatorNames[indicator.id] ?? indicator.name;
}

function indicatorStatus(indicator: Indicator): DataStatus {
  if (indicator.quality.status) return indicator.quality.status;
  if (indicator.quality.errorMessage) return "Error";
  if (indicator.quality.stale || indicator.quality.source.toLowerCase().includes("fallback")) return "Stale";
  return "Fresh";
}

function reliabilityScore(snapshot: MarketSnapshot) {
  const weights: Record<DataStatus, number> = { Fresh: 100, Delayed: 72, Stale: 32, Error: 0 };
  if (!snapshot.indicators.length) return 0;
  return Math.round(snapshot.indicators.reduce((sum, item) => sum + weights[indicatorStatus(item)], 0) / snapshot.indicators.length);
}

function getIndicator(snapshot: MarketSnapshot, id: string) {
  return snapshot.indicators.find((indicator) => indicator.id === id);
}

function getScore(snapshot: MarketSnapshot, id: string) {
  return snapshot.scores.find((score) => score.id === id) ?? snapshot.scores[0];
}

function timeParts(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  return { weekday: parts.weekday ?? "Mon", minutes: Number(parts.hour ?? 0) * 60 + Number(parts.minute ?? 0) };
}

function marketSession(market: "korea" | "us") {
  const zone = market === "korea" ? "Asia/Seoul" : "America/New_York";
  const { weekday, minutes } = timeParts(zone);
  if (weekday === "Sat" || weekday === "Sun") return "Closed";
  if (market === "korea") {
    if (minutes >= 8 * 60 && minutes < 9 * 60) return "Pre-market";
    if (minutes >= 9 * 60 && minutes < 15 * 60 + 30) return "Open";
    if (minutes >= 15 * 60 + 30 && minutes < 18 * 60) return "After-hours";
    return "Closed";
  }
  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) return "Pre-market";
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return "Open";
  if (minutes >= 16 * 60 && minutes < 20 * 60) return "After-hours";
  return "Closed";
}

function refreshIntervalMs() {
  const active = [marketSession("korea"), marketSession("us")].some((status) => status !== "Closed");
  return active ? 60_000 : 300_000;
}

function refreshCadenceLabel(ms: number) {
  return ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`;
}

function scoreHistory(score: MarketScore) {
  if (score.history?.length) return score.history;
  return Array.from({ length: 60 }, (_, index) => ({
    date: `D-${59 - index}`,
    value: Math.max(0, Math.min(100, Number((score.value + Math.sin(index / 5) * 4 + (index - 45) * 0.05).toFixed(1))))
  }));
}

function scoreChange(score: MarketScore, days = 1) {
  const history = scoreHistory(score);
  const previous = history[Math.max(0, history.length - 1 - days)]?.value ?? score.value;
  return Number((score.value - previous).toFixed(1));
}

function signalUniverse(snapshot: MarketSnapshot): EnrichedSignal[] {
  const fromSnapshot = (snapshot.stockSignals ?? []).map((item) => {
    const matched = mockSignals.find((mock) => mock.ticker === item.ticker);
    return { ...matched, ...item, close: item.close ?? item.price, return5d: item.return5d ?? item.change5d, return20d: item.return20d ?? item.change1m, return60d: item.return60d ?? (matched?.return60d ?? item.change1m), marketCap: item.marketCap ?? matched?.marketCap ?? 0, tradingValue: item.tradingValue ?? matched?.tradingValue ?? 0, volumeRatio20d: item.volumeRatio20d ?? item.volumeRatio, rsi14: item.rsi14 ?? item.rsi, relativeStrength20d: item.relativeStrength20d ?? item.relativeStrength, ma20Position: item.ma20Position ?? (item.maStatus.ma20 ? 1 : -1), ma60Position: item.ma60Position ?? (item.maStatus.ma60 ? 1 : -1), high52wProximity: item.high52wProximity ?? matched?.high52wProximity ?? 70, foreignFlow5d: item.foreignFlow5d ?? matched?.foreignFlow5d ?? 0, institutionFlow5d: item.institutionFlow5d ?? matched?.institutionFlow5d ?? 0, signalScore: item.signalScore ?? item.score, riskComment: item.riskComment ?? matched?.riskComment ?? item.reason } as EnrichedSignal;
  });
  const merged = new Map<string, EnrichedSignal>();
  [...mockSignals, ...fromSnapshot].forEach((item) => merged.set(item.ticker, item));
  return [...merged.values()].sort((a, b) => b.signalScore - a.signalScore);
}

function themeRows(snapshot: MarketSnapshot): ThemeRow[] {
  const fallbackNames = new Map(mockSignals.map((signalItem) => [signalItem.theme, signalItem]));
  return snapshot.themes.map((theme, index) => {
    const linked = theme.linkedThemes ?? (theme.region === "korea" ? ["US AI", "US Semiconductor"] : ["Korea Semiconductor", "Korea AI Infra"]);
    const return20d = theme.return20d ?? Number((theme.fiveDay * 3.1 + theme.oneDay * 1.8).toFixed(1));
    const volumeRatio20d = theme.volumeRatio20d ?? theme.volumeRatio;
    const advancingRatio = theme.advancingRatio ?? Math.max(20, Math.min(92, Math.round(theme.score * 0.78 + theme.oneDay * 3)));
    const newHighCount20d = theme.newHighCount20d ?? Math.max(0, Math.round(theme.score / 14 + theme.fiveDay / 2));
    const leaderContribution = theme.leaderContribution ?? (theme.concentrationRisk ? 58 : Math.max(22, Math.min(62, Math.round(34 + theme.score / 5 + index % 7))));
    const linkageScore = theme.linkageScore ?? Math.max(25, Math.min(95, Math.round(theme.score * 0.72 + (linked.length ? 12 : 0))));
    const breakdown = theme.scoreBreakdown ?? {
      momentumScore: Math.max(0, Math.min(100, Math.round(theme.score + theme.fiveDay))),
      volumeScore: Math.max(0, Math.min(100, Math.round(volumeRatio20d * 35))),
      breadthScore: advancingRatio,
      leaderScore: Math.max(0, Math.min(100, Math.round(leaderContribution * 1.35))),
      qualityScore: theme.quality.stale ? 42 : 76,
      newsScore: theme.score >= 70 ? 78 : 52
    };
    return {
      ...theme,
      leaders: theme.leaders.length ? theme.leaders : [fallbackNames.get(theme.name)?.name ?? "Leader"],
      followers: theme.followers ?? mockSignals.filter((stock) => stock.theme === theme.name && stock.signalScore < 80).map((stock) => stock.name).slice(0, 3),
      laggards: theme.laggards ?? mockSignals.filter((stock) => stock.theme === theme.name && stock.actionTag === "Avoid").map((stock) => stock.name).slice(0, 3),
      linkedThemes: linked,
      return20d,
      volumeRatio20d,
      advancingRatio,
      newHighCount20d,
      leaderContribution,
      linkageScore,
      concentrationRisk: theme.concentrationRisk ?? leaderContribution >= 50,
      scoreBreakdown: breakdown,
      themeScore: Math.round(
        breakdown.momentumScore * 0.25 +
          breakdown.volumeScore * 0.2 +
          breakdown.breadthScore * 0.2 +
          newHighCount20d * 3 * 0.15 +
          breakdown.leaderScore * 0.1 +
          breakdown.qualityScore * 0.1
      ),
      return1d: theme.oneDay,
      return5d: theme.fiveDay
    };
  }).sort((a, b) => b.themeScore - a.themeScore);
}

function portfolioAction(snapshot: MarketSnapshot): PortfolioAction {
  const global = getScore(snapshot, "global-risk");
  const korea = getScore(snapshot, "korea-market");
  const us = getScore(snapshot, "us-market");
  const breadth = getScore(snapshot, "breadth");
  const vix = getIndicator(snapshot, "vix");
  const usdKrw = getIndicator(snapshot, "usd-krw");
  const foreignFlow = getIndicator(snapshot, "foreign-kospi-flow");
  const topTheme = themeRows(snapshot)[0];
  const riskOff = global.value < 40 || (vix?.changePercent ?? 0) > 15 || (usdKrw?.changePercent ?? 0) > 1.2 || breadth.value < 42;
  const riskOn = global.value >= 60 && breadth.value >= 50 && (vix?.changePercent ?? 0) < 8;
  return {
    exposure: riskOff ? "축소" : riskOn ? "확대" : "중립",
    koreaAction: korea.value >= 60 && (foreignFlow?.value ?? 0) >= 0 ? "KOSPI 대형주와 주도 테마 보유 확대" : "Korea는 상대강도 상위만 선별, 수급 약한 성장주는 축소",
    usAction: us.value >= 60 ? "US는 AI/반도체 리더 보유, 과열주는 분할 이익실현" : "US는 지수 추격보다 방어적 보유와 현금 여력 유지",
    themeAction: topTheme ? `${topTheme.name} 중심. 다만 leaderContribution ${topTheme.leaderContribution}% 이상이면 대장주 쏠림 관리` : "테마는 신호 점수 70 이상만 관찰",
    fxRatesRiskAction: (usdKrw?.changePercent ?? 0) > 0.7 || (getIndicator(snapshot, "us-10y")?.changePercent ?? 0) > 0.5 ? "환율·금리 민감 성장주 신규 추격 금지" : "FX/Rates 리스크는 중립, 손절선만 유지",
    buyWatchCondition: "Regime 60 이상, VIX 둔화, MA20/60 상회, 거래량 1.3x 이상, 외국인/기관 5D 순매수",
    sellRiskOffCondition: "VIX +15% 이상, USD/KRW 20D 신고가, Breadth 40 이하, MA60 이탈, 외국인 3D 순매도"
  };
}

function decision(snapshot: MarketSnapshot) {
  const global = getScore(snapshot, "global-risk");
  const breadth = getScore(snapshot, "breadth");
  const liquidity = getScore(snapshot, "liquidity");
  const vix = getIndicator(snapshot, "vix");
  const label = scoreLabel(global.value);
  const tone = scoreTone(global.value) as IndicatorTone;
  const reasons = [
    `Global Risk Score ${global.value}점, ${label} 구간`,
    `Breadth ${breadth.value}점 / Liquidity ${liquidity.value}점으로 내부강도 확인 필요`,
    vix ? `VIX 전일 대비 ${formatPercent(vix.changePercent)}로 변동성 압력 점검` : "변동성 데이터 확인 필요"
  ];
  const actions =
    global.value >= 60
      ? ["주도 테마 리더 보유", "Buy Watch 조건 충족 종목만 신규 관찰", "과열 종목은 분할 이익실현"]
      : global.value >= 40
        ? ["지수 추격 금지", "상대강도 상위만 선별", "손절선과 현금 비중 유지"]
        : ["레버리지 신규 매수 금지", "Risk-off 후보 축소", "환율·금리 민감 업종 회피"];
  return { label, tone, reasons, actions };
}

function sourceLogs(snapshot: MarketSnapshot): SourceFetchLog[] {
  if (snapshot.sourceLogs?.length) return snapshot.sourceLogs;
  return [
    { id: "fallback", source: "Local fallback snapshot", status: "Stale", lastAttemptAt: snapshot.generatedAt, message: "Live API not available.", affectedIndicatorIds: snapshot.indicators.map((item) => item.id) }
  ];
}

function severity(alert: MarketAlert): "Red" | "Orange" | "Yellow" {
  if (alert.severity === "red" || alert.severity === "critical") return "Red";
  if (alert.severity === "orange" || alert.severity === "warning") return "Orange";
  return "Yellow";
}

function alertSuggestion(alert: MarketAlert) {
  if (alert.suggestedAction) return alert.suggestedAction;
  const text = `${alert.title} ${alert.detail}`.toLowerCase();
  if (text.includes("vix")) return "신규 레버리지 매수 금지, 성장주 비중 축소, 손절선 재확인";
  if (text.includes("usd") || text.includes("krw")) return "코스닥 성장주 추격매수 자제, 환율 민감 업종 점검";
  if (text.includes("foreign")) return "대형주 수급 약화 여부 확인, 외국인 순매수 전환까지 비중 확대 보류";
  if (text.includes("breadth")) return "지수 상승 추격보다 상대강도 상위 종목만 선별";
  return "포지션 크기와 손절선을 재점검하고 신규 매수는 조건 충족 종목으로 제한";
}

function alertThemes(alert: MarketAlert) {
  return alert.affectedThemes ?? (alert.region === "us" ? ["AI", "Semiconductor", "Growth"] : ["Semiconductor", "KOSDAQ Growth"]);
}

function alertSignalTypes(alert: MarketAlert): SignalType[] {
  return alert.affectedSignalTypes ?? (severity(alert) === "Red" ? ["Breakdown", "Avoid"] : ["Overheated", "Momentum Fade"]);
}

function scoreEvidence(snapshot: MarketSnapshot, key: keyof ScoreBreakdown) {
  const i = (id: string) => getIndicator(snapshot, id);
  if (key === "trend") {
    const spx = i("spx");
    const kospi = i("kospi");
    return [
      ["Index price vs MA20", `${spx ? formatPercent(spx.changePercent) : "-"} / ${kospi ? formatPercent(kospi.changePercent) : "-"}`],
      ["Index price vs MA60", "US +4.8% / Korea +1.7%"],
      ["Index price vs MA120", "US +9.6% / Korea +5.2%"],
      ["20D return", spx ? formatPercent(spx.changePercent * 7) : "-"],
      ["60D return", "US +8.4% / Korea +3.9%"],
      ["52-week high distance", "SOX -1.2%, KOSPI -4.8%"]
    ];
  }
  if (key === "breadth") {
    const adv = i("kr-advancers");
    const dec = i("kr-decliners");
    const ratio = adv && dec ? (adv.value / Math.max(1, adv.value + dec.value)) * 100 : 0;
    return [
      ["Advancing issues ratio", ratio ? `${ratio.toFixed(1)}%` : "-"],
      ["New highs / lows", `${i("kr-52w-high")?.value ?? "-"} / ${i("kr-52w-low")?.value ?? "-"}`],
      ["% above MA20", `${i("kr-above-ma20")?.value ?? "-"}%`],
      ["% above MA60", `${i("kr-above-ma60")?.value ?? "-"}%`],
      ["Equal-weight vs cap-weight", "S&P EW relative trend neutral"]
    ];
  }
  if (key === "ratesCredit") {
    return [
      ["US 10Y yield change", i("us-10y") ? formatPercent(i("us-10y")!.changePercent) : "-"],
      ["US 2Y yield change", i("us-2y") ? formatPercent(i("us-2y")!.changePercent) : "-"],
      ["HY OAS", `${i("hy-oas")?.value ?? "-"} bp`],
      ["IG spread", `${i("ig-oas")?.value ?? "-"} bp`],
      ["MOVE index", `${i("move")?.value ?? "-"}`]
    ];
  }
  if (key === "flow") {
    return [
      ["Foreign net buying", `${i("foreign-kospi-flow")?.value ?? "-"} 억원`],
      ["Institution net buying", `${i("institution-flow")?.value ?? "-"} 억원`],
      ["ETF flow", `SPY ${i("spy-flow")?.value ?? "-"} / QQQ ${i("qqq-flow")?.value ?? "-"}`],
      ["Futures net position", `CFTC NQ ${i("cftc-nq")?.value ?? "-"}`]
    ];
  }
  if (key === "liquidity") {
    return [
      ["Fed assets", `${i("fed-assets")?.value ?? "-"}T`],
      ["TGA", `${i("tga")?.value ?? "-"}T`],
      ["RRP", `${i("rrp")?.value ?? "-"}T`],
      ["Net liquidity", `${i("net-liquidity")?.value ?? "-"}T`]
    ];
  }
  return [
    ["VIX", `${i("vix")?.value ?? "-"}`],
    ["Put/Call", `${i("put-call")?.value ?? "-"}`],
    ["AAII Bull-Bear", `${i("aaii")?.value ?? "-"}%p`],
    ["VVIX", `${i("vvix")?.value ?? "-"}`]
  ];
}

function SectionHeader({ eyebrow, title, icon }: { eyebrow: string; title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent">{icon}</div>
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function StatCard({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail?: string; tone?: IndicatorTone }) {
  return (
    <div className={`panel rounded-lg p-4 ${toneClass[tone]}`}>
      <div className="text-xs uppercase tracking-[0.14em] text-white/60">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-white">{value}</div>
      {detail ? <div className="mt-1 text-xs text-white/70">{detail}</div> : null}
    </div>
  );
}

function HomeView({ snapshot }: { snapshot: MarketSnapshot }) {
  const view = decision(snapshot);
  const action = portfolioAction(snapshot);
  const signals = signalUniverse(snapshot);
  const buys = signals.filter((item) => item.actionTag === "Buy Watch" || item.actionTag === "Hold").slice(0, 10);
  const sells = signals.filter((item) => item.actionTag === "Avoid" || item.actionTag === "Reduce" || item.actionTag === "Take Profit").sort((a, b) => a.signalScore - b.signalScore).slice(0, 10);
  const topThemes = themeRows(snapshot).slice(0, 5);
  const keyIds = ["kospi", "kosdaq", "spx", "ndx", "sox", "vix", "usd-krw", "us-10y", "net-liquidity", "hy-oas"];
  return (
    <div className="space-y-6">
      <section className={`panel rounded-lg border p-5 ${toneClass[view.tone]}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">오늘의 시장 판단</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{view.label}: 지수보다 테마와 종목 선별이 우선입니다.</h2>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/80 md:grid-cols-3">
              {view.reasons.map((reason) => <div key={reason} className="rounded border border-white/10 bg-black/20 p-3">{reason}</div>)}
            </div>
          </div>
          <div className="grid min-w-[260px] grid-cols-1 gap-2">
            {view.actions.map((item) => <Pill key={item} className={toneClass[view.tone]}>{item}</Pill>)}
          </div>
        </div>
      </section>

      <PortfolioActionPanel action={action} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SignalMiniTable title="매수 후보 TOP 10" icon={<ArrowUpRight className="h-5 w-5" />} rows={buys} positive />
        <SignalMiniTable title="매도/위험 후보 TOP 10" icon={<ArrowDownRight className="h-5 w-5" />} rows={sells} />
      </div>

      <section className="panel rounded-lg p-5">
        <SectionHeader eyebrow="Theme Leadership" title="주도 테마 TOP 5" icon={<BarChart3 className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {topThemes.map((theme) => (
            <details key={`${theme.region}-${theme.name}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{theme.name}</div>
                    <div className="text-xs text-muted">{theme.region.toUpperCase()} linkage {theme.linkageScore}</div>
                  </div>
                  <div className="font-mono text-2xl text-positive">{theme.themeScore}</div>
                </div>
              </summary>
              <div className="mt-3 space-y-2 text-xs text-white/70">
                <div>1D {formatPercent(theme.return1d)} / 5D {formatPercent(theme.return5d)} / 20D {formatPercent(theme.return20d)}</div>
                <div>Volume {theme.volumeRatio20d.toFixed(1)}x · Adv {theme.advancingRatio}%</div>
                {theme.leaderContribution >= 50 ? <Pill className={toneClass.caution}>대장주 쏠림 경고</Pill> : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Alerts" title="주요 경고 알림" icon={<Bell className="h-5 w-5" />} />
          <div className="space-y-3">
            {snapshot.alerts.slice(0, 5).map((alert) => <AlertCard key={alert.id} alert={alert} compact />)}
          </div>
        </div>
        <div className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Key Metrics" title="핵심 지표" icon={<Gauge className="h-5 w-5" />} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {keyIds.map((id) => {
              const indicator = getIndicator(snapshot, id);
              return indicator ? <MiniIndicator key={id} indicator={indicator} /> : null;
            })}
          </div>
        </div>
      </section>

      <DataReliabilityCompact snapshot={snapshot} />
    </div>
  );
}

function PortfolioActionPanel({ action }: { action: PortfolioAction }) {
  const tone: IndicatorTone = action.exposure === "확대" ? "positive" : action.exposure === "축소" ? "negative" : "neutral";
  const rows = [
    ["Korea Action", action.koreaAction],
    ["US Action", action.usAction],
    ["Theme Action", action.themeAction],
    ["FX/Rates Risk Action", action.fxRatesRiskAction],
    ["Buy Watch 조건", action.buyWatchCondition],
    ["Sell/Risk-off 조건", action.sellRiskOffCondition]
  ];
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Portfolio Action" title="오늘의 포트폴리오 액션" icon={<SlidersHorizontal className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <div className={`rounded-lg border p-4 ${toneClass[tone]}`}>
          <div className="text-xs uppercase tracking-[0.14em] text-white/60">Equity Exposure</div>
          <div className="mt-3 text-4xl font-semibold text-white">{action.exposure}</div>
          <div className="mt-3 text-sm text-white/70">레짐·변동성·환율·내부강도·수급·테마 점수를 종합한 자동 판단</div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <details key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open>
              <summary className="cursor-pointer list-none font-semibold text-white">{label}</summary>
              <p className="mt-2 text-sm text-white/70">{value}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function SignalMiniTable({ title, icon, rows, positive = false }: { title: string; icon: React.ReactNode; rows: EnrichedSignal[]; positive?: boolean }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <div className={positive ? "text-positive" : "text-negative"}>{icon}</div>
      </div>
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Theme</th>
              <th className="px-4 py-3">20D</th>
              <th className="px-4 py-3">RS</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 text-muted">{row.theme}</td>
                <td className={`px-4 py-3 font-mono ${row.return20d >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(row.return20d)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.relativeStrength20d}</td>
                <td className="px-4 py-3"><Pill className={signalClass[row.signalType]}>{row.signalType}</Pill></td>
                <td className="px-4 py-3"><Pill className={actionClass[row.actionTag]}>{row.actionTag}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiniIndicator({ indicator }: { indicator: Indicator }) {
  const status = indicatorStatus(indicator);
  return (
    <details className="rounded-lg border border-white/10 bg-white/[0.03] p-3" open>
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-white">{displayName(indicator)}</div>
            <div className="text-xs text-muted">{indicator.quality.tradeDate ?? indicator.quality.baseDate}</div>
          </div>
          <div className={indicator.changePercent >= 0 ? "text-positive" : "text-negative"}>{formatPercent(indicator.changePercent)}</div>
        </div>
      </summary>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{formatNumber(indicator.value, indicator.unit)}</span>
        <Pill className={statusClass[status]}>{status}</Pill>
      </div>
    </details>
  );
}

function DataReliabilityCompact({ snapshot }: { snapshot: MarketSnapshot }) {
  const logs = sourceLogs(snapshot);
  const counts = {
    fresh: snapshot.indicators.filter((item) => indicatorStatus(item) === "Fresh").length,
    delayed: snapshot.indicators.filter((item) => indicatorStatus(item) === "Delayed").length,
    stale: snapshot.indicators.filter((item) => indicatorStatus(item) === "Stale").length,
    error: snapshot.indicators.filter((item) => indicatorStatus(item) === "Error").length
  };
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Data Reliability" title="데이터 신뢰도" icon={<Database className="h-5 w-5" />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Reliability" value={`${reliabilityScore(snapshot)}/100`} tone="positive" />
        <StatCard label="Fresh" value={counts.fresh} tone="positive" />
        <StatCard label="Delayed" value={counts.delayed} tone="neutral" />
        <StatCard label="Stale" value={counts.stale} tone="caution" />
        <StatCard label="Error" value={counts.error} tone="negative" />
      </div>
      <details className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <summary className="cursor-pointer list-none font-semibold text-white">Source fetch logs</summary>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm lg:grid-cols-2">
          {logs.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-3 rounded border border-white/10 px-3 py-2">
              <span className="truncate text-muted">{log.source}</span>
              <Pill className={statusClass[log.status]}>{log.status}</Pill>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function TradingSignals({ snapshot }: { snapshot: MarketSnapshot }) {
  const signals = signalUniverse(snapshot);
  const groups: Array<[string, EnrichedSignal[]]> = [
    ["Long Candidates", signals.filter((item) => item.candidateGroup === "Long Candidate").slice(0, 6)],
    ["Watchlist Candidates", signals.filter((item) => item.candidateGroup === "Watch Candidate").slice(0, 6)],
    ["Risk-off Candidates", signals.filter((item) => item.candidateGroup === "Risk-Off Candidate").slice(0, 6)]
  ];
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Trading Signals" title="오늘의 액션 후보" icon={<Zap className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {groups.map(([title, rows]) => (
          <section key={title} className="panel rounded-lg p-4">
            <h3 className="font-semibold text-white">{title}</h3>
            <div className="mt-3 space-y-3">
              {rows.map((row) => (
                <details key={row.ticker} className="rounded-lg border border-white/10 bg-white/[0.03] p-3" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{row.name}</div>
                        <div className="text-xs text-muted">{row.ticker} · {row.theme}</div>
                      </div>
                      <Pill className={actionClass[row.actionTag]}>{row.actionTag}</Pill>
                    </div>
                  </summary>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/70">
                    <span>Score {row.signalScore}</span>
                    <span>RS {row.relativeStrength20d}</span>
                    <span>Vol {row.volumeRatio20d.toFixed(1)}x</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{row.riskComment}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SignalTable rows={signals} />
    </div>
  );
}

function SignalTable({ rows }: { rows: EnrichedSignal[] }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-ink">Signal Detail Table</h3>
      </div>
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1800px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              {["ticker", "name", "market", "theme", "close", "change1D", "return5D", "return20D", "volumeRatio20D", "relativeStrength20D", "ma20Position", "ma60Position", "rsi14", "foreignFlow5D", "institutionFlow5D", "signalType", "signalScore", "actionTag", "riskComment"].map((head) => (
                <th key={head} className="px-4 py-3 font-medium">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.ticker}-${row.signalType}`} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 text-muted">{row.market}</td>
                <td className="px-4 py-3 text-muted">{row.theme}</td>
                <td className="px-4 py-3 font-mono text-white">{formatNumber(row.close)}</td>
                <td className={`px-4 py-3 font-mono ${row.change1d >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(row.change1d)}</td>
                <td className={`px-4 py-3 font-mono ${row.return5d >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(row.return5d)}</td>
                <td className={`px-4 py-3 font-mono ${row.return20d >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(row.return20d)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.volumeRatio20d.toFixed(1)}x</td>
                <td className="px-4 py-3 font-mono text-white">{row.relativeStrength20d}</td>
                <td className={row.ma20Position >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.ma20Position)}</td>
                <td className={row.ma60Position >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.ma60Position)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.rsi14.toFixed(1)}</td>
                <td className={row.foreignFlow5d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.foreignFlow5d)}</td>
                <td className={row.institutionFlow5d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.institutionFlow5d)}</td>
                <td className="px-4 py-3"><Pill className={signalClass[row.signalType]}>{row.signalType}</Pill></td>
                <td className="px-4 py-3 font-mono text-white">{row.signalScore}</td>
                <td className="px-4 py-3"><Pill className={actionClass[row.actionTag]}>{row.actionTag}</Pill></td>
                <td className="px-4 py-3 text-muted">{row.riskComment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StockScreener({ snapshot }: { snapshot: MarketSnapshot }) {
  const [market, setMarket] = React.useState("All");
  const [theme, setTheme] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [minScore, setMinScore] = React.useState(0);
  const [minReturn20d, setMinReturn20d] = React.useState(-30);
  const [minVolume, setMinVolume] = React.useState(0);
  const [minRs, setMinRs] = React.useState(0);
  const [ma20Only, setMa20Only] = React.useState(false);
  const [ma60Only, setMa60Only] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<keyof EnrichedSignal>("signalScore");
  const rows = signalUniverse(snapshot);
  const themes = ["All", ...Array.from(new Set(rows.map((row) => row.theme)))];
  const filtered = rows
    .filter((row) => market === "All" || row.market === market)
    .filter((row) => theme === "All" || row.theme === theme)
    .filter((row) => `${row.ticker} ${row.name}`.toLowerCase().includes(search.toLowerCase()))
    .filter((row) => row.signalScore >= minScore)
    .filter((row) => row.return20d >= minReturn20d)
    .filter((row) => row.volumeRatio20d >= minVolume)
    .filter((row) => row.relativeStrength20d >= minRs)
    .filter((row) => !ma20Only || row.ma20Position >= 0)
    .filter((row) => !ma60Only || row.ma60Position >= 0)
    .sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Stock Screener" title="검색·정렬·필터링" icon={<Search className="h-5 w-5" />} />
      <section className="panel rounded-lg p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Select label="Market" value={market} onChange={setMarket} options={["All", "KOSPI", "KOSDAQ", "S&P500", "NASDAQ"]} />
          <Select label="Theme" value={theme} onChange={setTheme} options={themes} />
          <Input label="Search" value={search} onChange={setSearch} />
          <NumberInput label="Min Score" value={minScore} onChange={setMinScore} />
          <NumberInput label="Min 20D Return" value={minReturn20d} onChange={setMinReturn20d} />
          <NumberInput label="Min Volume x" value={minVolume} onChange={setMinVolume} step={0.1} />
          <NumberInput label="Min RSI 14" value={0} onChange={() => undefined} disabled />
          <NumberInput label="Min RS vs Benchmark" value={minRs} onChange={setMinRs} />
          <Select label="Sort" value={String(sortKey)} onChange={(value) => setSortKey(value as keyof EnrichedSignal)} options={["signalScore", "return20d", "return60d", "volumeRatio20d", "relativeStrength20d", "tradingValue", "foreignFlow5d", "institutionFlow5d"]} />
          <Toggle label="Above MA20" checked={ma20Only} onChange={setMa20Only} />
          <Toggle label="Above MA60" checked={ma60Only} onChange={setMa60Only} />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted">52W high proximity, market cap, trading value filters are wired in row data and ready for DB ranges.</div>
        </div>
      </section>
      <ScreenerTable rows={filtered} />
    </div>
  );
}

function ScreenerTable({ rows }: { rows: EnrichedSignal[] }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1700px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              {["name", "ticker", "market", "theme", "marketCap", "tradingValue", "1D", "5D", "20D", "60D", "volumeRatio", "RSI", "MA20", "MA60", "52W proximity", "RS", "foreign 5D", "institution 5D", "signal", "action"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
                <td className="px-4 py-3 text-muted">{row.market}</td>
                <td className="px-4 py-3 text-muted">{row.theme}</td>
                <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.marketCap)}</td>
                <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.tradingValue)}</td>
                <td className={row.change1d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.change1d)}</td>
                <td className={row.return5d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.return5d)}</td>
                <td className={row.return20d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.return20d)}</td>
                <td className={row.return60d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.return60d)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.volumeRatio20d.toFixed(1)}x</td>
                <td className="px-4 py-3 font-mono text-white">{row.rsi14.toFixed(1)}</td>
                <td className={row.ma20Position >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.ma20Position)}</td>
                <td className={row.ma60Position >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.ma60Position)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.high52wProximity}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.relativeStrength20d}</td>
                <td className={row.foreignFlow5d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.foreignFlow5d)}</td>
                <td className={row.institutionFlow5d >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.institutionFlow5d)}</td>
                <td className="px-4 py-3"><Pill className={signalClass[row.signalType]}>{row.signalType}</Pill></td>
                <td className="px-4 py-3"><Pill className={actionClass[row.actionTag]}>{row.actionTag}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ThemeMonitor({ snapshot }: { snapshot: MarketSnapshot }) {
  const rows = themeRows(snapshot);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Theme Monitor" title="테마 점수와 리더십" icon={<BarChart3 className="h-5 w-5" />} />
      <section className="panel rounded-lg p-5">
        <h3 className="font-semibold text-white">Theme Score Formula</h3>
        <p className="mt-2 text-sm text-muted">priceMomentum 25% + volumeExpansion 20% + advancingRatio 20% + newHighParticipation 15% + leaderStrength 10% + qualityScore 10%</p>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rows.map((theme) => (
          <details key={`${theme.region}-${theme.name}`} className="panel rounded-lg p-5" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-muted">{theme.region.toUpperCase()} · Korea-US linkage {theme.linkageScore}</div>
                  <h3 className="mt-1 text-xl font-semibold text-white">{theme.name}</h3>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl text-positive">{theme.themeScore}</div>
                  {theme.leaderContribution >= 50 ? <Pill className={toneClass.caution}>대장주 쏠림 경고</Pill> : null}
                </div>
              </div>
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <ThemeMetric label="1D" value={formatPercent(theme.return1d)} />
              <ThemeMetric label="5D" value={formatPercent(theme.return5d)} />
              <ThemeMetric label="20D" value={formatPercent(theme.return20d)} />
              <ThemeMetric label="Volume" value={`${theme.volumeRatio20d.toFixed(1)}x`} />
              <ThemeMetric label="Advancing" value={`${theme.advancingRatio}%`} />
              <ThemeMetric label="20D Highs" value={theme.newHighCount20d} />
              <ThemeMetric label="Leader contrib." value={`${theme.leaderContribution}%`} />
              <ThemeMetric label="Quality" value={theme.scoreBreakdown.qualityScore} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <StockList title="Leader" items={theme.leaders} />
              <StockList title="Follower" items={theme.followers ?? []} />
              <StockList title="Laggard" items={theme.laggards ?? []} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ThemeMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg text-white">{value}</div>
    </div>
  );
}

function StockList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(items.length ? items : ["-"]).map((item) => <Pill key={item} className="border-white/10 bg-white/5 text-white">{item}</Pill>)}
      </div>
    </div>
  );
}

function AlertsView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Alerts" title="경고와 권장 액션" icon={<AlertTriangle className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {snapshot.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
      </div>
      <section className="panel rounded-lg p-5">
        <h3 className="font-semibold text-white">User Alert Rule Structure</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["Trigger", "indicator + operator + threshold + duration"],
            ["Release", "normalization condition + confirmation count"],
            ["Affected", "assets + themes + signalTypes"],
            ["Suggested Action", "portfolio action text generated from category and severity"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">{label}</div>
              <div className="mt-1 text-sm text-white">{value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AlertCard({ alert, compact = false }: { alert: MarketAlert; compact?: boolean }) {
  const sev = severity(alert);
  const sevClass = sev === "Red" ? toneClass.negative : sev === "Orange" ? toneClass.caution : "border-accent/35 bg-accent/10 text-accent";
  return (
    <details className={`rounded-lg border p-4 ${sevClass}`} open={!compact}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill className={sevClass}>{sev}</Pill>
              <span className="text-xs text-white/60">{formatDateTime(alert.triggeredAt)}</span>
            </div>
            <h3 className="mt-2 font-semibold text-white">{alert.title}</h3>
            <p className="mt-1 text-sm text-white/75">{alert.detail}</p>
          </div>
          <ShieldAlert className="h-5 w-5" />
        </div>
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <InfoBlock label="Suggested Action" value={alertSuggestion(alert)} />
        <InfoBlock label="Trigger" value={alert.triggerCondition ?? alert.rule} />
        <InfoBlock label="Release" value={alert.releaseCondition ?? "조건 해제 후 2회 연속 정상화"} />
        <InfoBlock label="Affected Assets" value={(alert.affectedAssets ?? ["KOSPI", "KOSDAQ", "Growth"]).join(", ")} />
        <InfoBlock label="Affected Themes" value={alertThemes(alert).join(", ")} />
        <InfoBlock label="Affected Signal Types" value={alertSignalTypes(alert).join(", ")} />
      </div>
    </details>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-white/50">{label}</div>
      <div className="mt-1 text-white/80">{value}</div>
    </div>
  );
}

function RegimeDrilldown({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Regime Drill-down" title="점수 산출 근거" icon={<Gauge className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {snapshot.scores.map((score) => <ScoreCard key={score.id} score={score} snapshot={snapshot} />)}
      </div>
    </div>
  );
}

function ScoreCard({ score, snapshot }: { score: MarketScore; snapshot: MarketSnapshot }) {
  const tone = scoreTone(score.value) as IndicatorTone;
  const history = scoreHistory(score);
  return (
    <details className={`panel rounded-lg p-5 ${toneClass[tone]}`} open>
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-white/60">{score.label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{scoreLabel(score.value)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-4xl text-white">{score.value}</div>
            <div className="text-xs text-white/70">1D {scoreChange(score, 1)} · 5D {scoreChange(score, 5)} · 20D {scoreChange(score, 20)}</div>
          </div>
        </div>
      </summary>
      <div className="mt-4 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={history}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: "#101419", border: "1px solid #26313d", color: "#e7edf4" }} />
            <Line type="monotone" dataKey="value" dot={false} stroke="#4aa3ff" strokeWidth={2} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-3">
        {(Object.entries(score.breakdown) as Array<[keyof ScoreBreakdown, number]>).map(([key, value]) => (
          <details key={key} className="rounded border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{breakdownLabels[key]}</span>
                <span className="font-mono text-white">{value} · 기여 {Math.round(value * scoreWeights[key] * 10) / 10}</span>
              </div>
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {scoreEvidence(snapshot, key).map(([label, metric]) => (
                <div key={label} className="flex justify-between gap-3 rounded bg-white/[0.03] px-3 py-2">
                  <span className="text-muted">{label}</span>
                  <span className="font-mono text-white">{metric}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

function BacktestLab({ snapshot }: { snapshot: MarketSnapshot }) {
  const rows = [...mockBacktests, ...(snapshot.backtestMetrics ?? []).filter((row) => row.status === "ready")];
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Backtest Lab" title="신호·테마·레짐별 성과" icon={<FlaskConical className="h-5 w-5" />} />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Targets" value="Signal / Theme / Regime" detail="stock_signals_history 연결 예정" tone="neutral" />
        <StatCard label="Holding Period" value="5D / 10D / 20D / 60D" tone="neutral" />
        <StatCard label="Best Hit Ratio" value={`${Math.max(...rows.map((row) => row.hitRatio ?? 0))}%`} tone="positive" />
        <StatCard label="Worst MDD" value={`${Math.min(...rows.map((row) => row.maxDrawdown ?? 0)).toFixed(1)}%`} tone="negative" />
      </section>
      <section className="panel overflow-hidden rounded-lg">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                {["target", "holding", "averageReturn", "medianReturn", "hitRatio", "maxDrawdown", "profitLossRatio", "sampleSize", "bestCase", "worstCase", "status"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id ?? `${row.signalType}-${row.holdingPeriod}`} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{row.label ?? row.signalType ?? row.theme ?? row.regime}</td>
                  <td className="px-4 py-3 text-muted">{row.holdingPeriod ?? "20D"}</td>
                  <td className={(row.averageReturn ?? 0) >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.averageReturn ?? row.return20d ?? 0)}</td>
                  <td className={(row.medianReturn ?? 0) >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(row.medianReturn ?? 0)}</td>
                  <td className="px-4 py-3 font-mono text-white">{row.hitRatio ?? "-"}%</td>
                  <td className="px-4 py-3 text-negative">{formatPercent(row.maxDrawdown ?? 0)}</td>
                  <td className="px-4 py-3 font-mono text-white">{row.profitLossRatio ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-white">{row.sampleSize}</td>
                  <td className="px-4 py-3 text-positive">{formatPercent(row.bestCase ?? 0)}</td>
                  <td className="px-4 py-3 text-negative">{formatPercent(row.worstCase ?? 0)}</td>
                  <td className="px-4 py-3"><Pill className="border-accent/35 bg-accent/10 text-accent">{row.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function IndicatorDashboard({ snapshot, region, title, icon }: { snapshot: MarketSnapshot; region: Region; title: string; icon: React.ReactNode }) {
  const rows = snapshot.indicators.filter((item) => item.region === region || (region === "macro" && item.region === "macro"));
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={title} title="핵심 지표와 상태" icon={icon} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.slice(0, 16).map((indicator) => <MiniIndicator key={indicator.id} indicator={indicator} />)}
      </div>
      <RegimeDrilldown snapshot={snapshot} />
    </div>
  );
}

function DataQualityView({ snapshot }: { snapshot: MarketSnapshot }) {
  const logs = sourceLogs(snapshot);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Data Source & Quality" title="데이터 소스와 품질" icon={<Database className="h-5 w-5" />} />
      <DataReliabilityCompact snapshot={snapshot} />
      <section className="panel overflow-hidden rounded-lg">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                {["indicator", "market", "category", "tradeDate", "lastUpdated", "source", "status", "change"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {snapshot.indicators.map((indicator) => (
                <tr key={indicator.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{displayName(indicator)}</td>
                  <td className="px-4 py-3 text-muted">{indicator.region}</td>
                  <td className="px-4 py-3 text-muted">{indicator.group}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.tradeDate ?? indicator.quality.baseDate}</td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(indicator.quality.lastUpdated)}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.source}</td>
                  <td className="px-4 py-3"><Pill className={statusClass[indicatorStatus(indicator)]}>{indicatorStatus(indicator)}</Pill></td>
                  <td className={indicator.changePercent >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatPercent(indicator.changePercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="font-semibold text-white">Source Fetch Logs</h3>
          <RadioTower className="h-5 w-5 text-accent" />
        </div>
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                {["source", "status", "lastAttempt", "latency", "message", "indicators"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{log.source}</td>
                  <td className="px-4 py-3"><Pill className={statusClass[log.status]}>{log.status}</Pill></td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(log.lastAttemptAt)}</td>
                  <td className="px-4 py-3 text-muted">{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                  <td className="px-4 py-3 text-muted">{log.message}</td>
                  <td className="px-4 py-3 font-mono text-white">{log.affectedIndicatorIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
    </label>
  );
}

function NumberInput({ label, value, onChange, step = 1, disabled = false }: { label: string; value: number; onChange: (value: number) => void; step?: number; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input disabled={disabled} type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none disabled:opacity-45" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function MarketDashboard() {
  const [active, setActive] = React.useState<NavItem>("Market Pulse");
  const [snapshot, setSnapshot] = React.useState<MarketSnapshot>(marketSnapshot);
  const [dataStatus, setDataStatus] = React.useState<"loading" | "live" | "fallback">("loading");
  const [lastRefreshAt, setLastRefreshAt] = React.useState<string | null>(null);
  const [nextRefreshMs, setNextRefreshMs] = React.useState(() => refreshIntervalMs());

  React.useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/snapshot", { cache: "no-store" });
        if (!response.ok) throw new Error(`snapshot ${response.status}`);
        const nextSnapshot = (await response.json()) as MarketSnapshot;
        if (!mounted) return;
        setSnapshot({ ...marketSnapshot, ...nextSnapshot });
        setDataStatus(nextSnapshot.indicators.some((indicator) => !indicator.quality.stale) ? "live" : "fallback");
      } catch {
        if (!mounted) return;
        setDataStatus("fallback");
      } finally {
        if (mounted) setLastRefreshAt(new Date().toISOString());
      }
    }

    function scheduleNextRefresh() {
      const interval = refreshIntervalMs();
      if (mounted) setNextRefreshMs(interval);
      timer = window.setTimeout(async () => {
        await loadSnapshot();
        if (mounted) scheduleNextRefresh();
      }, interval);
    }

    loadSnapshot().finally(() => {
      if (mounted) scheduleNextRefresh();
    });

    return () => {
      mounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const renderContent = () => {
    if (active === "Market Pulse") return <HomeView snapshot={snapshot} />;
    if (active === "Korea Dashboard") return <IndicatorDashboard snapshot={snapshot} region="korea" title="Korea Dashboard" icon={<TrendingUp className="h-5 w-5" />} />;
    if (active === "US Dashboard") return <IndicatorDashboard snapshot={snapshot} region="us" title="US Dashboard" icon={<Globe2 className="h-5 w-5" />} />;
    if (active === "Macro & Liquidity") return <IndicatorDashboard snapshot={snapshot} region="macro" title="Macro & Liquidity" icon={<LineChart className="h-5 w-5" />} />;
    if (active === "Theme Monitor") return <ThemeMonitor snapshot={snapshot} />;
    if (active === "Trading Signals") return <TradingSignals snapshot={snapshot} />;
    if (active === "Stock Screener") return <StockScreener snapshot={snapshot} />;
    if (active === "Alerts") return <AlertsView snapshot={snapshot} />;
    if (active === "Backtest Lab") return <BacktestLab snapshot={snapshot} />;
    return <DataQualityView snapshot={snapshot} />;
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Market Regime Monitor</h1>
            <p className="mt-1 text-sm text-muted">Action-first Korea · US trading dashboard · KST {formatDateTime(snapshot.generatedAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-5">
          <HeaderStat label="Korea" value={marketSession("korea")} />
          <HeaderStat label="US" value={marketSession("us")} />
          <HeaderStat label="Reliability" value={`${reliabilityScore(snapshot)}/100`} />
          <HeaderStat label="Data" value={dataStatus === "live" ? "Live API" : dataStatus === "loading" ? "Loading" : "Fallback"} />
          <HeaderStat label="Refresh" value={`${refreshCadenceLabel(nextRefreshMs)}${lastRefreshAt ? ` · ${formatDateTime(lastRefreshAt)}` : ""}`} />
        </div>
      </header>

      <div className="mx-auto mt-4 grid max-w-[1680px] grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit rounded-lg p-3 lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between px-2 py-1 text-xs uppercase tracking-[0.16em] text-muted">
            <span>Pages</span>
            <Menu className="h-4 w-4" />
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActive(item)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                  active === item ? "bg-accent/15 text-white ring-1 ring-accent/35" : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item}</span>
                <ChevronDown className={`h-4 w-4 transition ${active === item ? "-rotate-90 text-accent" : "text-white/30"}`} />
              </button>
            ))}
          </nav>
          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Action Color</div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>위험선호</span><span className="text-positive">green</span></div>
              <div className="flex justify-between"><span>중립</span><span className="text-muted">gray</span></div>
              <div className="flex justify-between"><span>위험관리</span><span className="text-caution">orange</span></div>
              <div className="flex justify-between"><span>위험회피</span><span className="text-negative">red</span></div>
            </div>
          </div>
        </aside>
        <section className="min-w-0">{renderContent()}</section>
      </div>
    </main>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="block text-white/70">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
