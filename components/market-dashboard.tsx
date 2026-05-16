"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Database,
  FlaskConical,
  Gauge,
  Globe2,
  Landmark,
  Layers3,
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
  Area,
  AreaChart,
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
  AlertSeverity,
  BacktestMetric,
  DataAccess,
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

const toneClasses: Record<IndicatorTone, { text: string; bg: string; border: string; chart: string; soft: string }> = {
  positive: {
    text: "text-positive",
    bg: "bg-positive/10",
    border: "border-positive/35",
    chart: "#21c17a",
    soft: "bg-positive/5"
  },
  negative: {
    text: "text-negative",
    bg: "bg-negative/10",
    border: "border-negative/35",
    chart: "#ff5c72",
    soft: "bg-negative/5"
  },
  neutral: {
    text: "text-muted",
    bg: "bg-white/5",
    border: "border-white/10",
    chart: "#8f9baa",
    soft: "bg-white/[0.03]"
  },
  caution: {
    text: "text-caution",
    bg: "bg-caution/10",
    border: "border-caution/35",
    chart: "#f5b84b",
    soft: "bg-caution/5"
  }
};

const statusClass: Record<DataStatus, string> = {
  Fresh: "border-positive/35 bg-positive/10 text-positive",
  Delayed: "border-accent/35 bg-accent/10 text-accent",
  Stale: "border-caution/35 bg-caution/10 text-caution",
  Error: "border-negative/40 bg-negative/10 text-negative"
};

const severityClass: Record<"Red" | "Orange" | "Yellow", string> = {
  Red: "border-negative/50 bg-negative/10 text-negative",
  Orange: "border-caution/45 bg-caution/10 text-caution",
  Yellow: "border-accent/35 bg-accent/10 text-accent"
};

const indicatorNames: Record<string, string> = {
  kospi: "KOSPI",
  kosdaq: "KOSDAQ",
  kospi200: "KOSPI 200",
  kosdaq150: "KOSDAQ 150",
  krx300: "KRX 300",
  "k200-fut": "KOSPI200 Futures",
  "mini-k200-fut": "Mini KOSPI200 Futures",
  "kq150-fut": "KOSDAQ150 Futures",
  "k200-night": "KOSPI200 Night Futures",
  "kq150-night": "KOSDAQ150 Night Futures",
  "foreign-kospi-flow": "Foreign KOSPI Flow",
  "institution-flow": "Institution Flow",
  "pension-flow": "Pension Fund Flow",
  "financial-investment-flow": "Financial Investment Flow",
  "retail-flow": "Retail Flow",
  "program-trading": "Program Trading",
  "short-sale-value": "Short Sale Value",
  "margin-loan": "Margin Loan",
  "customer-deposits": "Customer Deposits",
  "kr-advancers": "KR Advancers",
  "kr-decliners": "KR Decliners",
  "kr-above-ma20": "KR Above 20D MA",
  "kr-above-ma60": "KR Above 60D MA",
  "kr-above-ma200": "KR Above 200D MA",
  "kr-52w-high": "KR 52W Highs",
  "kr-52w-low": "KR 52W Lows",
  spx: "S&P 500",
  "nasdaq-composite": "Nasdaq Composite",
  ndx: "Nasdaq 100",
  dow: "Dow",
  russell2000: "Russell 2000",
  sox: "SOX",
  "spx-equal-weight": "S&P 500 Equal Weight",
  "es-fut": "S&P 500 Futures",
  "nq-fut": "Nasdaq 100 Futures",
  "ym-fut": "Dow Futures",
  "rty-fut": "Russell 2000 Futures",
  vix: "VIX",
  vxn: "VXN",
  vvix: "VVIX",
  move: "MOVE",
  "put-call": "Put/Call Ratio",
  "cftc-spx": "CFTC S&P 500 Net",
  "cftc-nq": "CFTC Nasdaq 100 Net",
  "cftc-10y": "CFTC 10Y Treasury Net",
  "cftc-dollar": "CFTC Dollar Net",
  aaii: "AAII Bull-Bear Spread",
  "finra-margin": "FINRA Margin Debt",
  "us-2y": "US Treasury 2Y",
  "us-10y": "US Treasury 10Y",
  "us-30y": "US Treasury 30Y",
  "real-yield-10y": "US 10Y Real Yield",
  "bei-10y": "10Y Breakeven Inflation",
  "yield-10y-2y": "10Y-2Y Spread",
  "kr-3y": "Korea Treasury 3Y",
  "kr-10y": "Korea Treasury 10Y",
  "hy-oas": "US HY OAS",
  "ig-oas": "US IG OAS",
  "fed-assets": "Fed Total Assets",
  tga: "TGA",
  rrp: "RRP",
  "bank-reserves": "Bank Reserves",
  "net-liquidity": "Net Liquidity Proxy",
  sofr: "SOFR",
  cpi: "CPI",
  "core-cpi": "Core CPI",
  pce: "PCE",
  "core-pce": "Core PCE",
  "cleveland-nowcast": "Cleveland Fed Nowcast",
  "ism-mfg": "ISM Manufacturing",
  "ism-services": "ISM Services",
  "jobless-claims": "Initial Jobless Claims",
  unemployment: "Unemployment Rate",
  "retail-sales": "Retail Sales",
  "kr-export-20d": "Korea Exports 1-20D",
  "kr-trade-balance": "Korea Trade Balance",
  dxy: "DXY",
  "usd-krw": "USD/KRW",
  "usd-jpy": "USD/JPY"
};

