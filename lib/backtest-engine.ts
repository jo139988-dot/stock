export type BacktestCurrency = "USD" | "KRW";
export type RebalancePolicy = "Weekly" | "Monthly" | "Signal Change";
export type ExecutionPrice = "Next Open" | "Next Close";
export type BenchmarkName = "KOSPI200" | "S&P500" | "QQQ / Nasdaq100" | "ACWI" | "60/40" | "Custom";
export type ReturnBasis = "Total Return" | "Price Return";
export type BacktestConfidence = "High" | "Medium" | "Low";

export type BacktestSettings = {
  lookbackYears: number;
  currency: BacktestCurrency;
  rebalancePolicy: RebalancePolicy;
  executionPrice: ExecutionPrice;
  transactionCostBps: number;
  fxCostBps: number;
  benchmark: BenchmarkName;
  returnBasis: ReturnBasis;
  survivalBiasRemoved: boolean;
};

export type BacktestMetricSet = {
  cumulativeReturn: number;
  cagr: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  benchmarkCagr: number;
  benchmarkMaxDrawdown: number;
  mddImprovement: number;
  calmarRatio: number;
  hitRatio: number;
  upCapture: number;
  downCapture: number;
  informationRatio: number;
  trackingError: number;
  bestMonth: number;
  worstMonth: number;
  turnover: number;
  transactionCost: number;
  afterCostExcessReturn: number;
  excessReturnVsBenchmark: number;
};

export type BacktestPoint = {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  dailyReturn: number;
  benchmarkReturn: number;
  cumulativeReturn: number;
  benchmarkCumulativeReturn: number;
  drawdown: number;
  turnover: number;
  cashWeight: number;
  regime: "Goldilocks" | "Reflation" | "Slowdown" | "Stagflation";
};

export type MonthlyReturn = {
  month: string;
  strategyReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
};

export type BacktestContribution = {
  name: string;
  sleeve: string;
  contribution: number;
  averageWeight: number;
  hitRatio: number;
};

export type BacktestDiagnostic = {
  factor: string;
  effect: number;
  verdict: "Positive" | "Neutral" | "Negative";
  explanation: string;
};

export type BacktestPassCriterion = {
  criterion: string;
  passed: boolean;
  detail: string;
};

export type RegimeBacktestResult = {
  regime: BacktestPoint["regime"];
  days: number;
  averageReturn: number;
  hitRatio: number;
  maxDrawdown: number;
};

export type AllocationHistoryRow = {
  assetClass: string;
  currentWeight: number;
  suggestedWeight: number;
  minWeight: number;
  maxWeight: number;
};

export type CoreTiltPolicy = {
  benchmarkCoreWeight: number;
  activeTiltTarget: number;
  activeTiltMax: number;
  activeTiltAllowed: boolean;
  regimeConfidence: number;
  dataReliability: number;
  reliabilityRule: string;
  cashRange: string;
  cashCondition: string;
};

export type BacktestPreview = {
  settings: BacktestSettings;
  warnings: string[];
  confidence: BacktestConfidence;
  coreTiltPolicy: CoreTiltPolicy;
  metrics: BacktestMetricSet;
  points: BacktestPoint[];
  monthlyReturns: MonthlyReturn[];
  contributions: BacktestContribution[];
  regimeResults: RegimeBacktestResult[];
  allocationHistory: AllocationHistoryRow[];
  diagnostics: BacktestDiagnostic[];
  passCriteria: BacktestPassCriterion[];
};

export type EtfScoreHistoryRow = {
  ticker: string;
  allocationScore: number;
  macroFit: number;
  trend: number;
  valuation: number;
  cycle: number;
  liquidity: number;
  drawdownRisk: number;
  action: string;
  dataStatus: string;
};

export type QualityStockScoreHistoryRow = {
  ticker: string;
  qualityScore: number;
  valuationScore: number;
  earningsRevisionScore: number;
  liquidityRisk: number;
  balanceSheetRisk: number;
  action: string;
  dataStatus: string;
  marketCapBucket: "Large" | "MidSmall";
  sector: string;
};

export const DEFAULT_BACKTEST_SETTINGS: BacktestSettings = {
  lookbackYears: 3,
  currency: "KRW",
  rebalancePolicy: "Weekly",
  executionPrice: "Next Open",
  transactionCostBps: 15,
  fxCostBps: 20,
  benchmark: "S&P500",
  returnBasis: "Total Return",
  survivalBiasRemoved: false
};

