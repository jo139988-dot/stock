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
  CircleDollarSign,
  Database,
  Gauge,
  Globe2,
  Landmark,
  LineChart,
  Menu,
  RadioTower,
  ShieldAlert,
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
  DataAccess,
  Indicator,
  IndicatorTone,
  MarketAlert,
  MarketSnapshot,
  MarketScore,
  Region,
  ThemeMomentum
} from "@/lib/market-types";
import { scoreLabel, scoreTone } from "@/lib/score";

const navItems = [
  "Market Pulse",
  "Korea Dashboard",
  "US Dashboard",
  "Macro & Liquidity",
  "Theme Monitor",
  "Alerts",
  "Data Source & Quality"
] as const;

type NavItem = (typeof navItems)[number];

const toneClasses: Record<IndicatorTone, { text: string; bg: string; border: string; chart: string }> = {
  positive: {
    text: "text-positive",
    bg: "bg-positive/10",
    border: "border-positive/35",
    chart: "#21c17a"
  },
  negative: {
    text: "text-negative",
    bg: "bg-negative/10",
    border: "border-negative/35",
    chart: "#ff5c72"
  },
  neutral: {
    text: "text-muted",
    bg: "bg-white/5",
    border: "border-white/10",
    chart: "#8f9baa"
  },
  caution: {
    text: "text-caution",
    bg: "bg-caution/10",
    border: "border-caution/35",
    chart: "#f5b84b"
  }
};

const severityClass: Record<AlertSeverity, string> = {
  info: "border-accent/40 bg-accent/10 text-accent",
  warning: "border-caution/40 bg-caution/10 text-caution",
  critical: "border-negative/45 bg-negative/10 text-negative"
};

function formatNumber(value: number, unit: string) {
  const fraction = Math.abs(value) < 10 && unit !== "bp" ? 2 : Math.abs(value) < 100 ? 1 : 0;
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction
  }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(date);
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
    free: "무료",
    paid: "유료",
    manual: "수동"
  };
  return labels[access];
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

function MetricCard({ indicator, compact = false }: { indicator: Indicator; compact?: boolean }) {
  const tone = toneClasses[indicator.tone];
  const isPositive = indicator.changePercent >= 0;

  return (
    <article className={`panel flex min-h-[172px] flex-col justify-between rounded-lg p-4 ${compact ? "min-h-[148px]" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{indicator.name}</h3>
            {indicator.quality.stale ? (
              <span className="rounded border border-caution/35 bg-caution/10 px-1.5 py-0.5 text-[10px] font-semibold text-caution">STALE</span>
            ) : (
              <span className="rounded border border-positive/25 bg-positive/10 px-1.5 py-0.5 text-[10px] font-semibold text-positive">LIVE</span>
            )}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">{regionLabel(indicator.region)} · {indicator.group}</p>
        </div>
        <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone.border} ${tone.bg} ${tone.text}`}>
          {isPositive ? "+" : ""}
          {indicator.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_92px] items-end gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold text-white">{formatNumber(indicator.value, indicator.unit)}</div>
          <div className="mt-1 text-xs text-muted">전일 {formatNumber(indicator.previousClose, indicator.unit)}</div>
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={indicator.sparkline}>
              <Area type="monotone" dataKey="value" stroke={tone.chart} fill={tone.chart} fillOpacity={0.16} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[11px] text-muted">
        <div>
          <span className="block text-white/70">기준일</span>
          {indicator.quality.baseDate}
        </div>
        <div>
          <span className="block text-white/70">업데이트</span>
          {formatDateTime(indicator.quality.lastUpdated)}
        </div>
        <div>
          <span className="block text-white/70">출처</span>
          {indicator.quality.source}
        </div>
      </div>
    </article>
  );
}

