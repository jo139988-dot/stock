export type BacktestCurrency = "USD" | "KRW";
export type RebalancePolicy = "Weekly" | "Monthly" | "Signal Change";
export type ExecutionPrice = "Next Open" | "Next Close";
export type BenchmarkName = "SPY" | "QQQ" | "60/40 Portfolio" | "ACWI" | "KOSPI200" | "Custom";
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
  calmarRatio: number;
  hitRatio: number;
  bestMonth: number;
  worstMonth: number;
  turnover: number;
  transactionCost: number;
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

export type BacktestPreview = {
  settings: BacktestSettings;
  warnings: string[];
  confidence: BacktestConfidence;
  metrics: BacktestMetricSet;
  points: BacktestPoint[];
  monthlyReturns: MonthlyReturn[];
  contributions: BacktestContribution[];
  regimeResults: RegimeBacktestResult[];
  allocationHistory: AllocationHistoryRow[];
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
  benchmark: "SPY",
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

export const BACKTEST_BENCHMARKS: BenchmarkName[] = ["SPY", "QQQ", "60/40 Portfolio", "ACWI", "KOSPI200", "Custom"];

export const BACKTEST_LIMITATIONS = [
  "If point-in-time historical signals are unavailable, results are reconstructed from stored dashboard logic and must be labeled reconstructed backtest.",
  "Quality stock tests that use modeled fundamentals are low-confidence backtests until point-in-time fundamentals are connected.",
  "The default execution rule uses the next trading day after signal generation to reduce look-ahead bias.",
  "Survivorship-bias removal must be shown explicitly for stock universes and delisted securities.",
  "Total return is preferred. If only price return is available, the result must show a dividend-data warning."
];

export const BACKTEST_STRATEGY_RULES = [
  {
    name: "ETF Allocation Strategy",
    rules: [
      "Allocation Score >= 75: Overweight; 65-75: Neutral+; 50-65: Neutral; 40-50: Neutral-; below 40: Underweight.",
      "If drawdownRisk >= 70, cap max ETF weight regardless of score.",
      "If dataStatus is Error, block new additions.",
      "If dataStatus is Modeled, apply a confidence haircut before portfolio sizing."
    ]
  },
  {
    name: "Asset Allocation Strategy",
    rules: [
      "Use suggestedWeight from asset_allocation_history as the strategic target.",
      "If Macro Regime Confidence < 65, keep at least 3-5% tactical cash buffer.",
      "If Data Reliability < 85, reduce total risk-asset weight by 5 percentage points."
    ]
  },
  {
    name: "Quality Stock Strategy",
    rules: [
      "Include stocks with qualityScore >= 75, valuationScore >= 40, earningsRevisionScore >= 60.",
      "Require liquidityRisk <= 60 and balanceSheetRisk <= 60.",
      "Only include Core Hold, Accumulate, or Buy on Weakness actions.",
      "Cap single-name exposure at 5%, mid/small caps at 2%, and sector exposure at 25%."
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

export function buildReconstructedBacktestPreview(settings: BacktestSettings): BacktestPreview {
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
    metrics,
    points,
    monthlyReturns,
    contributions: [
      { name: "QUAL", sleeve: "Quality ETF", contribution: 0.061, averageWeight: 0.11, hitRatio: 0.57 },
      { name: "SMH", sleeve: "Semiconductor ETF", contribution: 0.048, averageWeight: 0.08, hitRatio: 0.54 },
      { name: "PAVE", sleeve: "Infrastructure ETF", contribution: 0.029, averageWeight: 0.06, hitRatio: 0.55 },
      { name: "Quality Stocks", sleeve: "Single-name Quality", contribution: 0.044, averageWeight: 0.16, hitRatio: 0.58 },
      { name: "Cash/BIL", sleeve: "Cash Buffer", contribution: 0.012, averageWeight: 0.05, hitRatio: 0.62 }
    ],
    regimeResults: calculateRegimeResults(points),
    allocationHistory: [
      { assetClass: "US Equity", currentWeight: 22, suggestedWeight: 24, minWeight: 21, maxWeight: 27 },
      { assetClass: "Korea Equity", currentWeight: 14, suggestedWeight: 13, minWeight: 10, maxWeight: 16 },
      { assetClass: "Quality Large Cap", currentWeight: 18, suggestedWeight: 20, minWeight: 17, maxWeight: 23 },
      { assetClass: "Semiconductor/AI", currentWeight: 12, suggestedWeight: 14, minWeight: 11, maxWeight: 17 },
      { assetClass: "Cash / Tactical Buffer", currentWeight: 4, suggestedWeight: 5, minWeight: 4, maxWeight: 6 }
    ]
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
      calmarRatio: 0,
      hitRatio: 0,
      bestMonth: 0,
      worstMonth: 0,
      turnover: 0,
      transactionCost: 0,
      excessReturnVsBenchmark: 0
    };
  }

  const returns = points.map((point) => point.dailyReturn);
  const years = points.length / 252;
  const cumulativeReturn = points.at(-1)?.cumulativeReturn ?? 0;
  const benchmarkCumulativeReturn = compound(benchmarkReturns) - 1;
  const cagr = Math.pow(1 + cumulativeReturn, 1 / years) - 1;
  const annualizedVolatility = standardDeviation(returns) * Math.sqrt(252);
  const monthly = calculateMonthlyReturns(points);
  const bestMonth = Math.max(...monthly.map((row) => row.strategyReturn));
  const worstMonth = Math.min(...monthly.map((row) => row.strategyReturn));
  const turnover = average(points.map((point) => point.turnover)) * 252;
  const transactionCost = turnover * (transactionCostBps / 10_000);
  const maxDrawdown = Math.min(...points.map((point) => point.drawdown));
  const downsideDeviation = standardDeviation(returns.filter((item) => item < 0)) * Math.sqrt(252);
  const excessDaily = returns.map((item) => item - 0.035 / 252);

  return {
    cumulativeReturn,
    cagr,
    annualizedVolatility,
    sharpeRatio: annualizedVolatility ? average(excessDaily) * 252 / annualizedVolatility : 0,
    sortinoRatio: downsideDeviation ? average(excessDaily) * 252 / downsideDeviation : 0,
    maxDrawdown,
    calmarRatio: maxDrawdown ? cagr / Math.abs(maxDrawdown) : 0,
    hitRatio: returns.filter((item) => item > 0).length / returns.length,
    bestMonth,
    worstMonth,
    turnover,
    transactionCost,
    excessReturnVsBenchmark: cumulativeReturn - benchmarkCumulativeReturn
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
    const regimeAlpha = regime === "Goldilocks" ? 0.00032 : regime === "Reflation" ? 0.0002 : regime === "Slowdown" ? -0.00005 : -0.00016;
    const qualityDefense = regime === "Slowdown" || regime === "Stagflation" ? 0.00009 : 0.00003;
    const currencyEffect = settings.currency === "KRW" ? Math.sin(index / 57) * 0.00018 : 0;
    const dailyReturn = regimeAlpha + qualityDefense + cycle * 0.0018 + growthPulse * 0.0006 + shock + currencyEffect - executionDrag - rebalanceDrag - costDrag - fxDrag;
    const benchmarkReturn = 0.00018 + cycle * 0.0021 + growthPulse * 0.00045 + shock * 1.12 + currencyEffect * 0.55;

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
      cashWeight: regime === "Slowdown" || regime === "Stagflation" ? 0.07 : settings.currency === "KRW" ? 0.05 : 0.04,
      regime
    });
  }

  return points;
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