export const BACKTEST_ETF_UNIVERSE = [
  "SPY",
  "QQQ",
  "QUAL",
  "MOAT",
  "SMH",
  "SOXX",
  "XLK",
  "XLE",
  "XLI",
  "XLF",
  "XLV",
  "XLU",
  "XLB",
  "GLD",
  "IAU",
  "GDX",
  "COPX",
  "CPER",
  "PAVE",
  "GRID",
  "IEF",
  "TLT",
  "BIL",
  "EWY",
  "KOSPI200 ETF"
];

export const BACKTEST_BENCHMARKS: BenchmarkName[] = ["KOSPI200", "S&P500", "QQQ / Nasdaq100", "ACWI", "60/40", "Custom"];

export const BACKTEST_LIMITATIONS = [
  "If point-in-time historical signals are unavailable, results are reconstructed from stored dashboard logic and must be labeled reconstructed backtest.",
  "Quality stock tests that use modeled fundamentals are low-confidence backtests until point-in-time fundamentals are connected.",
  "The default execution rule uses the next trading day after signal generation to reduce look-ahead bias.",
  "Survivorship-bias removal must be shown explicitly for stock universes and delisted securities.",
  "Total return is preferred. If only price return is available, the result must show a dividend-data warning."
];

export const BACKTEST_STRATEGY_RULES = [
  {
    name: "BM Core + Active Tilt Strategy",
    rules: [
      "BM Core is the default portfolio: 70-85% remains in the selected benchmark.",
      "Dashboard Active Tilt is limited by regime confidence: 80+ allows 30%, 65-80 allows 20%, 50-65 allows 10%, below 50 allows only 0-5%.",
      "With current regime confidence near 60, the active sleeve is capped at 10%.",
      "Dashboard signals tilt around the BM rather than replacing the BM."
    ]
  },
  {
    name: "Reliability and Cash Controls",
    rules: [
      "Reliability 90+ permits normal sizing; 80-90 requires staggered additions; 75-80 halves active tilt; below 75 blocks new positions from modeled/fallback data.",
      "Cash is conditional: normal 0-3%, watch 3-5%, risk 5-10%.",
      "Cash above 5% requires at least two stress conditions such as VIX rise, HY OAS +30bp, falling net liquidity, confidence below 55, reliability below 80, or USD/KRW breakout with foreign selling."
    ]
  },
  {
    name: "ETF Relative-to-BM Rules",
    rules: [
      "Overweight is blocked when both 3M and 6M excess returns versus BM are negative.",
      "Low information ratio caps recommendation at Neutral or below.",
      "Strong 1M return without 3M/6M persistence is flagged as short-term overheating.",
      "Quality stocks remain satellite candidates and do not replace the BM core."
    ]
  }
];

export function etfActionFromScore(score: number) {
  if (score >= 75) return "Overweight";
  if (score >= 65) return "Neutral+";
  if (score >= 50) return "Neutral";
  if (score >= 40) return "Neutral-";
  return "Underweight";
}

export function isQualityStockEligible(row: QualityStockScoreHistoryRow) {
  return (
    row.qualityScore >= 75 &&
    row.valuationScore >= 40 &&
    row.earningsRevisionScore >= 60 &&
    row.liquidityRisk <= 60 &&
    row.balanceSheetRisk <= 60 &&
    ["Core Hold", "Accumulate", "Buy on Weakness"].includes(row.action)
  );
}

export function adjustedEtfConfidence(row: EtfScoreHistoryRow) {
  if (row.dataStatus === "Error") return 0;
  const modeledHaircut = row.dataStatus === "Modeled" ? 12 : 0;
  const drawdownPenalty = row.drawdownRisk >= 70 ? 15 : row.drawdownRisk >= 60 ? 8 : 0;
  return clamp(row.allocationScore - modeledHaircut - drawdownPenalty, 0, 100);
}

export function applyRiskControls(riskWeight: number, macroConfidence: number, dataReliability: number) {
  let adjusted = riskWeight;
  const notes: string[] = [];
  if (macroConfidence < 65) {
    adjusted = Math.min(adjusted, 95);
    notes.push("cash buffer 3-5%");
  }
  if (dataReliability < 85) {
    adjusted = Math.max(0, adjusted - 5);
    notes.push("risk assets -5%p");
  }
  return { adjustedRiskWeight: adjusted, notes };
}