function ScoreGauge({ score }: { score: MarketScore }) {
  const tone = toneClasses[scoreTone(score.value)];
  const chartData = Object.entries(score.breakdown).map(([key, value]) => ({
    key,
    value
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
      <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-muted">
        <span>추세 25</span>
        <span>내부강도 20</span>
        <span>유동성 20</span>
        <span>금리·신용 15</span>
        <span>수급 10</span>
        <span>심리·변동성 10</span>
      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: MarketAlert }) {
  return (
    <article className={`rounded-lg border p-4 ${severityClass[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{alert.title}</h3>
            <span className="rounded bg-black/20 px-2 py-0.5 text-[10px] uppercase text-white/70">{regionLabel(alert.region)}</span>
          </div>
          <p className="mt-2 text-sm leading-5 text-white/75">{alert.detail}</p>
          <p className="mt-3 text-xs text-muted">{alert.rule} · {formatDateTime(alert.triggeredAt)}</p>
        </div>
      </div>
    </article>
  );
}

function ThemeRow({ theme }: { theme: ThemeMomentum }) {
  const tone = toneClasses[theme.tone];
  return (
    <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr_1.7fr] items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 max-lg:grid-cols-2">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded border font-mono text-sm font-semibold ${tone.border} ${tone.bg} ${tone.text}`}>
          {theme.score}
        </span>
        <div>
          <div className="font-semibold text-ink">{theme.name}</div>
          <div className="text-xs text-muted">{theme.region === "korea" ? "한국" : "미국"} · {theme.quality.source}</div>
        </div>
      </div>
      <div className={theme.oneDay >= 0 ? "text-positive" : "text-negative"}>{theme.oneDay >= 0 ? "+" : ""}{theme.oneDay.toFixed(1)}%</div>
      <div className={theme.fiveDay >= 0 ? "text-positive" : "text-negative"}>{theme.fiveDay >= 0 ? "+" : ""}{theme.fiveDay.toFixed(1)}%</div>
      <div className="font-mono text-sm text-ink">{theme.volumeRatio.toFixed(1)}x</div>
      <div className="truncate text-sm text-muted">{theme.leaders.join(", ")}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  icon
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
}) {
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

function MarketPulse({ snapshot }: { snapshot: MarketSnapshot }) {
  const topThemes = [...snapshot.themes].sort((a, b) => b.score - a.score).slice(0, 6);
  const pulseIndicators = byIds(snapshot, ["kospi", "spx", "vix", "usd-krw", "hy-oas", "net-liquidity"]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {snapshot.scores.slice(0, 6).map((score) => (
          <ScoreGauge key={score.id} score={score} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Leadership" title="오늘의 주도 테마" icon={<Zap className="h-5 w-5" />} />
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr_1.7fr] gap-3 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.12em] text-muted max-lg:grid-cols-2">
              <span>Theme</span>
              <span>1D</span>
              <span>5D</span>
              <span>Volume</span>
              <span>Leaders</span>
            </div>
            {topThemes.map((theme) => (
              <ThemeRow key={`${theme.region}-${theme.name}`} theme={theme} />
            ))}
          </div>
        </div>

        <div className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Warnings" title="주요 경고 알림" icon={<Bell className="h-5 w-5" />} />
          <div className="space-y-3">
            {snapshot.alerts.slice(0, 4).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Cross Asset Tape" title="핵심 지표 빠른 확인" icon={<Activity className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pulseIndicators.map((indicator) => (
            <MetricCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardGrid({
  region,
  title,
  eyebrow,
  ids,
  icon,
  snapshot
}: {
  region: Region;
  title: string;
  eyebrow: string;
  ids: string[];
  icon: React.ReactNode;
  snapshot: MarketSnapshot;
}) {
  const selected = byIds(snapshot, ids);
  const score = snapshot.scores.find((item) => item.region === region);
  const breadth = byRegion(snapshot, region).filter((item) => item.group === "breadth").slice(0, 6);
  const flow = byRegion(snapshot, region).filter((item) => item.group === "flow").slice(0, 6);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} icon={icon} />
      {score ? <ScoreGauge score={score} /> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selected.map((indicator) => (
          <MetricCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <IndicatorTable title="시장 내부강도" indicators={breadth} />
        <IndicatorTable title="수급·포지션" indicators={flow} />
      </div>
    </div>
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
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">지표</th>
              <th className="px-4 py-3 font-medium">값</th>
              <th className="px-4 py-3 font-medium">전일 대비</th>
              <th className="px-4 py-3 font-medium">기준일</th>
              <th className="px-4 py-3 font-medium">출처</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator) => {
              const tone = toneClasses[indicator.tone];
              return (
                <tr key={indicator.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{indicator.name}</td>
                  <td className="px-4 py-3 font-mono text-white">{formatNumber(indicator.value, indicator.unit)}</td>
                  <td className={`px-4 py-3 font-mono ${tone.text}`}>
                    {indicator.changePercent >= 0 ? "+" : ""}
                    {indicator.changePercent.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.baseDate}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.source}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded border px-2 py-1 text-xs ${indicator.quality.stale ? "border-caution/35 bg-caution/10 text-caution" : "border-positive/25 bg-positive/10 text-positive"}`}>
                      {indicator.quality.stale ? "stale" : "fresh"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MacroLiquidity({ snapshot }: { snapshot: MarketSnapshot }) {
  const rates = byGroup(snapshot, "rates");
  const liquidity = byGroup(snapshot, "liquidity");
  const credit = byGroup(snapshot, "credit");
  const inflation = byGroup(snapshot, "inflation");
  const macro = byGroup(snapshot, "macro");
  const netLiquidity = snapshot.indicators.find((item) => item.id === "net-liquidity");

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Macro & Liquidity" title="금리·유동성·인플레이션 통합 화면" icon={<Landmark className="h-5 w-5" />} />
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
        <IndicatorTable title="금리·환율" indicators={rates} />
        <IndicatorTable title="유동성·신용" indicators={[...liquidity, ...credit]} />
        <IndicatorTable title="인플레이션" indicators={inflation} />
        <IndicatorTable title="매크로 이벤트 지표" indicators={macro} />
      </div>
    </div>
  );
}

function ThemeMonitor({ snapshot }: { snapshot: MarketSnapshot }) {
  const koreaThemes = snapshot.themes.filter((theme) => theme.region === "korea");
  const usThemes = snapshot.themes.filter((theme) => theme.region === "us");

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Theme Monitor" title="테마 모멘텀" icon={<BarChart3 className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ThemePanel title="한국 주요 테마" themes={koreaThemes} />
        <ThemePanel title="미국 주요 테마" themes={usThemes} />
      </div>
    </div>
  );
}

function ThemePanel({ title, themes }: { title: string; themes: ThemeMomentum[] }) {
  const chartData = themes.map((theme) => ({ name: theme.name, score: theme.score, volume: theme.volumeRatio }));
  return (
    <section className="panel rounded-lg p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">Score / Volume</span>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis type="number" stroke="#8f9baa" tickLine={false} axisLine={false} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" stroke="#8f9baa" tickLine={false} axisLine={false} width={82} />
            <Tooltip contentStyle={{ background: "#101419", border: "1px solid #26313d", color: "#e7edf4" }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.score >= 70 ? "#21c17a" : entry.score >= 45 ? "#8f9baa" : "#ff5c72"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
        {[...themes].sort((a, b) => b.score - a.score).map((theme) => (
          <ThemeRow key={theme.name} theme={theme} />
        ))}
      </div>
    </section>
  );
}

function AlertsView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Alerts" title="알림 조건 및 이벤트 캘린더" icon={<AlertTriangle className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-3">
          {snapshot.alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </section>
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
      <section className="panel rounded-lg p-5">
        <h3 className="font-semibold text-ink">감시 중인 조건</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            "주요 지수가 20일선 또는 60일선 이탈",
            "VIX가 전일 대비 15% 이상 상승",
            "미국 10년물 금리가 20일 신고가 돌파",
            "USD/KRW가 20일 신고가 돌파",
            "HY Spread가 5일 연속 확대",
            "외국인 코스피 현물 3일 연속 순매도",
            "상승종목 비율이 40% 이하인데 지수만 상승",
            "52주 신저가 수가 신고가 수를 초과",
            "SOX 52주 신고가",
            "코스피 또는 Nasdaq 거래대금 급증"
          ].map((rule) => (
            <div key={rule} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {rule}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DataQualityView({ snapshot }: { snapshot: MarketSnapshot }) {
  const staleCount = snapshot.indicators.filter((indicator) => indicator.quality.stale).length;
  const paidCount = snapshot.indicators.filter((indicator) => indicator.quality.access === "paid").length;
  const freeCount = snapshot.indicators.filter((indicator) => indicator.quality.access === "free").length;
  const rows = snapshot.indicators;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Data Quality" title="데이터 출처·최신성·유료 여부" icon={<Database className="h-5 w-5" />} />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QualitySummary icon={<CheckCircle2 className="h-5 w-5" />} label="무료 데이터" value={freeCount} tone="positive" />
        <QualitySummary icon={<CircleDollarSign className="h-5 w-5" />} label="유료 필요" value={paidCount} tone="caution" />
        <QualitySummary icon={<AlertTriangle className="h-5 w-5" />} label="Stale" value={staleCount} tone="negative" />
      </section>
      <section className="panel overflow-hidden rounded-lg">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">지표</th>
                <th className="px-4 py-3 font-medium">지역</th>
                <th className="px-4 py-3 font-medium">출처</th>
                <th className="px-4 py-3 font-medium">주기</th>
                <th className="px-4 py-3 font-medium">기준일</th>
                <th className="px-4 py-3 font-medium">업데이트</th>
                <th className="px-4 py-3 font-medium">무료/유료</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((indicator) => (
                <tr key={indicator.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-ink">{indicator.name}</td>
                  <td className="px-4 py-3 text-muted">{regionLabel(indicator.region)}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.source}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.frequency}</td>
                  <td className="px-4 py-3 text-muted">{indicator.quality.baseDate}</td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(indicator.quality.lastUpdated)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${indicator.quality.access === "paid" ? "bg-caution/10 text-caution" : "bg-positive/10 text-positive"}`}>
                      {accessLabel(indicator.quality.access)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${indicator.quality.stale ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive"}`}>
                      {indicator.quality.stale ? "마지막 정상 데이터" : "정상"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function QualitySummary({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: IndicatorTone;
}) {
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
    { label: "MA 5/20/60/120/200", value: "상방 3 · 하방 2", tone: "neutral" as IndicatorTone },
    { label: "RSI 14", value: "58.4", tone: "positive" as IndicatorTone },
    { label: "MACD", value: "상승 전환", tone: "positive" as IndicatorTone },
    { label: "Bollinger Band", value: "중심선 상회", tone: "positive" as IndicatorTone },
    { label: "ATR", value: "변동성 확대", tone: "caution" as IndicatorTone },
    { label: "이격도", value: "+3.2%", tone: "caution" as IndicatorTone },
    { label: "52주 신고가/신저가", value: "142 / 86", tone: "positive" as IndicatorTone },
    { label: "거래대금 20일 평균 대비", value: "1.42x", tone: "positive" as IndicatorTone }
  ];

  return (
    <section className="panel rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink">기술적 지표 요약</h3>
        <LineChart className="h-5 w-5 text-accent" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => {
          const tone = toneClasses[row.tone];
          return (
            <div key={row.label} className={`rounded-lg border p-3 ${tone.border} ${tone.bg}`}>
              <div className="text-xs text-muted">{row.label}</div>
              <div className={`mt-1 font-semibold ${tone.text}`}>{row.value}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MarketDashboard() {
  const [active, setActive] = React.useState<NavItem>("Market Pulse");
  const [snapshot, setSnapshot] = React.useState<MarketSnapshot>(marketSnapshot);
  const [dataStatus, setDataStatus] = React.useState<"loading" | "live" | "fallback">("loading");

  React.useEffect(() => {
    let mounted = true;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/snapshot", { cache: "no-store" });
        if (!response.ok) throw new Error(`snapshot ${response.status}`);
        const nextSnapshot = (await response.json()) as MarketSnapshot;
        if (!mounted) return;
        setSnapshot(nextSnapshot);
        const hasLive = nextSnapshot.indicators.some((indicator) => !indicator.quality.stale);
        setDataStatus(hasLive ? "live" : "fallback");
      } catch {
        if (!mounted) return;
        setDataStatus("fallback");
      }
    }

    loadSnapshot();
    const interval = window.setInterval(loadSnapshot, 5 * 60 * 1000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const renderContent = () => {
    if (active === "Market Pulse") return <MarketPulse snapshot={snapshot} />;
    if (active === "Korea Dashboard") {
      return (
        <div className="space-y-6">
          <DashboardGrid
            region="korea"
            title="한국 시장 대시보드"
            eyebrow="Korea Dashboard"
            icon={<TrendingUp className="h-5 w-5" />}
            snapshot={snapshot}
            ids={[
              "kospi",
              "kosdaq",
              "kospi200",
              "kosdaq150",
              "krx300",
              "k200-fut",
              "mini-k200-fut",
              "kq150-fut",
              "k200-night",
              "kq150-night",
              "short-sale-value",
              "margin-loan",
              "customer-deposits",
              "usd-krw",
              "dxy"
            ]}
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
            title="미국 시장 대시보드"
            eyebrow="US Dashboard"
            icon={<Globe2 className="h-5 w-5" />}
            snapshot={snapshot}
            ids={[
              "spx",
              "nasdaq-composite",
              "ndx",
              "dow",
              "russell2000",
              "sox",
              "spx-equal-weight",
              "es-fut",
              "nq-fut",
              "ym-fut",
              "rty-fut",
              "vix",
              "vxn",
              "vvix",
              "move",
              "put-call",
              "finra-margin"
            ]}
          />
          <TechnicalStrip />
        </div>
      );
    }
    if (active === "Macro & Liquidity") return <MacroLiquidity snapshot={snapshot} />;
    if (active === "Theme Monitor") return <ThemeMonitor snapshot={snapshot} />;
    if (active === "Alerts") return <AlertsView snapshot={snapshot} />;
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
              <p className="mt-1 text-sm text-muted">
                한국·미국 위험선호/위험회피 통합 대시보드 · KST {formatDateTime(snapshot.generatedAt)} · NY timezone 지원
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="block text-white/70">Korea TZ</span>
            Asia/Seoul
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="block text-white/70">US TZ</span>
            America/New_York
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="block text-white/70">DB Ready</span>
            SQLite → TimescaleDB
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="block text-white/70">Scheduler</span>
            Worker live fetch
          </div>
          <div className={`rounded-lg border px-3 py-2 ${dataStatus === "live" ? "border-positive/30 bg-positive/10 text-positive" : dataStatus === "loading" ? "border-accent/30 bg-accent/10 text-accent" : "border-caution/30 bg-caution/10 text-caution"}`}>
            <span className="block text-white/70">Data</span>
            {dataStatus === "live" ? "Live API" : dataStatus === "loading" ? "Loading" : "Fallback"}
          </div>
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