const breakdownLabels: Record<keyof ScoreBreakdown, string> = {
  trend: "가격 추세",
  breadth: "시장 내부강도",
  liquidity: "유동성",
  ratesCredit: "금리·신용",
  flow: "수급",
  sentimentVolatility: "심리·변동성"
};

function displayName(indicator: Indicator) {
  return indicatorNames[indicator.id] ?? indicator.name;
}

function regionLabel(region: Region) {
  const labels: Record<Region, string> = {
    global: "Global",
    korea: "Korea",
    us: "US",
    macro: "Macro"
  };
  return labels[region];
}

function accessLabel(access: DataAccess) {
  const labels: Record<DataAccess, string> = {
    free: "Free",
    paid: "Paid",
    manual: "Manual"
  };
  return labels[access];
}

function formatNumber(value: number, unit = "") {
  const fraction = Math.abs(value) < 10 && unit !== "bp" ? 2 : Math.abs(value) < 100 ? 1 : 0;
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction
  }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
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

function byIds(snapshot: MarketSnapshot, ids: string[]) {
  return ids
    .map((id) => snapshot.indicators.find((indicator) => indicator.id === id))
    .filter(Boolean) as Indicator[];
}

function byRegion(snapshot: MarketSnapshot, region: Region) {
  return snapshot.indicators.filter((indicator) => indicator.region === region);
}

function byGroup(snapshot: MarketSnapshot, group: Indicator["group"]) {
  return snapshot.indicators.filter((indicator) => indicator.group === group);
}

function indicatorStatus(indicator: Indicator): DataStatus {
  if (indicator.quality.status) return indicator.quality.status;
  if (indicator.quality.errorMessage) return "Error";
  if (indicator.quality.stale || indicator.quality.source.toLowerCase().includes("fallback")) return "Stale";

  const updated = new Date(indicator.quality.lastUpdated);
  if (Number.isNaN(updated.getTime())) return "Delayed";
  const ageHours = (Date.now() - updated.getTime()) / 36e5;
  if (ageHours > 48) return "Delayed";
  return "Fresh";
}