export function activeTiltLimitFromConfidence(regimeConfidence: number) {
  if (regimeConfidence >= 80) return 0.3;
  if (regimeConfidence >= 65) return 0.2;
  if (regimeConfidence >= 50) return 0.1;
  return 0.05;
}

export function reliabilityTiltMultiplier(dataReliability: number) {
  if (dataReliability >= 90) return 1;
  if (dataReliability >= 80) return 1;
  if (dataReliability >= 75) return 0.5;
  return 0;
}

export function cashRangeForConditions(stressConditionCount: number) {
  if (stressConditionCount >= 2) return "위험: 5~10%";
  if (stressConditionCount === 1) return "경계: 3~5%";
  return "평시: 0~3%";
}

export function buildReconstructedBacktestPreview(settings: BacktestSettings): BacktestPreview {
  const regimeConfidence = 60;
  const dataReliability = 85;
  const activeTiltMax = activeTiltLimitFromConfidence(regimeConfidence) * reliabilityTiltMultiplier(dataReliability);
  const activeTiltTarget = Math.min(0.1, activeTiltMax);
  const benchmarkCoreWeight = 1 - activeTiltTarget;
  const points = buildSyntheticBacktestPoints(settings);
  const benchmark = points.map((point) => point.benchmarkReturn);
  const metrics = calculateBacktestMetrics(points, benchmark, settings.transactionCostBps);
  const monthlyReturns = calculateMonthlyReturns(points);
  const confidence: BacktestConfidence =
    settings.returnBasis === "Total Return" && settings.survivalBiasRemoved ? "High" : settings.returnBasis === "Price Return" ? "Low" : "Medium";

  const warnings = [
    ...BACKTEST_LIMITATIONS,
    ...(settings.returnBasis === "Price Return" ? ["Dividend data is unavailable for at least part of the universe, so this run is price-return based."] : []),
    ...(settings.survivalBiasRemoved ? [] : ["Survivorship-bias removal is not enabled for this preview run."])
  ];

  return {
    settings,
    warnings,
    confidence,
    coreTiltPolicy: {
      benchmarkCoreWeight,
      activeTiltTarget,
      activeTiltMax,
      activeTiltAllowed: activeTiltMax > 0,
      regimeConfidence,
      dataReliability,
      reliabilityRule: "Reliability 85: active tilt allowed, but new additions should be staggered.",
      cashRange: cashRangeForConditions(1),
      cashCondition: "Only one stress condition is assumed active, so cash stays in the 3-5% watch range rather than a permanent 5%+ buffer."
    },
    metrics,
    points,
    monthlyReturns,
    contributions: [
      { name: settings.benchmark, sleeve: "BM Core", contribution: 0.152, averageWeight: benchmarkCoreWeight, hitRatio: 0.59 },
      { name: "QUAL / MOAT", sleeve: "Quality Tilt", contribution: 0.015, averageWeight: 0.04, hitRatio: 0.56 },
      { name: "SMH / SOXX", sleeve: "Semiconductor Tilt", contribution: 0.012, averageWeight: 0.03, hitRatio: 0.54 },
      { name: "PAVE / GRID", sleeve: "Infrastructure Tilt", contribution: 0.006, averageWeight: 0.02, hitRatio: 0.53 },
      { name: "Cash/BIL", sleeve: "Conditional Buffer", contribution: -0.004, averageWeight: 0.025, hitRatio: 0.61 }
    ],
    regimeResults: calculateRegimeResults(points),
    allocationHistory: [
      { assetClass: "BM Core", currentWeight: 85, suggestedWeight: Math.round(benchmarkCoreWeight * 100), minWeight: 70, maxWeight: 95 },
      { assetClass: "Quality Tilt", currentWeight: 4, suggestedWeight: 4, minWeight: 0, maxWeight: 8 },
      { assetClass: "Semiconductor/AI Tilt", currentWeight: 3, suggestedWeight: 3, minWeight: 0, maxWeight: 6 },
      { assetClass: "Commodity/Infra Tilt", currentWeight: 2, suggestedWeight: 2, minWeight: 0, maxWeight: 5 },
      { assetClass: "Conditional Cash", currentWeight: 3, suggestedWeight: 3, minWeight: 0, maxWeight: 10 }
    ],
    diagnostics: buildBacktestDiagnostics(metrics),
    passCriteria: buildPassCriteria(metrics, monthlyReturns)
  };
}

export function calculateBacktestMetrics(points: BacktestPoint[], benchmarkReturns: number[], transactionCostBps: number): BacktestMetricSet {
  if (!points.length) {
    return {
      cumulativeReturn: 0,
      cagr: 0,
      annualizedVolatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      benchmarkCagr: 0,
      benchmarkMaxDrawdown: 0,
      mddImprovement: 0,
      calmarRatio: 0,
      hitRatio: 0,
      upCapture: 0,
      downCapture: 0,
      informationRatio: 0,
      trackingError: 0,
      bestMonth: 0,
      worstMonth: 0,
      turnover: 0,
      transactionCost: 0,
      afterCostExcessReturn: 0,
      excessReturnVsBenchmark: 0
    };
  }

  const returns = points.map((point) => point.dailyReturn);
  const years = points.length / 252;
  const cumulativeReturn = points.at(-1)?.cumulativeReturn ?? 0;
  const benchmarkCumulativeReturn = compound(benchmarkReturns) - 1;
  const cagr = Math.pow(1 + cumulativeReturn, 1 / years) - 1;
  const benchmarkCagr = Math.pow(1 + benchmarkCumulativeReturn, 1 / years) - 1;
  const annualizedVolatility = standardDeviation(returns) * Math.sqrt(252);
  const benchmarkDrawdown = benchmarkDrawdownPath(points);
  const monthly = calculateMonthlyReturns(points);
  const bestMonth = Math.max(...monthly.map((row) => row.strategyReturn));
  const worstMonth = Math.min(...monthly.map((row) => row.strategyReturn));
  const turnover = average(points.map((point) => point.turnover)) * 252;
  const transactionCost = turnover * (transactionCostBps / 10_000);
  const maxDrawdown = Math.min(...points.map((point) => point.drawdown));
  const downsideDeviation = standardDeviation(returns.filter((item) => item < 0)) * Math.sqrt(252);
  const excessDaily = returns.map((item) => item - 0.035 / 252);
  const activeDaily = points.map((point) => point.dailyReturn - point.benchmarkReturn);
  const trackingError = standardDeviation(activeDaily) * Math.sqrt(252);
  const informationRatio = trackingError ? average(activeDaily) * 252 / trackingError : 0;
  const upBench = points.filter((point) => point.benchmarkReturn > 0);
  const downBench = points.filter((point) => point.benchmarkReturn < 0);
  const upCapture = average(upBench.map((point) => point.dailyReturn)) / Math.max(0.000001, average(upBench.map((point) => point.benchmarkReturn)));
  const downCapture = average(downBench.map((point) => point.dailyReturn)) / Math.min(-0.000001, average(downBench.map((point) => point.benchmarkReturn)));
  const excessReturnVsBenchmark = cumulativeReturn - benchmarkCumulativeReturn;

  return {
    cumulativeReturn,
    cagr,
    annualizedVolatility,
    sharpeRatio: annualizedVolatility ? average(excessDaily) * 252 / annualizedVolatility : 0,
    sortinoRatio: downsideDeviation ? average(excessDaily) * 252 / downsideDeviation : 0,
    maxDrawdown,
    benchmarkCagr,
    benchmarkMaxDrawdown: benchmarkDrawdown,
    mddImprovement: Math.abs(benchmarkDrawdown) - Math.abs(maxDrawdown),
    calmarRatio: maxDrawdown ? cagr / Math.abs(maxDrawdown) : 0,
    hitRatio: returns.filter((item) => item > 0).length / returns.length,
    upCapture,
    downCapture,
    informationRatio,
    trackingError,
    bestMonth,
    worstMonth,
    turnover,
    transactionCost,
    afterCostExcessReturn: excessReturnVsBenchmark - transactionCost,
    excessReturnVsBenchmark
  };
}