function reliabilityScore(snapshot: MarketSnapshot) {
  const weights: Record<DataStatus, number> = { Fresh: 100, Delayed: 72, Stale: 32, Error: 0 };
  const indicators = snapshot.indicators;
  if (!indicators.length) return 0;
  const total = indicators.reduce((acc, indicator) => acc + weights[indicatorStatus(indicator)], 0);
  return Math.round(total / indicators.length);
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
  return {
    weekday: parts.weekday ?? "Mon",
    minutes: Number(parts.hour ?? 0) * 60 + Number(parts.minute ?? 0)
  };
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

function sessionClass(status: string) {
  if (status === "Open") return "border-positive/35 bg-positive/10 text-positive";
  if (status === "Pre-market" || status === "After-hours") return "border-accent/35 bg-accent/10 text-accent";
  return "border-white/10 bg-white/5 text-muted";
}

function refreshIntervalMs() {
  const korea = marketSession("korea");
  const us = marketSession("us");
  const active = [korea, us].some((status) => status === "Open" || status === "Pre-market" || status === "After-hours");
  return active ? 60 * 1000 : 5 * 60 * 1000;
}

function refreshCadenceLabel(ms: number) {
  return ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`;
}

function scoreHistory(score: MarketScore) {
  if (score.history?.length) return score.history;
  return Array.from({ length: 60 }, (_, index) => {
    const drift = (index - 48) * 0.05;
    const wave = Math.sin(index / 5) * 4 + Math.cos(index / 9) * 2;
    return {
      date: `D-${59 - index}`,
      value: Math.max(0, Math.min(100, Number((score.value + drift + wave).toFixed(1))))
    };
  });
}

function scoreChanges(score: MarketScore) {
  const history = scoreHistory(score);
  const at = (offset: number) => history[Math.max(0, history.length - 1 - offset)]?.value ?? score.value;
  return {
    one: score.change1d ?? Number((score.value - at(1)).toFixed(1)),
    five: score.change5d ?? Number((score.value - at(5)).toFixed(1)),
    twenty: score.change20d ?? Number((score.value - at(20)).toFixed(1))
  };
}

function scoreSummary(score: MarketScore) {
  if (score.summary) return score.summary;
  const entries = Object.entries(score.breakdown) as Array<[keyof ScoreBreakdown, number]>;
  const strongest = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
  const weakest = entries.reduce((a, b) => (a[1] < b[1] ? a : b));
  const label = scoreLabel(score.value);
  return `${score.label}는 ${label} 구간입니다. ${breakdownLabels[strongest[0]]}가 가장 우호적이고, ${breakdownLabels[weakest[0]]}가 점수의 상단을 제한하고 있습니다.`;
}

function normalizedSeverity(severity: AlertSeverity): "Red" | "Orange" | "Yellow" {
  if (severity === "red" || severity === "critical") return "Red";
  if (severity === "orange" || severity === "warning") return "Orange";
  return "Yellow";
}

function defaultThemeBreakdown(theme: ThemeMomentum): ThemeScoreBreakdown {
  return (
    theme.scoreBreakdown ?? {
      momentumScore: Math.min(100, Math.max(0, theme.score + theme.fiveDay * 2)),
      volumeScore: Math.min(100, Math.round(theme.volumeRatio * 36)),
      breadthScore: Math.min(100, Math.max(25, theme.score - 8)),
      leaderScore: theme.concentrationRisk ? 86 : Math.min(100, theme.score + 4),
      qualityScore: theme.quality.stale ? 42 : 76,
      newsScore: theme.score >= 70 ? 78 : theme.score >= 50 ? 58 : 38
    }
  );
}

function defaultSourceLogs(snapshot: MarketSnapshot): SourceFetchLog[] {
  if (snapshot.sourceLogs?.length) return snapshot.sourceLogs;
  const grouped = new Map<string, Indicator[]>();
  snapshot.indicators.forEach((indicator) => {
    const source = indicator.quality.source.split(" / ")[0];
    grouped.set(source, [...(grouped.get(source) ?? []), indicator]);
  });
  return [...grouped.entries()].slice(0, 12).map(([source, indicators], index) => {
    const hasError = indicators.some((indicator) => indicatorStatus(indicator) === "Error");
    const hasStale = indicators.some((indicator) => indicatorStatus(indicator) === "Stale");
    return {
      id: `${source}-${index}`,
      source,
      status: hasError ? "Error" : hasStale ? "Stale" : "Fresh",
      lastAttemptAt: snapshot.generatedAt,
      latencyMs: hasStale ? 0 : 500 + index * 37,
      message: hasStale ? "Some dependent indicators are using last known values." : "Latest available payload accepted.",
      affectedIndicatorIds: indicators.map((indicator) => indicator.id)
    };
  });
}

function decision(snapshot: MarketSnapshot) {
  const global = snapshot.scores.find((score) => score.id === "global-risk") ?? snapshot.scores[0];
  const vix = snapshot.indicators.find((indicator) => indicator.id === "vix");
  const liquidity = snapshot.scores.find((score) => score.id === "liquidity");
  const breadth = snapshot.scores.find((score) => score.id === "breadth");
  const tone = scoreTone(global.value) as IndicatorTone;
  const label = scoreLabel(global.value);
  const reasons = [
    `${global.label} ${global.value}점으로 ${label} 구간`,
    `유동성 점수 ${liquidity?.value ?? "-"}점, 내부강도 점수 ${breadth?.value ?? "-"}점`,
    vix ? `VIX 전일 대비 ${formatPercent(vix.changePercent)}로 변동성 압력 확인` : "변동성 데이터 대기"
  ];
  const actions =
    global.value >= 60
      ? ["주도 테마 눌림목 우선", "과열 종목은 분할 익절", "환율·금리 급등 알림 유지"]
      : global.value >= 40
        ? ["추격 매수 축소", "신고가 종목만 선별", "현금 비중과 손절 기준 명확화"]
        : ["레버리지 축소", "방어 업종과 달러 민감 자산 점검", "신규 매수는 알림 해제 후 재평가"];
  return { tone, label, reasons, actions };
}

function MetricCard({ indicator, compact = false }: { indicator: Indicator; compact?: boolean }) {
  const tone = toneClasses[indicator.tone];
  const status = indicatorStatus(indicator);
  return (
    <article className={`panel flex flex-col justify-between rounded-lg p-4 ${compact ? "min-h-[138px]" : "min-h-[168px]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">{displayName(indicator)}</h3>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusClass[status]}`}>{status}</span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
            {regionLabel(indicator.region)} · {indicator.group}
          </p>
        </div>
        <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone.border} ${tone.bg} ${tone.text}`}>
          {formatPercent(indicator.changePercent)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_96px] items-end gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold text-white">{formatNumber(indicator.value, indicator.unit)}</div>
          <div className="mt-1 text-xs text-muted">Prev {formatNumber(indicator.previousClose, indicator.unit)}</div>
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={indicator.sparkline}>
              <Area type="monotone" dataKey="value" stroke={tone.chart} fill={tone.chart} fillOpacity={0.14} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <details className="mt-4 border-t border-white/10 pt-3 text-[11px] text-muted" open={!compact}>
        <summary className="cursor-pointer list-none text-white/70">Data details</summary>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <span className="block text-white/60">Trade date</span>
            {indicator.quality.tradeDate ?? indicator.quality.baseDate}
          </div>
          <div>
            <span className="block text-white/60">Updated</span>
            {formatDateTime(indicator.quality.lastUpdated)}
          </div>
          <div>
            <span className="block text-white/60">Source</span>
            <span className="line-clamp-2">{indicator.quality.source}</span>
          </div>
        </div>
      </details>
    </article>
  );
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

function StatusPill({ status }: { status: DataStatus }) {
  return <span className={`rounded border px-2 py-1 text-xs font-semibold ${statusClass[status]}`}>{status}</span>;
}

function MarketStateStrip({ snapshot }: { snapshot: MarketSnapshot }) {
  const reliability = reliabilityScore(snapshot);
  const reliabilityTone: IndicatorTone = reliability >= 75 ? "positive" : reliability >= 55 ? "neutral" : reliability >= 35 ? "caution" : "negative";
  const tone = toneClasses[reliabilityTone];
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className={`panel rounded-lg p-4 ${tone.border}`}>
        <div className="text-xs uppercase tracking-[0.16em] text-muted">데이터 신뢰도 점수</div>
        <div className={`mt-2 font-mono text-4xl font-semibold ${tone.text}`}>{reliability}</div>
      </div>
      {(["korea", "us"] as const).map((market) => {
        const session = marketSession(market);
        return (
          <div key={market} className={`panel rounded-lg border p-4 ${sessionClass(session)}`}>
            <div className="text-xs uppercase tracking-[0.16em] text-white/65">{market === "korea" ? "Korea Market" : "US Market"}</div>
            <div className="mt-2 text-2xl font-semibold">{session}</div>
          </div>
        );
      })}
    </section>
  );
}