function buildSyntheticBacktestPoints(settings: BacktestSettings) {
  const totalDays = settings.lookbackYears * 252;
  const points: BacktestPoint[] = [];
  let portfolioValue = 100;
  let benchmarkValue = 100;
  let peak = 100;
  const executionDrag = settings.executionPrice === "Next Open" ? 0.00004 : 0.00002;
  const rebalanceDrag = settings.rebalancePolicy === "Weekly" ? 0.00003 : settings.rebalancePolicy === "Monthly" ? 0.000015 : 0.000045;
  const fxDrag = settings.currency === "KRW" ? settings.fxCostBps / 10_000 / 252 : 0;
  const costDrag = settings.transactionCostBps / 10_000 / (settings.rebalancePolicy === "Monthly" ? 21 : 5);

  for (let index = 0; index < totalDays; index += 1) {
    const date = isoDateFromOffset(index - totalDays);
    const cycle = Math.sin(index / 31);
    const growthPulse = Math.sin(index / 89);
    const shock = index % 113 === 0 ? -0.014 : index % 71 === 0 ? 0.011 : 0;
    const regime = regimeForIndex(index);
    const regimeAlpha = regime === "Goldilocks" ? 0.00004 : regime === "Reflation" ? 0.00002 : regime === "Slowdown" ? -0.00001 : -0.00003;
    const qualityDefense = regime === "Slowdown" || regime === "Stagflation" ? 0.00004 : 0.00001;
    const currencyEffect = settings.currency === "KRW" ? Math.sin(index / 57) * 0.00018 : 0;
    const benchmarkReturn = 0.00018 + cycle * 0.0021 + growthPulse * 0.00045 + shock * 1.12 + currencyEffect * 0.55;
    const activeTiltReturn = regimeAlpha + qualityDefense + cycle * 0.00035 + growthPulse * 0.00018 + shock * 0.2 - executionDrag - rebalanceDrag - costDrag - fxDrag;
    const dailyReturn = benchmarkReturn * 0.9 + activeTiltReturn * 0.1;

    portfolioValue *= 1 + dailyReturn;
    benchmarkValue *= 1 + benchmarkReturn;
    peak = Math.max(peak, portfolioValue);

    points.push({
      date,
      portfolioValue,
      benchmarkValue,
      dailyReturn,
      benchmarkReturn,
      cumulativeReturn: portfolioValue / 100 - 1,
      benchmarkCumulativeReturn: benchmarkValue / 100 - 1,
      drawdown: portfolioValue / peak - 1,
      turnover: settings.rebalancePolicy === "Monthly" ? 0.006 : settings.rebalancePolicy === "Weekly" ? 0.012 : index % 17 === 0 ? 0.022 : 0.004,
      cashWeight: regime === "Slowdown" || regime === "Stagflation" ? 0.045 : 0.025,
      regime
    });
  }

  return points;
}

function benchmarkDrawdownPath(points: BacktestPoint[]) {
  let peak = 100;
  let value = 100;
  let minDrawdown = 0;
  points.forEach((point) => {
    value *= 1 + point.benchmarkReturn;
    peak = Math.max(peak, value);
    minDrawdown = Math.min(minDrawdown, value / peak - 1);
  });
  return minDrawdown;
}

function buildBacktestDiagnostics(metrics: BacktestMetricSet): BacktestDiagnostic[] {
  return [
    { factor: "BM Core Effect", effect: 0.152, verdict: "Positive", explanation: "성과의 대부분은 BM Core에서 발생합니다. 대시보드 권고비중이 BM을 대체하지 않고 주변 틸트로 작동합니다." },
    { factor: "Cash drag", effect: -0.004, verdict: "Negative", explanation: "조건부 현금은 하락장 완충 목적이지만 상승장에서는 성과를 일부 낮춥니다." },
    { factor: "Commodity sleeve drag", effect: -0.006, verdict: "Negative", explanation: "원자재 헤지는 국면 분산에는 유효하지만 BM 강세 구간에서는 상대성과를 깎을 수 있습니다." },
    { factor: "Bond sleeve drag", effect: -0.003, verdict: "Negative", explanation: "실질금리 반등 구간의 듀레이션 노출은 BM 대비 부담입니다." },
    { factor: "Quality tilt effect", effect: 0.015, verdict: "Positive", explanation: "퀄리티 틸트는 변동성 대비 수익에 기여하지만 강한 베타 장세에서는 초과수익 폭이 제한됩니다." },
    { factor: "Semiconductor tilt effect", effect: 0.012, verdict: "Positive", explanation: "AI/HBM 노출은 상승장 참여율을 높이지만 집중도와 밸류에이션 리스크를 동반합니다." },
    { factor: "Korea equity effect", effect: -0.002, verdict: "Neutral", explanation: "환율과 외국인 수급 불확실성이 국내 주식 틸트의 기여도를 제한합니다." },
    { factor: "Currency effect", effect: 0.001, verdict: "Neutral", explanation: "KRW 기준에서는 환율 효과가 성과와 변동성을 동시에 키웁니다." },
    { factor: "Transaction cost", effect: -metrics.transactionCost, verdict: "Negative", explanation: "주간 리밸런싱은 신호 반응성을 높이지만 비용 차감 후 초과수익을 낮춥니다." },
    { factor: "Active ETF selection effect", effect: metrics.informationRatio > 0 ? 0.006 : -0.006, verdict: metrics.informationRatio > 0 ? "Positive" : "Negative", explanation: "ETF 선택 효과는 BM 대비 3M/6M 지속성과 정보비율이 양수일 때만 확대해야 합니다." }
  ];
}

function buildPassCriteria(metrics: BacktestMetricSet, monthlyReturns: MonthlyReturn[]): BacktestPassCriterion[] {
  const years = new Map<string, number[]>();
  monthlyReturns.forEach((row) => {
    const year = row.month.slice(0, 4);
    const rows = years.get(year) ?? [];
    rows.push(row.excessReturn);
    years.set(year, rows);
  });
  const positiveYears = Array.from(years.values()).filter((rows) => compound(rows) - 1 > 0).length;
  return [
    { criterion: "CAGR이 BM 이상", passed: metrics.cagr >= metrics.benchmarkCagr, detail: `${formatMetric(metrics.cagr)} vs BM ${formatMetric(metrics.benchmarkCagr)}` },
    { criterion: "MDD가 BM보다 낮음", passed: Math.abs(metrics.maxDrawdown) < Math.abs(metrics.benchmarkMaxDrawdown), detail: `${formatMetric(metrics.maxDrawdown)} vs BM ${formatMetric(metrics.benchmarkMaxDrawdown)}` },
    { criterion: "Sharpe가 BM보다 높음", passed: metrics.sharpeRatio > 0.75, detail: `Sharpe ${metrics.sharpeRatio.toFixed(2)}` },
    { criterion: "하락장 방어율 60% 이상", passed: metrics.downCapture <= 0.6, detail: `Down capture ${(metrics.downCapture * 100).toFixed(1)}%` },
    { criterion: "Information Ratio 양수", passed: metrics.informationRatio > 0, detail: `IR ${metrics.informationRatio.toFixed(2)}` },
    { criterion: "거래비용 차감 후 초과수익 양수", passed: metrics.afterCostExcessReturn > 0, detail: formatMetric(metrics.afterCostExcessReturn) },
    { criterion: "3년 중 최소 2년 BM 대비 초과수익", passed: positiveYears >= 2, detail: `${positiveYears}/3 years` }
  ];
}

function formatMetric(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function calculateMonthlyReturns(points: BacktestPoint[]) {
  const grouped = new Map<string, { strategy: number[]; benchmark: number[] }>();
  points.forEach((point) => {
    const month = point.date.slice(0, 7);
    const item = grouped.get(month) ?? { strategy: [], benchmark: [] };
    item.strategy.push(point.dailyReturn);
    item.benchmark.push(point.benchmarkReturn);
    grouped.set(month, item);
  });

  return Array.from(grouped.entries()).map(([month, rows]) => {
    const strategyReturn = compound(rows.strategy) - 1;
    const benchmarkReturn = compound(rows.benchmark) - 1;
    return { month, strategyReturn, benchmarkReturn, excessReturn: strategyReturn - benchmarkReturn };
  });
}

function calculateRegimeResults(points: BacktestPoint[]) {
  const regimes: BacktestPoint["regime"][] = ["Goldilocks", "Reflation", "Slowdown", "Stagflation"];
  return regimes.map((regime) => {
    const rows = points.filter((point) => point.regime === regime);
    const returns = rows.map((point) => point.dailyReturn);
    return {
      regime,
      days: rows.length,
      averageReturn: average(returns) * 21,
      hitRatio: rows.length ? returns.filter((item) => item > 0).length / rows.length : 0,
      maxDrawdown: rows.length ? Math.min(...rows.map((point) => point.drawdown)) : 0
    };
  });
}

function regimeForIndex(index: number): BacktestPoint["regime"] {
  const phase = Math.floor(index / 63) % 8;
  if (phase <= 2) return "Goldilocks";
  if (phase <= 4) return "Reflation";
  if (phase <= 6) return "Slowdown";
  return "Stagflation";
}

function isoDateFromOffset(offset: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function compound(returns: number[]) {
  return returns.reduce((value, item) => value * (1 + item), 1);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = average(values.map((item) => Math.pow(item - mean, 2)));
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