function FreshnessPanel({ snapshot, limit = 12 }: { snapshot: MarketSnapshot; limit?: number }) {
  const rows = snapshot.indicators.slice(0, limit);
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="font-semibold text-ink">Data Freshness Panel</h3>
          <p className="mt-1 text-xs text-muted">lastUpdated · tradeDate · source · status</p>
        </div>
        <Database className="h-5 w-5 text-accent" />
      </div>
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Indicator</th>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Trade date</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((indicator) => (
              <tr key={indicator.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-ink">{displayName(indicator)}</td>
                <td className="px-4 py-3 text-muted">{regionLabel(indicator.region)}</td>
                <td className="px-4 py-3 text-muted">{indicator.quality.tradeDate ?? indicator.quality.baseDate}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(indicator.quality.lastUpdated)}</td>
                <td className="px-4 py-3 text-muted">{indicator.quality.source}</td>
                <td className="px-4 py-3"><StatusPill status={indicatorStatus(indicator)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScoreGauge({ score }: { score: MarketScore }) {
  const tone = toneClasses[scoreTone(score.value) as IndicatorTone];
  const changes = scoreChanges(score);
  const chartData = Object.entries(score.breakdown).map(([key, value]) => ({
    key,
    label: breakdownLabels[key as keyof ScoreBreakdown],
    value,
    contribution: Number((value * (scoreWeights[key as keyof ScoreBreakdown] / 100)).toFixed(1))
  }));

  return (
    <section className={`panel rounded-lg p-5 ${tone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{regionLabel(score.region)}</p>
          <h2 className="mt-1 text-base font-semibold text-ink">{score.label}</h2>
        </div>
        <Gauge className={`h-5 w-5 ${tone.text}`} />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className={`font-mono text-5xl font-semibold ${tone.text}`}>{score.value}</div>
          <div className="mt-2 text-sm font-medium text-ink">{scoreLabel(score.value)}</div>
        </div>
        <div className="h-20 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.value >= 60 ? "#21c17a" : entry.value >= 40 ? "#8f9baa" : entry.value >= 20 ? "#f5b84b" : "#ff5c72"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <ChangeBadge label="1D" value={changes.one} />
        <ChangeBadge label="5D" value={changes.five} />
        <ChangeBadge label="20D" value={changes.twenty} />
      </div>
    </section>
  );
}

function ChangeBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className={`rounded border px-2 py-1 ${value >= 0 ? "border-positive/25 bg-positive/10 text-positive" : "border-negative/25 bg-negative/10 text-negative"}`}>
      <span className="text-white/60">{label}</span> {value >= 0 ? "+" : ""}
      {value.toFixed(1)}
    </div>
  );
}

function ScoreExplainability({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Regime Score Explainability" title="점수 구성과 변화 원인" icon={<LineChart className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {snapshot.scores.map((score) => (
          <ScoreExplainCard key={score.id} score={score} />
        ))}
      </div>
    </div>
  );
}

function ScoreExplainCard({ score }: { score: MarketScore }) {
  const history = scoreHistory(score);
  const rows = (Object.entries(score.breakdown) as Array<[keyof ScoreBreakdown, number]>).map(([key, value]) => ({
    key,
    label: breakdownLabels[key],
    score: value,
    weight: scoreWeights[key],
    contribution: Number((value * (scoreWeights[key] / 100)).toFixed(1))
  }));
  return (
    <section className="panel rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-ink">{score.label}</h3>
          <p className="mt-1 text-sm text-muted">{scoreSummary(score)}</p>
        </div>
        <span className={`rounded border px-2 py-1 text-sm ${toneClasses[scoreTone(score.value) as IndicatorTone].border} ${toneClasses[scoreTone(score.value) as IndicatorTone].bg}`}>
          {score.value}
        </span>
      </div>
      <div className="mt-4 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={history}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" stroke="#8f9baa" tickLine={false} axisLine={false} interval={14} />
            <YAxis stroke="#8f9baa" tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#101419", border: "1px solid #26313d", color: "#e7edf4" }} />
            <Line type="monotone" dataKey="value" stroke="#4aa3ff" strokeWidth={2.4} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-ink">{row.label}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${row.score}%` }} />
              </div>
            </div>
            <div className="text-right font-mono text-xs text-muted">
              <div>{row.score} / 100</div>
              <div>{row.weight}% · {row.contribution}pt</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketPulse({ snapshot }: { snapshot: MarketSnapshot }) {
  const pulse = decision(snapshot);
  const pulseTone = toneClasses[pulse.tone];
  const topThemes = [...snapshot.themes].sort((a, b) => b.score - a.score).slice(0, 6);
  const pulseIndicators = byIds(snapshot, ["kospi", "spx", "vix", "usd-krw", "hy-oas", "net-liquidity"]);

  return (
    <div className="space-y-6">
      <section className={`panel rounded-lg p-5 ${pulseTone.border}`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">오늘의 시장 판단</p>
            <h2 className={`mt-2 text-2xl font-semibold ${pulseTone.text}`}>{pulse.label}</h2>
            <p className="mt-2 text-sm text-white/75">점수와 데이터 신뢰도를 함께 반영한 현재 운용 판단입니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:w-[720px]">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">핵심 근거</div>
              <ul className="mt-2 space-y-1 text-sm text-white/80">
                {pulse.reasons.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-muted">권장 액션</div>
              <ul className="mt-2 space-y-1 text-sm text-white/80">
                {pulse.actions.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <MarketStateStrip snapshot={snapshot} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {snapshot.scores.slice(0, 6).map((score) => <ScoreGauge key={score.id} score={score} />)}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Leadership" title="오늘의 주도 테마" icon={<Zap className="h-5 w-5" />} />
          <div className="overflow-hidden rounded-lg border border-white/10">
            {topThemes.map((theme) => <ThemeRow key={`${theme.region}-${theme.name}`} theme={theme} />)}
          </div>
        </section>
        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Warnings" title="주요 경고 알림" icon={<Bell className="h-5 w-5" />} />
          <div className="space-y-3">
            {snapshot.alerts.slice(0, 4).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        </section>
      </div>

      <section>
        <SectionHeader eyebrow="Cross Asset Tape" title="핵심 지표 빠른 확인" icon={<Activity className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pulseIndicators.map((indicator) => <MetricCard key={indicator.id} indicator={indicator} />)}
        </div>
      </section>

      <FreshnessPanel snapshot={snapshot} limit={10} />
      <ScoreExplainability snapshot={snapshot} />
    </div>
  );
}

function ThemeRow({ theme }: { theme: ThemeMomentum }) {
  const tone = toneClasses[theme.tone];
  const linked = theme.linkedThemes?.join(" · ") ?? (theme.region === "korea" ? "US AI · Semiconductor" : "Korea Semiconductor · AI Infra");
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 max-md:grid-cols-1">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2 py-1 font-mono text-sm font-semibold ${tone.border} ${tone.bg} ${tone.text}`}>{theme.score}</span>
          <span className="font-semibold text-ink">{theme.name}</span>
          {theme.concentrationRisk ? <span className="rounded bg-caution/10 px-2 py-1 text-xs text-caution">Concentration Risk</span> : null}
        </div>
        <div className="mt-1 truncate text-xs text-muted">{linked}</div>
      </div>
      <div className={theme.oneDay >= 0 ? "text-positive" : "text-negative"}>{formatPercent(theme.oneDay)}</div>
      <div className="font-mono text-sm text-ink">{theme.volumeRatio.toFixed(1)}x</div>
    </div>
  );
}

function AlertCard({ alert }: { alert: MarketAlert }) {
  const severity = normalizedSeverity(alert.severity);
  return (
    <article className={`rounded-lg border p-4 ${severityClass[severity]}`}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{alert.title}</h3>
            <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] uppercase text-white/70">{severity}</span>
          </div>
          <p className="mt-2 text-sm leading-5 text-white/75">{alert.detail}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted md:grid-cols-2">
            <div><span className="text-white/60">Trigger</span> {alert.triggerCondition ?? alert.rule}</div>
            <div><span className="text-white/60">Release</span> {alert.releaseCondition ?? "조건 해제 또는 2회 연속 정상화"}</div>
            <div className="md:col-span-2"><span className="text-white/60">Affected</span> {(alert.affectedAssets ?? ["KOSPI", "KOSDAQ", "Growth", "FX-sensitive"]).join(", ")}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function IndicatorTable({ title, indicators }: { title: string; indicators: Indicator[] }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">{indicators.length} items</span>
      </div>
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Indicator</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Trade date</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator) => {
              const tone = toneClasses[indicator.tone];
              return (
                <tr key={indicator.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{displayName(indicator)}</td>
                  <td className="px-4 py-3 font-mono text-white">{formatNumber(indicator.value, indicator.unit)}</td>
                  <td className={`px-4 py-3 font-mono ${tone.text}`}>{formatPercent(indicator.changePercent)}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.tradeDate ?? indicator.quality.baseDate}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.source}</td>
                  <td className="px-4 py-3"><StatusPill status={indicatorStatus(indicator)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DashboardGrid({ region, title, eyebrow, ids, icon, snapshot }: { region: Region; title: string; eyebrow: string; ids: string[]; icon: React.ReactNode; snapshot: MarketSnapshot }) {
  const selected = byIds(snapshot, ids);
  const score = snapshot.scores.find((item) => item.region === region);
  const breadth = byRegion(snapshot, region).filter((item) => item.group === "breadth").slice(0, 8);
  const flow = byRegion(snapshot, region).filter((item) => item.group === "flow").slice(0, 8);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} icon={icon} />
      {score ? <ScoreExplainCard score={score} /> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selected.map((indicator) => <MetricCard key={indicator.id} indicator={indicator} />)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <IndicatorTable title="시장 내부강도" indicators={breadth} />
        <IndicatorTable title="수급" indicators={flow} />
      </div>
    </div>
  );
}

function MacroLiquidity({ snapshot }: { snapshot: MarketSnapshot }) {
  const netLiquidity = snapshot.indicators.find((item) => item.id === "net-liquidity");
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Macro & Liquidity" title="금리·유동성·신용·인플레이션" icon={<Landmark className="h-5 w-5" />} />
      {netLiquidity ? (
        <section className="panel rounded-lg p-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <MetricCard indicator={netLiquidity} compact />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={netLiquidity.sparkline}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="date" stroke="#8f9baa" tickLine={false} axisLine={false} />
                  <YAxis stroke="#8f9baa" tickLine={false} axisLine={false} domain={["dataMin - 0.04", "dataMax + 0.04"]} />
                  <Tooltip contentStyle={{ background: "#101419", border: "1px solid #26313d", color: "#e7edf4" }} />
                  <Line type="monotone" dataKey="value" stroke="#4aa3ff" strokeWidth={2.5} dot={false} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <IndicatorTable title="금리·환율" indicators={byGroup(snapshot, "rates")} />
        <IndicatorTable title="유동성·신용" indicators={[...byGroup(snapshot, "liquidity"), ...byGroup(snapshot, "credit")]} />
        <IndicatorTable title="인플레이션" indicators={byGroup(snapshot, "inflation")} />
        <IndicatorTable title="매크로 이벤트 지표" indicators={byGroup(snapshot, "macro")} />
      </div>
    </div>
  );
}

function ThemeMonitor({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Theme Monitor" title="테마 점수와 한·미 연결" icon={<BarChart3 className="h-5 w-5" />} />
      <section className="panel rounded-lg p-5">
        <h3 className="font-semibold text-ink">Theme Score Formula</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted md:grid-cols-6">
          {["가격 모멘텀 25", "거래대금 20", "상승종목 비율 20", "신고가·대장주 15", "데이터 품질 10", "뉴스 이벤트 10"].map((item) => (
            <div key={item} className="rounded border border-white/10 bg-white/5 px-3 py-2">{item}</div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {(["korea", "us"] as const).map((region) => (
          <ThemePanel key={region} title={region === "korea" ? "Korea Themes" : "US Themes"} themes={snapshot.themes.filter((theme) => theme.region === region)} />
        ))}
      </div>
    </div>
  );
}

function ThemePanel({ title, themes }: { title: string; themes: ThemeMomentum[] }) {
  return (
    <section className="panel rounded-lg p-5">
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-4 space-y-4">
        {[...themes].sort((a, b) => b.score - a.score).map((theme) => {
          const breakdown = defaultThemeBreakdown(theme);
          const rows = [
            ["Momentum", breakdown.momentumScore],
            ["Volume", breakdown.volumeScore],
            ["Breadth", breakdown.breadthScore],
            ["Leader", breakdown.leaderScore],
            ["Quality", breakdown.qualityScore],
            ["News", breakdown.newsScore]
          ];
          return (
            <details key={theme.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open={theme.score >= 70}>
              <summary className="cursor-pointer list-none">
                <ThemeRow theme={theme} />
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-2">
                  {rows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[88px_1fr_42px] items-center gap-3 text-sm">
                      <span className="text-muted">{label}</span>
                      <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div>
                      <span className="font-mono text-white">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm text-muted">
                  <div><span className="text-white/70">Leader</span> {(theme.leaders ?? []).join(", ")}</div>
                  <div><span className="text-white/70">Follower</span> {(theme.followers ?? ["Secondary basket"]).join(", ")}</div>
                  <div><span className="text-white/70">Laggard</span> {(theme.laggards ?? ["Weak breadth names"]).join(", ")}</div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function TradingSignals({ snapshot }: { snapshot: MarketSnapshot }) {
  const signals = snapshot.stockSignals ?? [];
  const groups: StockSignal["candidateGroup"][] = ["Long Candidate", "Watch Candidate", "Risk-Off Candidate"];
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Trading Signals" title="오늘의 후보군" icon={<Zap className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group} className="panel rounded-lg p-5">
            <h3 className="font-semibold text-ink">{group}</h3>
            <div className="mt-4 space-y-3">
              {signals.filter((signal) => signal.candidateGroup === group).map((signal) => <SignalCard key={`${signal.ticker}-${signal.signalType}`} signal={signal} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: StockSignal }) {
  const actionTone: IndicatorTone = signal.actionTag === "Avoid" ? "negative" : signal.actionTag === "Take Profit" ? "caution" : signal.actionTag === "Buy Watch" ? "positive" : "neutral";
  const tone = toneClasses[actionTone];
  return (
    <article className={`rounded-lg border p-4 ${tone.border} ${tone.soft}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{signal.name}</div>
          <div className="mt-1 text-xs text-muted">{signal.ticker} · {signal.market} · {signal.theme}</div>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${tone.bg} ${tone.text}`}>{signal.actionTag}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-white/10 px-2 py-1 text-white">{signal.signalType}</span>
        <span className="rounded bg-white/10 px-2 py-1 text-white">RS {signal.relativeStrength}</span>
        <span className="rounded bg-white/10 px-2 py-1 text-white">RSI {signal.rsi}</span>
        <span className="rounded bg-white/10 px-2 py-1 text-white">Vol {signal.volumeRatio.toFixed(1)}x</span>
      </div>
      <p className="mt-3 text-sm text-white/75">{signal.reason}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <ChangeBadge label="1D" value={signal.change1d} />
        <ChangeBadge label="5D" value={signal.change5d} />
        <ChangeBadge label="1M" value={signal.change1m} />
      </div>
    </article>
  );
}

type SortKey = "score" | "change1d" | "change5d" | "change1m" | "volumeRatio" | "relativeStrength" | "rsi";

function StockScreener({ snapshot }: { snapshot: MarketSnapshot }) {
  const [market, setMarket] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [theme, setTheme] = React.useState("ALL");
  const [sortKey, setSortKey] = React.useState<SortKey>("score");
  const signals = snapshot.stockSignals ?? [];
  const themes = ["ALL", ...Array.from(new Set(signals.map((signal) => signal.theme)))];
  const filtered = signals
    .filter((signal) => market === "ALL" || signal.market === market)
    .filter((signal) => theme === "ALL" || signal.theme === theme)
    .filter((signal) => `${signal.name} ${signal.ticker}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Stock Screener" title="조건 검색" icon={<SlidersHorizontal className="h-5 w-5" />} />
      <section className="panel rounded-lg p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticker" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted" />
          </div>
          <Select value={market} onChange={setMarket} options={["ALL", "KOSPI", "KOSDAQ", "NASDAQ", "S&P500"]} />
          <Select value={theme} onChange={setTheme} options={themes} />
          <Select value={sortKey} onChange={(value) => setSortKey(value as SortKey)} options={["score", "change1d", "change5d", "change1m", "volumeRatio", "relativeStrength", "rsi"]} />
        </div>
      </section>
      <section className="panel overflow-hidden rounded-lg">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">Theme</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">1D</th>
                <th className="px-4 py-3 font-medium">Vol</th>
                <th className="px-4 py-3 font-medium">RS</th>
                <th className="px-4 py-3 font-medium">Flow</th>
                <th className="px-4 py-3 font-medium">Signal</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((signal) => (
                <tr key={`${signal.ticker}-${signal.signalType}`} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{signal.name}</td>
                  <td className="px-4 py-3 font-mono text-muted">{signal.ticker}</td>
                  <td className="px-4 py-3 text-muted">{signal.theme}</td>
                  <td className="px-4 py-3 font-mono text-white">{formatNumber(signal.price, "")}</td>
                  <td className={`px-4 py-3 font-mono ${signal.change1d >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(signal.change1d)}</td>
                  <td className="px-4 py-3 font-mono text-white">{signal.volumeRatio.toFixed(1)}x</td>
                  <td className="px-4 py-3 font-mono text-white">{signal.relativeStrength}</td>
                  <td className="px-4 py-3 text-muted">{signal.fundFlow}</td>
                  <td className="px-4 py-3"><span className="rounded bg-white/10 px-2 py-1 text-xs text-white">{signal.signalType}</span></td>
                  <td className="px-4 py-3"><span className="rounded bg-accent/10 px-2 py-1 text-xs text-accent">{signal.actionTag}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function AlertsView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Alerts" title="고급 알림 관리" icon={<AlertTriangle className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="space-y-3">
          {snapshot.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </section>
        <section className="panel rounded-lg p-5">
          <h3 className="font-semibold text-ink">User Alert Rule Structure</h3>
          <div className="mt-4 space-y-3 text-sm text-muted">
            {[
              ["Rule", "indicator + operator + threshold + duration"],
              ["Trigger", "VIX changePercent >= 15 for 1 close"],
              ["Release", "VIX changePercent < 5 for 2 checks"],
              ["Assets", "KOSPI, KOSDAQ, Growth, Semiconductor, FX-sensitive"],
              ["Delivery", "In-app first, webhook later"]
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[90px_1fr] rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-white/70">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-semibold text-ink">이벤트 캘린더</h3>
          <CalendarDays className="h-5 w-5 text-accent" />
        </div>
        <div className="divide-y divide-white/10">
          {snapshot.calendar.map((event) => (
            <div key={event.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
              <div>
                <div className="font-semibold text-ink">{event.title}</div>
                <div className="mt-1 text-sm text-muted">{regionLabel(event.region)} · {event.source}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white">{formatDateTime(event.startsAt)}</div>
                <span className={`mt-2 inline-block rounded px-2 py-1 text-xs ${event.importance === "high" ? "bg-negative/10 text-negative" : event.importance === "medium" ? "bg-caution/10 text-caution" : "bg-white/5 text-muted"}`}>
                  {event.importance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BacktestLab({ snapshot }: { snapshot: MarketSnapshot }) {
  const rows: BacktestMetric[] = snapshot.backtestMetrics ?? [];
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Backtest Lab" title="신호별 성과 저장 구조" icon={<FlaskConical className="h-5 w-5" />} />
      <section className="panel rounded-lg p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BacktestStat label="20D Return" value="planned" />
          <BacktestStat label="60D Return" value="planned" />
          <BacktestStat label="Risk Metrics" value="hit ratio · avg return · MDD" />
        </div>
      </section>
      <section className="panel overflow-hidden rounded-lg">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Signal Type</th>
                <th className="px-4 py-3 font-medium">Sample</th>
                <th className="px-4 py-3 font-medium">20D</th>
                <th className="px-4 py-3 font-medium">60D</th>
                <th className="px-4 py-3 font-medium">Hit Ratio</th>
                <th className="px-4 py-3 font-medium">Avg Return</th>
                <th className="px-4 py-3 font-medium">MDD</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.signalType} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{row.signalType}</td>
                  <td className="px-4 py-3 font-mono text-muted">{row.sampleSize}</td>
                  <td className="px-4 py-3 text-muted">{row.return20d ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{row.return60d ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{row.hitRatio ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{row.averageReturn ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{row.maxDrawdown ?? "-"}</td>
                  <td className="px-4 py-3"><span className="rounded bg-accent/10 px-2 py-1 text-xs text-accent">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BacktestStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 font-semibold text-white">{value}</div>
    </div>
  );
}

function DataQualityView({ snapshot }: { snapshot: MarketSnapshot }) {
  const sourceLogs = defaultSourceLogs(snapshot);
  const staleCount = snapshot.indicators.filter((indicator) => indicatorStatus(indicator) === "Stale").length;
  const errorCount = snapshot.indicators.filter((indicator) => indicatorStatus(indicator) === "Error").length;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Data Source & Quality" title="소스·상태·fetch 로그" icon={<Database className="h-5 w-5" />} />
      <MarketStateStrip snapshot={snapshot} />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <QualitySummary label="Reliability" value={reliabilityScore(snapshot)} tone="positive" icon={<CheckCircle2 className="h-5 w-5" />} />
        <QualitySummary label="Fresh" value={snapshot.indicators.filter((item) => indicatorStatus(item) === "Fresh").length} tone="positive" icon={<Activity className="h-5 w-5" />} />
        <QualitySummary label="Stale" value={staleCount} tone="caution" icon={<AlertTriangle className="h-5 w-5" />} />
        <QualitySummary label="Error" value={errorCount} tone="negative" icon={<ShieldAlert className="h-5 w-5" />} />
      </section>
      <FreshnessPanel snapshot={snapshot} limit={snapshot.indicators.length} />
      <section className="panel overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="font-semibold text-ink">Source Fetch Logs</h3>
          <RadioTower className="h-5 w-5 text-accent" />
        </div>
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last attempt</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Indicators</th>
              </tr>
            </thead>
            <tbody>
              {sourceLogs.map((log) => (
                <tr key={log.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{log.source}</td>
                  <td className="px-4 py-3"><StatusPill status={log.status} /></td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(log.lastAttemptAt)}</td>
                  <td className="px-4 py-3 font-mono text-muted">{log.latencyMs ? `${log.latencyMs}ms` : "-"}</td>
                  <td className="px-4 py-3 text-muted">{log.message}</td>
                  <td className="px-4 py-3 text-muted">{log.affectedIndicatorIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function QualitySummary({ label, value, tone, icon }: { label: string; value: number; tone: IndicatorTone; icon: React.ReactNode }) {
  const classes = toneClasses[tone];
  return (
    <div className={`panel rounded-lg p-5 ${classes.border}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${classes.bg} ${classes.text}`}>{icon}</div>
      <div className="mt-4 font-mono text-4xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

function TechnicalStrip() {
  const rows = [
    ["MA Stack", "20/60/120D trend filter"],
    ["RSI 14", "30 oversold · 70 overheated"],
    ["MACD", "Signal cross and histogram slope"],
    ["Volume", "20D average volume multiple"],
    ["Relative Strength", "Index-relative 20D return"],
    ["Supply/Demand", "Foreign and institution flow"]
  ];
  return (
    <section className="panel rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Technical Indicator Stack</h3>
        <LineChart className="h-5 w-5 text-accent" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-sm font-medium text-white">{value}</div>
          </div>
        ))}
      </div>
    </section>
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
    if (active === "Market Pulse") return <MarketPulse snapshot={snapshot} />;
    if (active === "Korea Dashboard") {
      return (
        <div className="space-y-6">
          <DashboardGrid
            region="korea"
            title="Korea Dashboard"
            eyebrow="Korea market"
            icon={<TrendingUp className="h-5 w-5" />}
            snapshot={snapshot}
            ids={["kospi", "kosdaq", "kospi200", "kosdaq150", "krx300", "k200-fut", "mini-k200-fut", "kq150-fut", "short-sale-value", "margin-loan", "customer-deposits", "usd-krw", "dxy"]}
          />
          <TechnicalStrip />
        </div>
      );
    }
    if (active === "US Dashboard") {
      return (
        <div className="space-y-6">
          <DashboardGrid
            region="us"
            title="US Dashboard"
            eyebrow="US market"
            icon={<Globe2 className="h-5 w-5" />}
            snapshot={snapshot}
            ids={["spx", "nasdaq-composite", "ndx", "dow", "russell2000", "sox", "spx-equal-weight", "es-fut", "nq-fut", "ym-fut", "rty-fut", "vix", "vxn", "vvix", "move", "put-call", "finra-margin"]}
          />
          <TechnicalStrip />
        </div>
      );
    }
    if (active === "Macro & Liquidity") return <MacroLiquidity snapshot={snapshot} />;
    if (active === "Theme Monitor") return <ThemeMonitor snapshot={snapshot} />;
    if (active === "Trading Signals") return <TradingSignals snapshot={snapshot} />;
    if (active === "Stock Screener") return <StockScreener snapshot={snapshot} />;
    if (active === "Alerts") return <AlertsView snapshot={snapshot} />;
    if (active === "Backtest Lab") return <BacktestLab snapshot={snapshot} />;
    return <DataQualityView snapshot={snapshot} />;
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Market Regime Monitor</h1>
              <p className="mt-1 text-sm text-muted">Korea · US trading dashboard · KST {formatDateTime(snapshot.generatedAt)}</p>
            </div>
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
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Regime Bands</div>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ["80~100", "강한 위험선호", "text-positive"],
                ["60~79", "완만한 상승", "text-positive"],
                ["40~59", "중립/혼조", "text-muted"],
                ["20~39", "위험관리", "text-caution"],
                ["0~19", "강한 위험회피", "text-negative"]
              ].map(([range, label, color]) => (
                <div key={range} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-white/70">{range}</span>
                  <span className={color}>{label}</span>
                </div>
              ))}
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
