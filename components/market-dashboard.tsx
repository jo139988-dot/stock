"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Database,
  Factory,
  Gauge,
  Gem,
  Globe2,
  Landmark,
  Layers3,
  LineChart,
  Menu,
  RadioTower,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sprout,
  TrendingUp
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
import {
  BACKTEST_BENCHMARKS,
  BACKTEST_ETF_UNIVERSE,
  BACKTEST_LIMITATIONS,
  BACKTEST_STRATEGY_RULES,
  DEFAULT_BACKTEST_SETTINGS,
  buildReconstructedBacktestPreview
} from "@/lib/backtest-engine";
import type { BacktestSettings } from "@/lib/backtest-engine";
import type {
  DataStatus,
  Indicator,
  IndicatorTone,
  MarketSnapshot,
  SourceFetchLog
} from "@/lib/market-types";

const navItems = [
  "Home",
  "Macro Cockpit",
  "Macro Regime",
  "Asset Allocation",
  "Sector & ETF",
  "Quality Stocks",
  "Commodity",
  "Portfolio",
  "Backtest Lab",
  "Risk & Data"
] as const;

type NavItem = (typeof navItems)[number];
type AllocationAction = "Overweight" | "Neutral+" | "Neutral" | "Neutral-" | "Underweight" | "Avoid";
type QualityAction = "Core Hold" | "Accumulate" | "Buy on Weakness" | "Valuation Watch" | "Deep Dive Needed" | "Trim" | "Avoid";
type InvestmentAction = AllocationAction | QualityAction | "Accumulate Watch" | "Risk Review" | "Trim / Rebalance" | "Thesis Review" | "Position Sizing";
type RegimeName = "Goldilocks" | "Reflation" | "Slowdown" | "Stagflation";
type UiDataStatus = "Live" | "Delayed" | "Stale" | "Modeled" | "Fallback" | "Error";
type ConfidenceLevel = "High" | "Medium" | "Low";

type MacroRegime = {
  name: RegimeName;
  quadrant: string;
  probability: number;
  previousRegime: RegimeName;
  changeMoM: number;
  confidenceScore: number;
  preferredAssets: string[];
  preferredSectors: string[];
  avoidSectors: string[];
  recommendedEtfs: string[];
  keyRisks: string[];
};

type AssetAllocation = {
  assetClass: string;
  signal: AllocationAction;
  currentWeight: number;
  suggestedWeight: number;
  previousWeight: number;
  minWeight: number;
  maxWeight: number;
  rebalanceNeeded: string;
  rebalanceTrigger: string;
  rationale: string;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
  dataStatus: UiDataStatus;
};

type EtfAllocation = {
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  macroFitScore: number;
  trendScore: number;
  valuationScore: number;
  cycleScore: number;
  liquidityScore: number;
  drawdownRisk: number;
  correlationToPortfolio: number;
  action: AllocationAction;
  rationale: string;
  region: "US" | "Global" | "Macro";
  dataStatus: UiDataStatus;
  confidence: number;
};

type QualityStock = {
  ticker: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "NASDAQ" | "S&P500";
  sector: string;
  theme: string;
  marketCap: number;
  tradingValue: number;
  qualityScore: number;
  businessQualityScore: number;
  financialQualityScore: number;
  growthDurabilityScore: number;
  valuationScore: number;
  earningsRevisionScore: number;
  momentumScore: number;
  liquidityRisk: number;
  balanceSheetRisk: number;
  action: QualityAction;
  investmentThesis: string;
  keyRisk: string;
  dataStatus: UiDataStatus;
  confidence: number;
};

type MidSmallQuality = QualityStock & {
  salesGrowth: number;
  operatingMargin: number;
  roe: number;
  roic: number;
  netDebtToEbitda: number;
  fcfPositive: boolean;
  consensusRevisionUp: boolean;
  drawdownFrom52wHigh: number;
  foreignInstitutionFlow: number;
  governanceRisk: number;
  earningsVisibilityRisk: number;
  overhangRisk: number;
};

type CommodityMonitor = {
  category: string;
  commodityTrend: string;
  futuresCurve: string;
  inventoryTrend: string;
  dollarSensitivity: "Low" | "Medium" | "High";
  chinaDemandSensitivity: "Low" | "Medium" | "High";
  relatedEtfs: string[];
  relatedStocks: string[];
  action: InvestmentAction;
  rationale: string;
  dataStatus: UiDataStatus;
  confidence: number;
};

type RiskAlert = {
  title: string;
  severity: "Red" | "Orange" | "Yellow";
  trigger: string;
  affectedAssetClasses: string[];
  affectedSectors: string[];
  affectedEtfs: string[];
  affectedStocks: string[];
  suggestedInvestorAction: string;
  type: "Tactical" | "Fundamental";
  confidence: number;
};

type PortfolioBucket = {
  bucket: string;
  suggestedWeight: number;
  minWeight: number;
  maxWeight: number;
  regimeFit: number;
  rebalanceTrigger: string;
  riskComment: string;
};

type WatchlistItem = {
  asset: string;
  type: "ETF" | "Stock" | "Commodity" | "Asset Class";
  region: "US" | "Korea" | "Global" | "Macro";
  currentWeight: number;
  targetWeight: number;
  suggestedWeight: number;
  currentAction: InvestmentAction;
  currentScore: number;
  macroSensitivity: string;
  dataStatus: UiDataStatus;
  rebalanceNeeded: string;
  keyRisk: string;
};

type MacroCategory =
  | "Rates"
  | "FX"
  | "Volatility"
  | "Credit"
  | "Liquidity"
  | "Commodities"
  | "Korea Macro"
  | "Inflation"
  | "Growth";

type MacroMetricConfig = {
  id: string;
  label: string;
  category: MacroCategory;
  fallbackValue: number;
  unit: string;
  change5d: number;
  change20d: number;
  regimeImpact: string;
  sectorImpact: string;
  source: string;
  status?: UiDataStatus;
};

type MacroMetric = MacroMetricConfig & {
  value: number;
  change1d: number;
  dataStatus: UiDataStatus;
  basisDate: string;
};

type MacroMonitorConfig = {
  title: string;
  eyebrow: string;
  metrics: MacroMetricConfig[];
  interpretation: Record<string, string>;
};

type MacroIssue = {
  severity: "High" | "Medium" | "Low";
  title: string;
  category: MacroCategory | "Policy" | "Event";
  relatedIndicators: string[];
  affectedAssetClasses: string[];
  affectedSectors: string[];
  affectedEtfs: string[];
  affectedStocks: string[];
  interpretation: string;
  suggestedAction: string;
  source: string;
  timestamp: string;
  dataStatus: UiDataStatus;
};

type MacroEvent = {
  date: string;
  time: string;
  country: string;
  event: string;
  consensus: string;
  previous: string;
  actual: string;
  importance: "High" | "Medium" | "Low";
  likelyMarketImpact: string;
  assetsToWatch: string;
  positioningNote: string;
};

type MacroImpact = {
  driver: string;
  signal: string;
  sectorEtfImpact: string;
  stockImpact: string;
  portfolioAction: string;
};

type RiskBudgetItem = {
  item: string;
  current: string;
  limit: string;
  status: "Within" | "Watch" | "Breach";
  suggestedAction: string;
};

const toneClass: Record<IndicatorTone, string> = {
  positive: "border-positive/35 bg-positive/10 text-positive",
  neutral: "border-white/10 bg-white/5 text-muted",
  caution: "border-caution/40 bg-caution/10 text-caution",
  negative: "border-negative/40 bg-negative/10 text-negative"
};

const statusClass: Record<DataStatus | UiDataStatus, string> = {
  Fresh: "border-positive/35 bg-positive/10 text-positive",
  Live: "border-positive/35 bg-positive/10 text-positive",
  Delayed: "border-yellow-400/45 bg-yellow-400/10 text-yellow-200",
  Stale: "border-orange-400/45 bg-orange-400/10 text-orange-200",
  Modeled: "border-purple-400/45 bg-purple-400/10 text-purple-200",
  Fallback: "border-accent/45 bg-accent/10 text-accent",
  Error: "border-negative/40 bg-negative/10 text-negative"
};

const actionClass: Record<InvestmentAction, string> = {
  Overweight: "border-positive/40 bg-positive/10 text-positive",
  "Neutral+": "border-positive/30 bg-positive/5 text-positive",
  Neutral: "border-white/10 bg-white/5 text-white",
  "Neutral-": "border-caution/35 bg-caution/10 text-caution",
  Underweight: "border-orange-400/45 bg-orange-400/10 text-orange-200",
  Avoid: "border-negative/40 bg-negative/10 text-negative",
  "Core Hold": "border-white/10 bg-white/5 text-white",
  Accumulate: "border-positive/40 bg-positive/10 text-positive",
  "Accumulate Watch": "border-positive/35 bg-positive/5 text-positive",
  "Buy on Weakness": "border-positive/35 bg-positive/5 text-positive",
  "Valuation Watch": "border-caution/40 bg-caution/10 text-caution",
  "Deep Dive Needed": "border-white/10 bg-white/5 text-white",
  Trim: "border-orange-400/45 bg-orange-400/10 text-orange-200",
  "Trim / Rebalance": "border-orange-400/45 bg-orange-400/10 text-orange-200",
  "Risk Review": "border-negative/40 bg-negative/10 text-negative",
  "Thesis Review": "border-caution/40 bg-caution/10 text-caution",
  "Position Sizing": "border-accent/45 bg-accent/10 text-accent"
};

const ko = {
  title: "\uB9E4\uD06C\uB85C \uAE30\uBC18 \uD0D1\uB2E4\uC6B4 \uD22C\uC790 \uB300\uC2DC\uBCF4\uB4DC",
  subtitle: "\uB9E4\uD06C\uB85C \uC6D0\uC790\uB8CC \u00B7 \uC774\uC288 \uD750\uB984 \u00B7 \uC774\uBCA4\uD2B8 \u00B7 \uC139\uD130 ETF \u00B7 \uD004\uB9AC\uD2F0 \uC885\uBAA9 \uBC30\uBD84",
  menu: "\uBA54\uB274",
  actionLanguage: "\uD22C\uC790 \uC561\uC158 \uC6A9\uC5B4",
  detail: "\uC0C1\uC138 \uBCF4\uAE30"
};

const navLabel: Record<NavItem, string> = {
  Home: "\uD648",
  "Macro Cockpit": "\uB9E4\uD06C\uB85C \uB300\uC2DC\uBCF4\uB4DC",
  "Macro Regime": "\uB9E4\uD06C\uB85C \uAD6D\uBA74",
  "Asset Allocation": "\uC790\uC0B0\uBC30\uBD84",
  "Sector & ETF": "\uC139\uD130\u00B7ETF",
  "Quality Stocks": "\uD004\uB9AC\uD2F0 \uC885\uBAA9",
  Commodity: "\uC6D0\uC790\uC7AC",
  Portfolio: "\uD3EC\uD2B8\uD3F4\uB9AC\uC624",
  "Backtest Lab": "\uBC31\uD14C\uC2A4\uD2B8",
  "Risk & Data": "\uB9AC\uC2A4\uD06C\u00B7\uB370\uC774\uD130"
};

const actionLabel: Record<InvestmentAction, string> = {
  Overweight: "\uBE44\uC911\uD655\uB300",
  "Neutral+": "\uC911\uB9BD+",
  Neutral: "\uC911\uB9BD",
  "Neutral-": "\uC911\uB9BD-",
  Underweight: "\uBE44\uC911\uCD95\uC18C",
  Avoid: "\uD68C\uD53C",
  "Core Hold": "\uD575\uC2EC \uBCF4\uC720",
  Accumulate: "\uBD84\uD560\uB9E4\uC218",
  "Accumulate Watch": "\uBD84\uD560\uB9E4\uC218 \uAD00\uCC30",
  "Buy on Weakness": "\uB20C\uB9BC\uBAA9 \uB9E4\uC218",
  "Valuation Watch": "\uBC38\uB958\uC5D0\uC774\uC158 \uAD00\uCC30",
  "Deep Dive Needed": "\uC2EC\uCE35 \uAC80\uD1A0",
  Trim: "\uC77C\uBD80\uCD95\uC18C",
  "Trim / Rebalance": "\uC77C\uBD80\uCD95\uC18C / \uB9AC\uBC38\uB7F0\uC2F1",
  "Risk Review": "\uB9AC\uC2A4\uD06C \uC7AC\uC810\uAC80",
  "Thesis Review": "\uD22C\uC790\uB17C\uB9AC \uC7AC\uC810\uAC80",
  "Position Sizing": "\uBE44\uC911 \uC870\uC808"
};

const statusLabel: Record<DataStatus | UiDataStatus, string> = {
  Fresh: "\uC815\uC0C1",
  Live: "\uC815\uC0C1",
  Delayed: "\uC9C0\uC5F0",
  Stale: "\uC624\uB798\uB41C \uB370\uC774\uD130",
  Modeled: "\uBAA8\uB378\uAC12",
  Fallback: "\uB300\uCCB4 \uB370\uC774\uD130",
  Error: "\uC624\uB958"
};

const issueTitleKo: Record<string, string> = {
  "US real yield rebound": "\uBBF8\uAD6D \uC2E4\uC9C8\uAE08\uB9AC \uBC18\uB4F1",
  "USD/KRW breakout risk": "\uB2EC\uB7EC/\uC6D0 \uC0C1\uC2B9 \uB3CC\uD30C \uB9AC\uC2A4\uD06C",
  "Copper strength needs China confirmation": "\uAD6C\uB9AC \uAC15\uC138, \uC911\uAD6D \uC218\uC694 \uD655\uC778 \uD544\uC694",
  "Liquidity drag from TGA rebuild": "TGA \uC7AC\uCD95\uC801\uC5D0 \uB530\uB978 \uC720\uB3D9\uC131 \uBD80\uB2F4"
};

const severityLabel: Record<MacroIssue["severity"], string> = {
  High: "\uB192\uC74C",
  Medium: "\uC911\uAC04",
  Low: "\uB0AE\uC74C"
};

const macroRegimes: MacroRegime[] = [
  {
    name: "Goldilocks",
    quadrant: "Growth Up / Inflation Down",
    probability: 37,
    previousRegime: "Reflation",
    changeMoM: 5,
    confidenceScore: 78,
    preferredAssets: ["Quality Growth", "Semiconductor/AI", "Mid-cap compounders"],
    preferredSectors: ["Technology", "Industrials", "Healthcare"],
    avoidSectors: ["Deep cyclicals with weak balance sheets"],
    recommendedEtfs: ["QQQ", "QUAL", "MOAT", "SMH", "PAVE"],
    keyRisks: ["Dollar rebound", "Crowded AI leadership", "Real yield shock"]
  },
  {
    name: "Reflation",
    quadrant: "Growth Up / Inflation Up",
    probability: 28,
    previousRegime: "Goldilocks",
    changeMoM: 3,
    confidenceScore: 70,
    preferredAssets: ["Commodity Equity", "Value cyclicals", "Infrastructure"],
    preferredSectors: ["Energy", "Materials", "Industrials", "Financials"],
    avoidSectors: ["Long-duration expensive growth"],
    recommendedEtfs: ["XLE", "XLI", "XLB", "COPX", "URA"],
    keyRisks: ["Oil shock", "Rate shock", "Dollar strength"]
  },
  {
    name: "Slowdown",
    quadrant: "Growth Down / Inflation Down",
    probability: 22,
    previousRegime: "Reflation",
    changeMoM: -4,
    confidenceScore: 63,
    preferredAssets: ["Quality defensive", "Bonds", "Cash optionality"],
    preferredSectors: ["Healthcare", "Utilities", "Dividend quality"],
    avoidSectors: ["Small-cap leverage", "Early-cycle cyclicals"],
    recommendedEtfs: ["XLV", "XLU", "VIG", "IEF", "TLT"],
    keyRisks: ["Earnings revision down", "Liquidity deterioration"]
  },
  {
    name: "Stagflation",
    quadrant: "Growth Down / Inflation Up",
    probability: 13,
    previousRegime: "Slowdown",
    changeMoM: -4,
    confidenceScore: 58,
    preferredAssets: ["Gold", "Oil & gas cash flow", "Short-duration cash"],
    preferredSectors: ["Energy", "Gold miners", "Defensives"],
    avoidSectors: ["Unprofitable growth", "Levered small caps"],
    recommendedEtfs: ["GLD", "GDX", "XLE", "BIL", "UUP"],
    keyRisks: ["Margin compression", "Credit spread widening"]
  }
];

const assetAllocations: AssetAllocation[] = [
  rowAsset("US Equity", "Neutral+", 24, 22, "Quality growth leadership remains intact, but valuation discipline is needed.", "Medium", 76),
  rowAsset("Korea Equity", "Neutral", 13, 14, "Export cycle is constructive, while foreign flow and KRW volatility limit aggression.", "Medium", 64),
  rowAsset("Quality Large Cap", "Overweight", 20, 18, "Balance-sheet strength and earnings visibility fit the current regime.", "Low", 82),
  rowAsset("Mid/Small Cap Quality", "Neutral", 8, 7, "Selective allocation only where liquidity and governance risks are controlled.", "High", 58),
  rowAsset("Semiconductor/AI", "Overweight", 14, 12, "AI infrastructure capex cycle supports durable growth, but crowding is rising.", "Medium", 74),
  rowAsset("Commodity Equity", "Neutral+", 7, 6, "Copper, power equipment, and energy cash-flow names hedge reflation risk.", "High", 67),
  rowAsset("Sector ETFs", "Neutral", 6, 6, "Use ETFs for regime exposure instead of lower-quality single names.", "Medium", 72),
  rowAsset("Bonds", "Neutral-", 4, 6, "Real yield is still restrictive; duration exposure should be measured.", "Medium", 61),
  rowAsset("Gold", "Neutral+", 3, 3, "Portfolio hedge against dollar, rate, and geopolitical risk.", "Medium", 69),
  rowAsset("Cash / Tactical Buffer", "Neutral+", 5, 4, "Base Cash 1% plus Tactical Buffer 3-5% while macro confidence is below 65 and liquidity drag persists.", "Low", 78, "Modeled", {
    currentWeight: 4,
    minWeight: 4,
    maxWeight: 6,
    rebalanceNeeded: "Hold 4-6% range",
    rebalanceTrigger: "Macro Confidence < 65 or Data Reliability < 85"
  })
];

const etfAllocations: EtfAllocation[] = [
  etf("SPY", "SPDR S&P 500 ETF", "Equity", "Broad US", 72, 74, 48, 66, 92, 38, 0.91, "Neutral+", "Core exposure is acceptable, but concentration in mega-cap growth needs monitoring."),
  etf("QQQ", "Invesco QQQ", "Equity", "Nasdaq Growth", 78, 82, 36, 72, 90, 48, 0.88, "Neutral+", "AI earnings durability supports exposure; valuation is the constraint."),
  etf("IWM", "Russell 2000 ETF", "Equity", "Small Cap", 42, 38, 63, 45, 75, 66, 0.72, "Underweight", "Small-cap balance-sheet and refinancing risk remain high."),
  etf("QUAL", "iShares MSCI USA Quality", "Quality Factor", "Quality", 84, 76, 58, 78, 86, 31, 0.76, "Overweight", "Best fit for quality allocation under mixed macro conditions."),
  etf("MOAT", "VanEck Morningstar Wide Moat", "Quality Factor", "Wide Moat", 79, 68, 62, 74, 71, 36, 0.68, "Overweight", "Moat discipline helps reduce single-theme crowding risk."),
  etf("VIG", "Vanguard Dividend Appreciation", "Quality Income", "Dividend Quality", 70, 63, 66, 61, 88, 29, 0.62, "Neutral+", "Useful stabilizer if growth momentum cools."),
  etf("SCHG", "Schwab US Large-Cap Growth", "Growth", "Large Growth", 76, 81, 34, 75, 84, 51, 0.86, "Neutral", "Strong trend but valuation discipline argues against aggressive overweight."),
  etf("XLK", "Technology Select Sector", "Sector", "Technology", 80, 83, 35, 78, 88, 53, 0.87, "Neutral+", "Quality tech leadership is intact, but drawdown risk is rising."),
  etf("XLE", "Energy Select Sector", "Sector", "Energy", 67, 56, 69, 72, 82, 45, 0.41, "Neutral+", "Cash-flow support and oil optionality diversify growth exposure."),
  etf("XLI", "Industrial Select Sector", "Sector", "Industrials", 74, 67, 57, 71, 83, 37, 0.58, "Overweight", "Infrastructure and power equipment cycles remain constructive."),
  etf("XLF", "Financial Select Sector", "Sector", "Financials", 58, 54, 64, 52, 86, 42, 0.55, "Neutral", "Benefits from reflation but sensitive to credit deterioration."),
  etf("XLV", "Health Care Select Sector", "Sector", "Healthcare", 64, 47, 72, 58, 85, 30, 0.46, "Neutral+", "Defensive quality exposure if slowdown probability rises."),
  etf("XLU", "Utilities Select Sector", "Sector", "Utilities", 55, 44, 66, 49, 78, 33, 0.37, "Neutral", "Rate sensitivity offsets defensive value."),
  etf("XLB", "Materials Select Sector", "Sector", "Materials", 61, 52, 68, 67, 74, 49, 0.52, "Neutral", "Copper and China demand signals need confirmation."),
  etf("SOXX", "iShares Semiconductor", "Theme ETF", "Semiconductor", 86, 88, 28, 82, 82, 58, 0.83, "Neutral+", "High macro fit, but crowded trade and valuation risk are elevated."),
  etf("SMH", "VanEck Semiconductor", "Theme ETF", "Semiconductor", 88, 90, 26, 84, 83, 61, 0.84, "Neutral+", "Leader quality is excellent; add only on weakness."),
  etf("GLD", "SPDR Gold Shares", "Commodity", "Gold", 68, 71, 59, 64, 91, 28, 0.19, "Neutral+", "Portfolio hedge against dollar/rate/geopolitical shocks."),
  etf("IAU", "iShares Gold Trust", "Commodity", "Gold", 67, 70, 60, 64, 88, 27, 0.18, "Neutral+", "Lower-cost gold hedge for strategic allocation."),
  etf("GDX", "VanEck Gold Miners", "Commodity Equity", "Gold Miners", 62, 65, 61, 58, 70, 62, 0.34, "Neutral", "Operational leverage helps in gold uptrends, but drawdown risk is high."),
  etf("COPX", "Global X Copper Miners", "Commodity Equity", "Copper", 69, 63, 55, 72, 61, 67, 0.45, "Neutral+", "Copper supply tightness is positive; China demand is the swing factor."),
  etf("CPER", "US Copper Index Fund", "Commodity", "Copper", 65, 61, 52, 70, 58, 54, 0.31, "Neutral", "Useful macro hedge but less suitable as core quality exposure."),
  etf("URA", "Global X Uranium", "Commodity Equity", "Uranium", 73, 66, 49, 78, 63, 72, 0.38, "Neutral+", "Nuclear power cycle is constructive; volatility requires sizing discipline."),
  etf("URNM", "Sprott Uranium Miners", "Commodity Equity", "Uranium", 75, 67, 46, 81, 58, 76, 0.37, "Neutral+", "Higher beta uranium exposure, use as satellite only."),
  etf("XOP", "SPDR Oil & Gas E&P", "Commodity Equity", "Oil & Gas", 61, 51, 72, 66, 70, 68, 0.42, "Neutral", "Valuation support exists, but commodity beta is high."),
  etf("OIH", "VanEck Oil Services", "Commodity Equity", "Oil Services", 59, 47, 70, 63, 56, 74, 0.39, "Neutral-", "Cycle leverage is high; prefer stronger balance sheets."),
  etf("PAVE", "Global X US Infrastructure", "Sector ETF", "Infrastructure", 78, 69, 55, 76, 72, 43, 0.53, "Overweight", "Infrastructure spending and grid capex fit top-down themes."),
  etf("GRID", "First Trust Nasdaq Clean Edge Grid", "Sector ETF", "Power Grid", 74, 64, 51, 78, 55, 59, 0.49, "Neutral+", "Power demand and AI infrastructure are long-duration supports."),
  etf("TLT", "iShares 20+ Year Treasury", "Bonds", "Long Duration", 42, 37, 68, 40, 90, 57, -0.28, "Underweight", "Duration risk remains high while real yields are elevated."),
  etf("IEF", "iShares 7-10 Year Treasury", "Bonds", "Intermediate Duration", 51, 45, 66, 45, 92, 34, -0.19, "Neutral-", "Better than TLT, but not yet a strong overweight."),
  etf("SHY", "iShares 1-3 Year Treasury", "Bonds", "Short Duration", 63, 58, 70, 45, 94, 12, -0.06, "Neutral", "Cash-like ballast for portfolio construction."),
  etf("BIL", "SPDR 1-3 Month T-Bill", "Cash", "T-Bills", 70, 68, 73, 42, 96, 5, -0.02, "Neutral+", "Useful dry powder without equity drawdown risk."),
  etf("UUP", "Invesco DB US Dollar Bullish", "Currency", "Dollar", 56, 53, 50, 48, 72, 28, -0.21, "Neutral", "Dollar hedge if inflation and rate risks reaccelerate.")
];

const qualityStocks: QualityStock[] = [
  stock("NVDA", "NVIDIA", "NASDAQ", "Technology", "AI Accelerator", 3420000, 15200, 92, 95, 91, 94, 42, 86, 82, 22, 15, "Core Hold", "AI accelerator ecosystem and software moat support durable earnings power.", "Valuation and customer concentration require sizing discipline."),
  stock("MSFT", "Microsoft", "NASDAQ", "Technology", "Cloud/AI", 3180000, 9800, 90, 94, 93, 88, 61, 78, 64, 12, 8, "Core Hold", "Cloud, enterprise distribution, and AI monetization make it a core quality compounder.", "Multiple compression if AI capex ROI is questioned."),
  stock("AVGO", "Broadcom", "NASDAQ", "Technology", "Semiconductor", 690000, 6100, 87, 89, 86, 84, 55, 81, 77, 26, 18, "Accumulate", "Networking, ASIC, and software cash flows support quality growth.", "Semiconductor cyclicality and acquisition integration risk."),
  stock("005930.KS", "Samsung Electronics", "KOSPI", "Technology", "Memory/Foundry", 498000, 7100, 78, 76, 82, 72, 68, 70, 69, 33, 18, "Buy on Weakness", "Memory recovery and balance sheet strength support mid-cycle allocation.", "Foundry execution and KRW volatility remain key risks."),
  stock("000660.KS", "SK Hynix", "KOSPI", "Technology", "AI Memory", 131000, 8200, 84, 86, 80, 88, 49, 84, 86, 31, 28, "Accumulate", "HBM leadership upgrades earnings durability versus prior memory cycles.", "Crowding and capex cycle timing require valuation discipline."),
  stock("207940.KS", "Samsung Biologics", "KOSPI", "Healthcare", "Biologics CDMO", 64000, 1100, 82, 88, 79, 80, 52, 67, 48, 26, 16, "Buy on Weakness", "CDMO scale and long-term contracts provide visible compounding.", "Capacity expansion timing and valuation are the main constraints."),
  stock("JPM", "JPMorgan Chase", "S&P500", "Financials", "Quality Financial", 610000, 5400, 81, 86, 84, 70, 65, 62, 55, 18, 20, "Core Hold", "Best-in-class banking franchise and capital discipline fit quality value exposure.", "Credit cycle deterioration would pressure earnings."),
  stock("LLY", "Eli Lilly", "S&P500", "Healthcare", "Obesity/Diabetes", 815000, 4200, 88, 90, 87, 91, 38, 82, 70, 24, 12, "Valuation Watch", "GLP-1 leadership offers durable growth, but expectations are demanding.", "Any pipeline or reimbursement disappointment could compress multiples."),
  stock("267260.KS", "HD Hyundai Electric", "KOSPI", "Industrials", "Power Equipment", 9800, 2100, 77, 78, 74, 82, 58, 76, 74, 44, 30, "Accumulate", "Grid investment and transformer shortage support earnings visibility.", "Cyclical order slowdown and margin normalization risk."),
  stock("012450.KS", "Hanwha Aerospace", "KOSPI", "Industrials", "Defense", 14800, 1800, 75, 77, 73, 78, 57, 72, 65, 39, 34, "Buy on Weakness", "Defense backlog and export optionality improve medium-term quality.", "Program delay and geopolitical premium reversal.")
];

const midSmallQuality: MidSmallQuality[] = [
  mid("454910.KQ", "Doosan Robotics", "KOSDAQ", "Industrials", "Robot", 4100, 680, 61, 68, 45, 72, 38, 65, 62, 62, 48, "Deep Dive Needed", "Robotics TAM is attractive, but quality proof requires margin visibility.", "Liquidity and valuation are elevated.", 28, -8, 4, 2, -1.8, false, true, -34, 0.7, 42, 64, 58),
  mid("039030.KQ", "ISC", "KOSDAQ", "Technology", "Semiconductor Parts", 3100, 520, 73, 76, 70, 75, 55, 69, 67, 50, 35, "Accumulate", "Test socket moat and AI chip demand support high-quality small-cap exposure.", "Customer concentration and cycle risk.", 18, 24, 19, 15, 0.4, true, true, -18, 1.4, 28, 36, 26),
  mid("042700.KQ", "Hanmi Semiconductor", "KOSDAQ", "Technology", "HBM Equipment", 6200, 1440, 78, 81, 76, 82, 43, 80, 78, 48, 30, "Valuation Watch", "HBM equipment leadership is high quality, but price embeds strong expectations.", "Crowded trade and valuation risk.", 32, 31, 28, 24, -0.2, true, true, -12, 2.8, 34, 29, 38),
  mid("141080.KQ", "LigaChem Bio", "KOSDAQ", "Healthcare", "ADC/Biotech", 2900, 410, 58, 66, 42, 71, 34, 54, 49, 67, 44, "Deep Dive Needed", "Pipeline optionality exists, but investment case is event-driven.", "Cash burn and clinical uncertainty.", 12, -22, -8, -5, -2.4, false, false, -41, -0.3, 38, 72, 46),
  mid("298040.KS", "Hyosung Heavy Industries", "KOSPI", "Industrials", "Power Grid", 3600, 730, 70, 72, 67, 76, 59, 68, 60, 46, 39, "Buy on Weakness", "Transformer cycle and grid investment support mid-cap quality exposure.", "Working capital and order margin volatility.", 16, 12, 13, 9, 1.2, true, true, -21, 0.9, 32, 41, 31)
];

const commodityMonitors: CommodityMonitor[] = [
  commodity("Oil & Gas", "Up but volatile", "Backwardation", "Drawdown", "Medium", "Medium", ["XLE", "XOP", "OIH"], ["XOM", "CVX", "COP"], "Neutral+", "Energy cash-flow quality is useful in reflation, but avoid over-sizing because oil beta can reverse quickly."),
  commodity("Copper", "Improving", "Mild contango", "Tightening", "High", "High", ["COPX", "CPER"], ["FCX", "SCCO", "풍산"], "Neutral+", "Copper exposure fits grid and AI power demand, with China demand as the main confirmation variable."),
  commodity("Gold Miners", "Uptrend", "Spot-led", "Stable", "Medium", "Low", ["GLD", "IAU", "GDX"], ["NEM", "AEM", "GOLD"], "Neutral+", "Gold miners add operating leverage to gold, but position sizing should reflect high drawdown risk."),
  commodity("Uranium", "Structural upcycle", "Tight physical", "Low inventory", "Low", "Medium", ["URA", "URNM"], ["CCJ", "CEG", "UEC"], "Neutral+", "Nuclear demand supports a satellite allocation, with liquidity and volatility controls."),
  commodity("Steel", "Mixed", "Contango", "Elevated", "High", "High", ["SLX"], ["POSCO홀딩스", "NUE"], "Neutral-", "Steel needs better China and inventory signals before moving above neutral."),
  commodity("Battery Materials", "Weak stabilization", "Contango", "High", "High", "High", ["LIT"], ["ALB", "SQM", "에코프로비엠"], "Underweight", "Oversupply and weak pricing argue for fundamental review before allocation is increased."),
  commodity("Power Equipment", "Strong", "Order-book driven", "Tight supply", "Medium", "Medium", ["GRID", "PAVE"], ["ETN", "PWR", "HD Hyundai Electric"], "Overweight", "Grid capex and transformer shortage support quality industrial compounders."),
  commodity("Infrastructure", "Stable uptrend", "Demand-led", "Neutral", "Low", "Medium", ["PAVE", "XLI"], ["CAT", "URI", "GEV"], "Overweight", "Infrastructure provides top-down exposure with more diversified earnings drivers than single commodities."),
  commodity("Shipping", "Cycle rebound", "Freight-led", "Tightening", "High", "High", ["BOAT"], ["HMM", "ZIM", "MATX"], "Neutral", "Freight momentum is improving, but cyclicality keeps this as a tactical satellite.")
];

const riskAlerts: RiskAlert[] = [
  risk("Valuation Stretch Alert", "Orange", "Quality growth valuation percentile above 85%", ["US Equity", "Semiconductor/AI"], ["Technology", "AI"], ["QQQ", "SMH", "SOXX"], ["NVDA", "LLY"], "Use valuation discipline; add only on weakness and avoid portfolio crowding.", "Tactical", 78),
  risk("Earnings Revision Down Alert", "Yellow", "Forward EPS revision breadth turns negative", ["Korea Equity", "Mid/Small Cap"], ["Industrials", "KOSDAQ Growth"], ["IWM", "KOSDAQ basket"], ["454910.KQ", "141080.KQ"], "Move candidates to thesis review until revisions stabilize.", "Fundamental", 66),
  risk("Margin Deterioration Alert", "Yellow", "Gross or operating margin trend falls for two quarters", ["Quality Stocks"], ["Healthcare", "Manufacturing"], ["QUAL", "MOAT"], ["207940.KS"], "Check whether margin pressure is cyclical or thesis-breaking.", "Fundamental", 72),
  risk("Balance Sheet Risk Alert", "Orange", "Net debt/EBITDA rises above sector threshold", ["Mid/Small Cap Quality"], ["Small Cap", "Battery Materials"], ["IWM"], ["247540.KQ"], "Reduce position sizing and require cash-flow confirmation.", "Fundamental", 70),
  risk("Commodity Price Shock Alert", "Orange", "Oil/Copper 20D move exceeds risk band", ["Commodity Equity"], ["Energy", "Materials"], ["XLE", "COPX"], ["COP", "FCX"], "Rebalance commodity beta and avoid extrapolating spot moves.", "Tactical", 74),
  risk("Dollar Strength Alert", "Orange", "DXY and USD/KRW break 20D highs", ["Korea Equity", "EM risk"], ["KOSDAQ Growth", "Materials"], ["UUP", "EWY"], ["005930.KS", "000660.KS"], "Review FX-sensitive exposure and stagger accumulation.", "Tactical", 68),
  risk("Rate Shock Alert", "Red", "US 10Y and real yield rise together", ["Growth Equity", "Bonds"], ["Technology", "Utilities"], ["QQQ", "TLT"], ["NVDA", "MSFT"], "Do not expand duration-sensitive exposure; rebalance to quality cash-flow names.", "Tactical", 82),
  risk("Liquidity Deterioration Alert", "Orange", "Net liquidity proxy falls while credit spreads widen", ["Equity", "Credit"], ["Small Cap", "Cyclicals"], ["IWM", "HYG"], ["Small-cap watchlist"], "Raise quality threshold and keep cash buffer.", "Tactical", 71),
  risk("Crowded Trade Alert", "Yellow", "Leader contribution above 50% in a theme", ["Theme ETFs", "Quality Growth"], ["Semiconductor", "AI"], ["SMH", "SOXX"], ["NVDA", "000660.KS"], "Prefer diversified ETF or secondary quality leaders over single-name concentration.", "Tactical", 69),
  risk("Mid/Small Cap Liquidity Alert", "Orange", "Trading value falls below position-size threshold", ["Mid/Small Cap"], ["KOSDAQ", "Small Cap"], ["IWM"], ["454910.KQ", "141080.KQ"], "Limit position sizing and require liquidity confirmation before accumulation.", "Fundamental", 64)
];

const portfolioBuckets: PortfolioBucket[] = [
  bucket("Core Quality", 38, 30, 45, 86, "Quality score below 75 or valuation percentile above 90%", "Core should be earnings-visible, liquid, and balance-sheet resilient."),
  bucket("Satellite Growth", 16, 8, 22, 72, "Growth revision breadth weakens or real yields spike", "Use position sizing; avoid turning satellite into hidden core."),
  bucket("Satellite Mid/Small Cap", 9, 4, 14, 58, "Liquidity score drops or governance risk rises", "Only quality small caps with cash-flow visibility deserve capital."),
  bucket("Commodity/Resource", 9, 3, 15, 68, "Commodity trend reverses or dollar shock accelerates", "Use as macro hedge, not permanent core exposure."),
  bucket("Sector ETF", 12, 5, 18, 74, "Sector score falls below 55 or correlation spikes", "ETF sleeves express top-down views with lower single-name risk."),
  bucket("Cash/Bonds", 16, 8, 28, 62, "Risk assets reset or duration fit improves", "Cash is dry powder for quality names; bonds remain duration-sensitive.")
];

const myWatchlist: WatchlistItem[] = [
  { asset: "QUAL", type: "ETF", region: "US", currentWeight: 6, targetWeight: 8, suggestedWeight: 8, currentAction: "Overweight", currentScore: 76, macroSensitivity: "Real yield down / quality spread stable", dataStatus: "Modeled", rebalanceNeeded: "Add on weakness", keyRisk: "Quality factor crowding" },
  { asset: "SMH", type: "ETF", region: "US", currentWeight: 6, targetWeight: 6, suggestedWeight: 5, currentAction: "Neutral+", currentScore: 74, macroSensitivity: "Real yield and crowded AI trade", dataStatus: "Modeled", rebalanceNeeded: "No chase", keyRisk: "Valuation and drawdown risk" },
  { asset: "PAVE", type: "ETF", region: "US", currentWeight: 3, targetWeight: 4, suggestedWeight: 4, currentAction: "Overweight", currentScore: 71, macroSensitivity: "Infrastructure cycle / rates", dataStatus: "Modeled", rebalanceNeeded: "Accumulate", keyRisk: "Infrastructure cycle slowdown" },
  { asset: "000660.KS", type: "Stock", region: "Korea", currentWeight: 4, targetWeight: 5, suggestedWeight: 5, currentAction: "Accumulate", currentScore: 84, macroSensitivity: "USD/KRW, HBM export cycle", dataStatus: "Modeled", rebalanceNeeded: "Maintain target", keyRisk: "HBM crowding" },
  { asset: "NVDA", type: "Stock", region: "US", currentWeight: 5, targetWeight: 5, suggestedWeight: 4, currentAction: "Core Hold", currentScore: 92, macroSensitivity: "Real yield, AI capex revisions", dataStatus: "Modeled", rebalanceNeeded: "Position sizing", keyRisk: "Valuation expectations" },
  { asset: "Copper", type: "Commodity", region: "Global", currentWeight: 2, targetWeight: 3, suggestedWeight: 3, currentAction: "Neutral+", currentScore: 69, macroSensitivity: "China PMI and DXY", dataStatus: "Modeled", rebalanceNeeded: "Wait for China confirmation", keyRisk: "China demand miss" },
  { asset: "Gold", type: "Commodity", region: "Global", currentWeight: 3, targetWeight: 3, suggestedWeight: 3, currentAction: "Neutral+", currentScore: 68, macroSensitivity: "Real yield, dollar, policy risk", dataStatus: "Modeled", rebalanceNeeded: "Hedge sleeve", keyRisk: "Real yield rebound" }
];

const macroSnapshotConfigs: MacroMetricConfig[] = [
  { id: "us-2y", label: "US 2Y Yield", category: "Rates", fallbackValue: 4.82, unit: "%", change5d: 8, change20d: 21, regimeImpact: "Higher policy-rate pressure; softens Goldilocks confidence.", sectorImpact: "Growth valuation pressure; banks relative support.", source: "FRED" },
  { id: "us-10y", label: "US 10Y Yield", category: "Rates", fallbackValue: 4.51, unit: "%", change5d: 11, change20d: 24, regimeImpact: "Rate shock risk if it rises with real yields.", sectorImpact: "Duration-sensitive growth and TLT pressured.", source: "FRED" },
  { id: "real-yield-10y", label: "US 10Y Real Yield", category: "Rates", fallbackValue: 2.14, unit: "%", change5d: 10, change20d: 18, regimeImpact: "Real-yield rebound lowers equity multiple tolerance.", sectorImpact: "QQQ/SMH valuation discipline; quality cash-flow preferred.", source: "FRED" },
  { id: "yield-10y-2y", label: "10Y-2Y Spread", category: "Rates", fallbackValue: -31, unit: "bp", change5d: 5, change20d: 11, regimeImpact: "Less inversion hints late-cycle normalization.", sectorImpact: "Banks improve if steepening is growth-led.", source: "Internal calculation" },
  { id: "dxy", label: "DXY", category: "FX", fallbackValue: 104.8, unit: "pt", change5d: 0.9, change20d: 1.6, regimeImpact: "Dollar strength tightens global liquidity.", sectorImpact: "EM/Korea pressure; exporters need margin check.", source: "ICE", status: "Fallback" },
  { id: "usd-krw", label: "USD/KRW", category: "FX", fallbackValue: 1378.2, unit: "KRW", change5d: 1.3, change20d: 2.4, regimeImpact: "KRW weakness lowers Korea flow confidence.", sectorImpact: "KOSDAQ growth pressure; large exporters mixed.", source: "Bank of Korea" },
  { id: "vix", label: "VIX", category: "Volatility", fallbackValue: 14.9, unit: "pt", change5d: 12.4, change20d: 6.8, regimeImpact: "Risk appetite still usable but watch vol impulse.", sectorImpact: "High-beta sleeves need sizing discipline.", source: "CBOE" },
  { id: "move", label: "MOVE", category: "Volatility", fallbackValue: 104.1, unit: "pt", change5d: 7.1, change20d: 9.8, regimeImpact: "Rates volatility is the main macro stress point.", sectorImpact: "Long-duration equities and bond ETFs vulnerable.", source: "ICE/BofA", status: "Fallback" },
  { id: "hy-oas", label: "HY OAS", category: "Credit", fallbackValue: 335, unit: "bp", change5d: 9, change20d: 18, regimeImpact: "Credit is not flashing crisis, but spread widening caps beta.", sectorImpact: "Quality preference over levered small caps.", source: "FRED" },
  { id: "net-liquidity", label: "Net Liquidity", category: "Liquidity", fallbackValue: 6.08, unit: "tn USD", change5d: -0.4, change20d: -1.2, regimeImpact: "Liquidity drag argues against aggressive beta expansion.", sectorImpact: "Cash/BIL buffer and quality bias.", source: "Fed - TGA - RRP" },
  { id: "wti", label: "WTI", category: "Commodities", fallbackValue: 79.4, unit: "USD", change5d: 2.8, change20d: 4.1, regimeImpact: "Energy strength raises reflation tail risk.", sectorImpact: "XLE positive; long-duration growth inflation risk.", source: "CME proxy", status: "Modeled" },
  { id: "copper", label: "Copper", category: "Commodities", fallbackValue: 4.78, unit: "USD/lb", change5d: 3.4, change20d: 7.2, regimeImpact: "Copper strength supports reflation and capex cycle.", sectorImpact: "COPX, industrials, power equipment positive.", source: "LME/CME proxy", status: "Modeled" },
  { id: "gold", label: "Gold", category: "Commodities", fallbackValue: 2378, unit: "USD", change5d: 1.8, change20d: 5.6, regimeImpact: "Gold bid hedges rate, FX, and policy uncertainty.", sectorImpact: "GLD/IAU hedge; GDX higher beta.", source: "LBMA/CME proxy", status: "Modeled" },
  { id: "kr-export-20d", label: "Korea Export Growth", category: "Korea Macro", fallbackValue: 11.8, unit: "% YoY", change5d: 0.8, change20d: 2.6, regimeImpact: "Constructive Korea export cycle supports quality large caps.", sectorImpact: "Semiconductor, shipbuilding, power equipment.", source: "Korea Customs Service" },
  { id: "china-pmi", label: "China PMI", category: "Growth", fallbackValue: 49.5, unit: "pt", change5d: -0.2, change20d: 0.4, regimeImpact: "China demand still confirmation variable for reflation.", sectorImpact: "Materials and Korea cyclicals need selectivity.", source: "NBS/Caixin proxy", status: "Modeled" }
];

const ratesMonitorMetrics: MacroMetricConfig[] = [
  { id: "us-3m", label: "US 3M Yield", category: "Rates", fallbackValue: 5.38, unit: "%", change5d: 1, change20d: 3, regimeImpact: "Cash yield remains high.", sectorImpact: "Cash/BIL remains competitive.", source: "FRED", status: "Modeled" },
  ...macroSnapshotConfigs.filter((item) => ["us-2y", "us-10y", "real-yield-10y", "yield-10y-2y", "move"].includes(item.id)),
  { id: "us-30y", label: "US 30Y Yield", category: "Rates", fallbackValue: 4.66, unit: "%", change5d: 10, change20d: 22, regimeImpact: "Long-end term premium is rising.", sectorImpact: "Duration and rate-sensitive defensives pressured.", source: "FRED" },
  { id: "real-yield-5y", label: "US 5Y Real Yield", category: "Rates", fallbackValue: 2.02, unit: "%", change5d: 8, change20d: 14, regimeImpact: "Real yield pressure is broad.", sectorImpact: "Expensive growth needs valuation discipline.", source: "FRED proxy", status: "Modeled" },
  { id: "bei-5y", label: "5Y Breakeven Inflation", category: "Inflation", fallbackValue: 2.42, unit: "%", change5d: 4, change20d: 10, regimeImpact: "Inflation expectations are firming.", sectorImpact: "Energy/materials hedge value rises.", source: "FRED proxy", status: "Modeled" },
  { id: "bei-10y", label: "10Y Breakeven Inflation", category: "Inflation", fallbackValue: 2.37, unit: "%", change5d: 3, change20d: 8, regimeImpact: "Inflation risk not fully gone.", sectorImpact: "Long-duration multiple expansion capped.", source: "FRED" },
  { id: "yield-10y-3m", label: "10Y-3M Spread", category: "Rates", fallbackValue: -87, unit: "bp", change5d: 7, change20d: 16, regimeImpact: "Curve remains recession-sensitive.", sectorImpact: "Keep quality bias until curve signal improves.", source: "Internal calculation", status: "Modeled" },
  { id: "kr-3y", label: "Korea 3Y KTB", category: "Rates", fallbackValue: 3.42, unit: "%", change5d: 5, change20d: 12, regimeImpact: "Domestic rates are a valuation constraint.", sectorImpact: "KOSDAQ growth and long-duration themes pressured.", source: "Bank of Korea" },
  { id: "kr-10y", label: "Korea 10Y KTB", category: "Rates", fallbackValue: 3.61, unit: "%", change5d: 8, change20d: 15, regimeImpact: "Korea long rates follow global pressure.", sectorImpact: "Export large caps preferred to speculative growth.", source: "Bank of Korea" },
  { id: "cd-rate", label: "CD Rate", category: "Rates", fallbackValue: 3.58, unit: "%", change5d: 0, change20d: 2, regimeImpact: "Funding cost remains sticky.", sectorImpact: "Levered small caps need caution.", source: "KOFIA proxy", status: "Modeled" },
  { id: "kofr", label: "KOFR", category: "Rates", fallbackValue: 3.49, unit: "%", change5d: 1, change20d: 1, regimeImpact: "Short-term KRW funding stable.", sectorImpact: "No immediate funding stress.", source: "Korea Securities Depository proxy", status: "Modeled" }
];

const inflationMonitorMetrics: MacroMetricConfig[] = [
  { id: "cpi", label: "US CPI", category: "Inflation", fallbackValue: 3.4, unit: "% YoY", change5d: -0.1, change20d: -0.2, regimeImpact: "Disinflation supports Goldilocks if services cool.", sectorImpact: "Quality growth can hold multiple if real yields calm.", source: "BLS" },
  { id: "core-cpi", label: "US Core CPI", category: "Inflation", fallbackValue: 3.6, unit: "% YoY", change5d: -0.1, change20d: -0.2, regimeImpact: "Core services remain key for Fed path.", sectorImpact: "Rate-sensitive sectors watch shelter/services.", source: "BLS" },
  { id: "pce", label: "US PCE", category: "Inflation", fallbackValue: 2.7, unit: "% YoY", change5d: -0.1, change20d: -0.1, regimeImpact: "Fed-preferred inflation is easing slowly.", sectorImpact: "Supports quality bias, not broad beta.", source: "BEA" },
  { id: "core-pce", label: "US Core PCE", category: "Inflation", fallbackValue: 2.8, unit: "% YoY", change5d: 0, change20d: -0.1, regimeImpact: "Sticky core keeps cuts uncertain.", sectorImpact: "Long-duration exposure should be paced.", source: "BEA" },
  { id: "ppi", label: "PPI", category: "Inflation", fallbackValue: 2.2, unit: "% YoY", change5d: 0.1, change20d: 0.3, regimeImpact: "Pipeline inflation risk is modest.", sectorImpact: "Margins need monitoring in cyclicals.", source: "BLS proxy", status: "Modeled" },
  { id: "ahe", label: "Average Hourly Earnings", category: "Inflation", fallbackValue: 4.0, unit: "% YoY", change5d: 0, change20d: -0.1, regimeImpact: "Wage pressure is a services-inflation input.", sectorImpact: "Consumer margin sensitivity.", source: "BLS proxy", status: "Modeled" },
  { id: "eci", label: "ECI", category: "Inflation", fallbackValue: 4.2, unit: "% YoY", change5d: 0, change20d: -0.2, regimeImpact: "Labor cost trend still above pre-Covid norm.", sectorImpact: "Margin quality matters.", source: "BLS proxy", status: "Modeled" },
  { id: "shelter-cpi", label: "Shelter CPI", category: "Inflation", fallbackValue: 5.5, unit: "% YoY", change5d: -0.1, change20d: -0.3, regimeImpact: "Shelter deceleration is key disinflation evidence.", sectorImpact: "If sticky, rate-sensitive ETFs stay capped.", source: "BLS proxy", status: "Modeled" },
  ...macroSnapshotConfigs.filter((item) => ["wti"].includes(item.id)),
  { id: "gasoline", label: "Gasoline", category: "Inflation", fallbackValue: 3.62, unit: "USD/gal", change5d: 1.2, change20d: 3.5, regimeImpact: "Energy pass-through can lift inflation expectations.", sectorImpact: "Consumer and transports margin watch.", source: "EIA proxy", status: "Modeled" },
  ...ratesMonitorMetrics.filter((item) => ["bei-5y", "bei-10y"].includes(item.id)),
  { id: "michigan-inflation", label: "Michigan Inflation Expectation", category: "Inflation", fallbackValue: 3.3, unit: "%", change5d: 0.1, change20d: 0.2, regimeImpact: "Inflation expectations are the Fed communication risk.", sectorImpact: "Long-duration growth multiple risk.", source: "University of Michigan proxy", status: "Modeled" }
];

const growthMonitorMetrics: MacroMetricConfig[] = [
  { id: "ism-mfg", label: "ISM Manufacturing", category: "Growth", fallbackValue: 49.8, unit: "pt", change5d: -0.5, change20d: -0.8, regimeImpact: "Manufacturing is soft; Goldilocks needs services/export offset.", sectorImpact: "Industrials/materials need confirmation.", source: "ISM", status: "Fallback" },
  { id: "ism-services", label: "ISM Services", category: "Growth", fallbackValue: 52.1, unit: "pt", change5d: 0.6, change20d: 1.1, regimeImpact: "Services growth still supports soft landing.", sectorImpact: "Quality consumer and software resilience.", source: "ISM", status: "Fallback" },
  { id: "ism-new-orders", label: "ISM New Orders", category: "Growth", fallbackValue: 51.1, unit: "pt", change5d: 0.4, change20d: 0.8, regimeImpact: "New orders stabilize the manufacturing cycle.", sectorImpact: "Industrials need sustained confirmation.", source: "ISM proxy", status: "Modeled" },
  { id: "ism-employment", label: "ISM Employment", category: "Growth", fallbackValue: 48.6, unit: "pt", change5d: -0.3, change20d: -0.6, regimeImpact: "Labor components are cooling.", sectorImpact: "Supports lower-rate optionality if inflation allows.", source: "ISM proxy", status: "Modeled" },
  { id: "ism-prices", label: "ISM Prices", category: "Inflation", fallbackValue: 60.9, unit: "pt", change5d: 1.8, change20d: 4.4, regimeImpact: "Prices paid raise reflation risk.", sectorImpact: "Materials/energy hedge value rises; growth multiples capped.", source: "ISM proxy", status: "Modeled" },
  { id: "pmi", label: "PMI", category: "Growth", fallbackValue: 51.2, unit: "pt", change5d: 0.4, change20d: 0.9, regimeImpact: "Composite cycle is mildly expansionary.", sectorImpact: "Keep cyclicals selective.", source: "S&P Global proxy", status: "Modeled" },
  { id: "retail-sales", label: "Retail Sales", category: "Growth", fallbackValue: 0.4, unit: "% MoM", change5d: 0.3, change20d: 0.4, regimeImpact: "Consumer is not rolling over.", sectorImpact: "Discretionary quality remains investable.", source: "US Census" },
  { id: "industrial-production", label: "Industrial Production", category: "Growth", fallbackValue: 0.1, unit: "% MoM", change5d: 0.1, change20d: 0.2, regimeImpact: "Industrial cycle stabilizing.", sectorImpact: "XLI/PAVE support.", source: "Federal Reserve proxy", status: "Modeled" },
  { id: "payrolls", label: "Nonfarm Payrolls", category: "Growth", fallbackValue: 175, unit: "k", change5d: -12, change20d: -28, regimeImpact: "Labor cooling without collapse supports soft landing.", sectorImpact: "Quality growth more resilient than deep cyclicals.", source: "BLS proxy", status: "Modeled" },
  { id: "unemployment", label: "Unemployment Rate", category: "Growth", fallbackValue: 3.9, unit: "%", change5d: 0.1, change20d: 0.2, regimeImpact: "Labor slack is rising gently.", sectorImpact: "Watch credit and small caps if acceleration occurs.", source: "BLS" },
  { id: "jolts", label: "JOLTS", category: "Growth", fallbackValue: 8488, unit: "k", change5d: -80, change20d: -260, regimeImpact: "Labor demand normalizing.", sectorImpact: "Rate-cut optionality if inflation cooperates.", source: "BLS proxy", status: "Modeled" },
  { id: "kr-export-20d", label: "Korea Export Growth", category: "Korea Macro", fallbackValue: 11.8, unit: "% YoY", change5d: 0.8, change20d: 2.6, regimeImpact: "Korea export cycle constructive.", sectorImpact: "Semis and power equipment favored.", source: "Korea Customs Service" },
  { id: "kr-semi-export", label: "Korea Semiconductor Export", category: "Korea Macro", fallbackValue: 45.5, unit: "% YoY", change5d: 2.1, change20d: 8.8, regimeImpact: "AI memory cycle supports Korea allocation.", sectorImpact: "Samsung Electronics, SK Hynix, HBM equipment.", source: "Korea Customs proxy", status: "Modeled" },
  { id: "china-pmi", label: "China Manufacturing PMI", category: "Growth", fallbackValue: 49.5, unit: "pt", change5d: -0.2, change20d: 0.4, regimeImpact: "China demand is still not a clean tailwind.", sectorImpact: "Materials and Korea cyclicals need confirmation.", source: "NBS/Caixin proxy", status: "Modeled" },
  { id: "china-services-pmi", label: "China Services PMI", category: "Growth", fallbackValue: 51.2, unit: "pt", change5d: 0.3, change20d: 0.6, regimeImpact: "Domestic China services steadier than manufacturing.", sectorImpact: "Commodity demand still mixed.", source: "NBS/Caixin proxy", status: "Modeled" },
  ...macroSnapshotConfigs.filter((item) => ["copper"].includes(item.id)),
  { id: "iron-ore", label: "Iron Ore", category: "Commodities", fallbackValue: 118, unit: "USD/t", change5d: 1.5, change20d: 3.2, regimeImpact: "China steel demand proxy is improving but not decisive.", sectorImpact: "Steel/materials still selective.", source: "SGX proxy", status: "Modeled" },
  { id: "china-property-steel", label: "China property / steel / iron ore proxy", category: "Growth", fallbackValue: 46.8, unit: "index", change5d: 0.6, change20d: 1.4, regimeImpact: "China fixed-asset demand is still below expansion threshold.", sectorImpact: "Materials rebound needs confirmation.", source: "Internal China demand proxy", status: "Modeled" },
  { id: "oecd-cli", label: "OECD CLI", category: "Growth", fallbackValue: 100.3, unit: "pt", change5d: 0.1, change20d: 0.4, regimeImpact: "Global cycle is stabilizing.", sectorImpact: "Supports diversified cyclicals only with quality screens.", source: "OECD proxy", status: "Modeled" }
];

const liquidityCreditMetrics: MacroMetricConfig[] = [
  { id: "fed-assets", label: "Fed Balance Sheet", category: "Liquidity", fallbackValue: 7.28, unit: "tn USD", change5d: -0.3, change20d: -1.4, regimeImpact: "Balance-sheet runoff is a liquidity headwind.", sectorImpact: "Equity beta needs confirmation.", source: "Federal Reserve H.4.1" },
  { id: "tga", label: "TGA", category: "Liquidity", fallbackValue: 0.78, unit: "tn USD", change5d: 3.4, change20d: 8.1, regimeImpact: "TGA rebuild drains private liquidity.", sectorImpact: "Small/mid caps vulnerable.", source: "US Treasury" },
  { id: "rrp", label: "RRP", category: "Liquidity", fallbackValue: 0.42, unit: "tn USD", change5d: -4.3, change20d: -8.7, regimeImpact: "RRP decline offsets some liquidity drain.", sectorImpact: "Liquidity backdrop mixed.", source: "New York Fed" },
  ...macroSnapshotConfigs.filter((item) => ["net-liquidity", "hy-oas", "vix", "move"].includes(item.id)),
  { id: "fci", label: "Financial Conditions Index", category: "Liquidity", fallbackValue: -0.18, unit: "z", change5d: 0.06, change20d: 0.12, regimeImpact: "Conditions are tightening from easy levels.", sectorImpact: "Reduce low-quality beta.", source: "Chicago Fed proxy", status: "Modeled" },
  { id: "ig-oas", label: "IG Spread", category: "Credit", fallbackValue: 91, unit: "bp", change5d: 4, change20d: 9, regimeImpact: "Investment-grade credit is stable but not improving.", sectorImpact: "Quality credit signal neutral.", source: "FRED" },
  { id: "ccc-oas", label: "CCC Spread", category: "Credit", fallbackValue: 930, unit: "bp", change5d: 18, change20d: 44, regimeImpact: "Weakest credit cohorts are deteriorating.", sectorImpact: "Avoid levered small caps.", source: "FRED proxy", status: "Modeled" },
  { id: "put-call", label: "Put/Call Ratio", category: "Volatility", fallbackValue: 0.82, unit: "x", change5d: 0.05, change20d: 0.08, regimeImpact: "Hedging demand is rising but not extreme.", sectorImpact: "Keep rebalance discipline.", source: "CBOE" }
];

const fxKoreaMetrics: MacroMetricConfig[] = [
  ...macroSnapshotConfigs.filter((item) => ["dxy", "usd-krw"].includes(item.id)),
  { id: "usd-cnh", label: "USD/CNH", category: "FX", fallbackValue: 7.24, unit: "CNH", change5d: 0.4, change20d: 0.8, regimeImpact: "China FX pressure tightens Asia risk appetite.", sectorImpact: "Korea cyclicals and materials need caution.", source: "PBOC/market proxy", status: "Modeled" },
  { id: "usd-jpy", label: "USD/JPY", category: "FX", fallbackValue: 156.3, unit: "JPY", change5d: 0.7, change20d: 1.9, regimeImpact: "JPY weakness can spill into Asia FX volatility.", sectorImpact: "Exporters mixed; imported cost pressure.", source: "Bank of Japan" },
  { id: "foreign-kospi-flow", label: "Foreign Net Buying KOSPI", category: "Korea Macro", fallbackValue: -3840, unit: "KRW bn", change5d: -6200, change20d: -11300, regimeImpact: "Foreign flow pressure lowers Korea confidence.", sectorImpact: "Large-cap allocation should be staged.", source: "KRX", status: "Stale" },
  { id: "foreign-kosdaq-flow", label: "Foreign Net Buying KOSDAQ", category: "Korea Macro", fallbackValue: -620, unit: "KRW bn", change5d: -1800, change20d: -3600, regimeImpact: "KOSDAQ growth risk elevated.", sectorImpact: "Avoid low-liquidity speculative growth.", source: "KRX proxy", status: "Stale" },
  { id: "institution-flow", label: "Institution Net Buying", category: "Korea Macro", fallbackValue: 1260, unit: "KRW bn", change5d: 2100, change20d: 4200, regimeImpact: "Institution support offsets some foreign selling.", sectorImpact: "Quality large caps preferred.", source: "KRX", status: "Stale" },
  ...macroSnapshotConfigs.filter((item) => ["kr-export-20d"].includes(item.id)),
  { id: "kr-semi-export", label: "Semiconductor Export Proxy", category: "Korea Macro", fallbackValue: 45.5, unit: "% YoY", change5d: 2.1, change20d: 8.8, regimeImpact: "HBM/export cycle supports Korea quality tech.", sectorImpact: "Semis and power equipment.", source: "Korea Customs proxy", status: "Modeled" }
];

const commodityMacroMetrics: MacroMetricConfig[] = [
  ...macroSnapshotConfigs.filter((item) => ["wti", "copper", "gold"].includes(item.id)),
  { id: "gasoline", label: "Gasoline", category: "Commodities", fallbackValue: 3.62, unit: "USD/gal", change5d: 1.2, change20d: 3.5, regimeImpact: "Gasoline can lift inflation expectations.", sectorImpact: "Consumer and transport margins need monitoring.", source: "EIA proxy", status: "Modeled" },
  { id: "iron-ore", label: "Iron Ore", category: "Commodities", fallbackValue: 118, unit: "USD/t", change5d: 1.5, change20d: 3.2, regimeImpact: "China steel demand proxy is improving but not decisive.", sectorImpact: "Steel/materials still selective.", source: "SGX proxy", status: "Modeled" },
  { id: "uranium", label: "Uranium", category: "Commodities", fallbackValue: 91, unit: "USD/lb", change5d: 2.1, change20d: 5.4, regimeImpact: "Nuclear fuel tightness supports resource satellite.", sectorImpact: "URA/URNM and nuclear equipment positive.", source: "UxC proxy", status: "Modeled" }
];

const macroMonitorSections: MacroMonitorConfig[] = [
  {
    title: "Rates & Yield Curve Dashboard",
    eyebrow: "Rates",
    metrics: ratesMonitorMetrics,
    interpretation: {
      "Rate Direction": "Rising, led by real yields and long-end term premium.",
      "Curve Signal": "Bear steepening: growth is not collapsing, but discount rates are rising.",
      "Real Yield Signal": "Restrictive; keep valuation discipline for long-duration growth.",
      "Growth Stock Impact": "Add only on weakness; avoid chasing high-multiple breakouts.",
      "Bond ETF Impact": "TLT underweight, IEF neutral-, BIL remains useful dry powder.",
      "Sector Impact": "Banks/quality financials improve; utilities and speculative growth lag.",
      "Suggested Investor Action": "Maintain quality bias, stagger semiconductor/AI accumulation, keep duration small."
    }
  },
  {
    title: "Inflation Monitor",
    eyebrow: "Inflation",
    metrics: inflationMonitorMetrics,
    interpretation: {
      "Inflation Direction": "Disinflation is intact but energy and breakevens are firming.",
      "Disinflation Confidence": "Medium: core PCE is improving slowly, shelter still matters.",
      "Reflation Risk": "Medium: WTI, gasoline, and copper are the swing factors.",
      "Rate Impact": "Cuts delayed if expectations rise; real-yield relief is required for multiple expansion.",
      "Sector Impact": "Energy/materials hedge value rises; expensive growth needs patience.",
      "ETF Impact": "XLE/COPX useful as hedge; QQQ/SMH should be accumulated selectively.",
      "Suggested Investor Action": "Keep Goldilocks base case but size for reflation tail risk."
    }
  },
  {
    title: "Growth & Cycle Monitor",
    eyebrow: "Growth",
    metrics: growthMonitorMetrics,
    interpretation: {
      "Growth Direction": "Mixed but not recessionary: services and Korea exports offset soft manufacturing.",
      "US Cycle Signal": "Soft landing remains plausible; labor demand is cooling.",
      "Korea Export Cycle": "Constructive, led by semiconductor and power-equipment demand.",
      "China Demand Signal": "Still an incomplete tailwind; copper needs China PMI confirmation.",
      "Sector Impact": "Prefer semis, power equipment, quality industrials; be selective in materials.",
      "ETF Impact": "PAVE, GRID, SMH fit; COPX needs China confirmation.",
      "Suggested Investor Action": "Use pullbacks to build quality cyclicals with visible orders."
    }
  },
  {
    title: "Liquidity & Credit Monitor",
    eyebrow: "Liquidity & Credit",
    metrics: liquidityCreditMetrics,
    interpretation: {
      "Liquidity Direction": "Mildly negative: Fed runoff and TGA rebuild offset RRP decline.",
      "Credit Stress Level": "Moderate: HY/CCC spreads are wider but not crisis-level.",
      "Risk Appetite": "Selective risk-on, not broad beta expansion.",
      "Equity Beta Signal": "Prefer quality and liquidity over small-cap leverage.",
      "Small/Mid Cap Signal": "Screen hard for cash flow, governance, and trading value.",
      "Cash Buffer Signal": "Maintain BIL/cash buffer for valuation resets.",
      "Suggested Investor Action": "Do not over-allocate to illiquid mid/small caps until spreads and flow improve."
    }
  },
  {
    title: "FX & Korea Sensitivity Monitor",
    eyebrow: "FX & Korea",
    metrics: fxKoreaMetrics,
    interpretation: {
      "KRW Risk": "Elevated: USD/KRW strength is a Korea-equity headwind.",
      "Foreign Flow Pressure": "Negative until KRX flow endpoints and actual net-buying improve.",
      "Korea Equity Impact": "Large exporters hold better than domestic-duration growth.",
      "KOSDAQ Growth Impact": "High sensitivity to KRW, rates, and liquidity.",
      "Export Large Cap Impact": "Semis and power equipment still supported by export cycle.",
      "Sector Impact": "Favor HBM, power equipment, shipbuilding quality; avoid weak balance-sheet growth.",
      "Suggested Investor Action": "Stage Korea accumulation and keep FX-sensitive risk under review."
    }
  },
  {
    title: "Commodities Monitor",
    eyebrow: "Commodities",
    metrics: commodityMacroMetrics,
    interpretation: {
      "Commodity Direction": "Copper, gold, and uranium are firm; oil is constructive but volatile.",
      "Inflation Link": "Energy and gasoline are the direct inflation swing factors.",
      "China Demand Signal": "Copper and iron ore require China PMI/property confirmation.",
      "Sector Impact": "Power equipment, infrastructure, and selected resource equities stay favored.",
      "ETF Impact": "PAVE/GRID preferred; COPX/URA/URNM as satellite sleeves.",
      "Suggested Investor Action": "Keep commodity beta sized as hedge, not core equity replacement."
    }
  }
];

const macroIssues: MacroIssue[] = [
  {
    severity: "High",
    title: "US real yield rebound",
    category: "Rates",
    relatedIndicators: ["US 10Y Real Yield", "US 10Y Yield", "DXY"],
    affectedAssetClasses: ["US Equity", "Semiconductor/AI", "Bonds"],
    affectedSectors: ["Growth", "Semiconductor", "Utilities"],
    affectedEtfs: ["QQQ", "SMH", "SOXX", "TLT"],
    affectedStocks: ["NVDA", "MSFT", "000660.KS"],
    interpretation: "Higher real yields pressure long-duration valuation even if earnings quality remains strong.",
    suggestedAction: "Add only on weakness; keep valuation discipline and avoid oversized duration exposure.",
    source: "FRED / ICE",
    timestamp: "2026-05-17 09:10 KST",
    dataStatus: "Modeled"
  },
  {
    severity: "High",
    title: "USD/KRW breakout risk",
    category: "FX",
    relatedIndicators: ["DXY", "USD/KRW", "Foreign Net Buying KOSPI"],
    affectedAssetClasses: ["Korea Equity", "KOSDAQ Growth"],
    affectedSectors: ["Semiconductor", "KOSDAQ Growth", "FX-sensitive"],
    affectedEtfs: ["EWY", "Korea quality basket"],
    affectedStocks: ["005930.KS", "000660.KS", "454910.KQ"],
    interpretation: "KRW weakness can delay foreign inflows and compress Korea growth multiples.",
    suggestedAction: "Stagger accumulation and favor export quality over low-quality domestic growth.",
    source: "Bank of Korea / KRX",
    timestamp: "2026-05-17 09:10 KST",
    dataStatus: "Stale"
  },
  {
    severity: "Medium",
    title: "Copper strength needs China confirmation",
    category: "Commodities",
    relatedIndicators: ["Copper", "China PMI", "Korea Export Growth"],
    affectedAssetClasses: ["Commodity Equity", "Korea Cyclicals"],
    affectedSectors: ["Materials", "Industrials", "Power Equipment"],
    affectedEtfs: ["COPX", "PAVE", "GRID"],
    affectedStocks: ["FCX", "SCCO", "HD Hyundai Electric"],
    interpretation: "Copper momentum supports reflation hedge, but China PMI is not yet a clean green light.",
    suggestedAction: "Maintain Neutral+ commodity sleeve; prefer power equipment quality leaders.",
    source: "CME/LME proxy / China PMI",
    timestamp: "2026-05-17 09:10 KST",
    dataStatus: "Modeled"
  },
  {
    severity: "Medium",
    title: "Liquidity drag from TGA rebuild",
    category: "Liquidity",
    relatedIndicators: ["Fed Balance Sheet", "TGA", "RRP", "Net Liquidity"],
    affectedAssetClasses: ["Equity Beta", "Small/Mid Cap", "Cash"],
    affectedSectors: ["Small Cap", "Cyclicals", "Speculative Growth"],
    affectedEtfs: ["IWM", "BIL", "QUAL"],
    affectedStocks: ["Mid/small quality watchlist"],
    interpretation: "Net liquidity is not supportive enough for broad beta expansion.",
    suggestedAction: "Keep cash buffer and raise quality threshold for new positions.",
    source: "Federal Reserve / Treasury / NY Fed",
    timestamp: "2026-05-17 09:10 KST",
    dataStatus: "Live"
  }
];

const macroEvents: MacroEvent[] = [
  { date: "2026-05-20", time: "21:30 KST", country: "US", event: "CPI", consensus: "0.3% MoM", previous: "0.4% MoM", actual: "-", importance: "High", likelyMarketImpact: "Real yields and QQQ/SMH multiples", assetsToWatch: "QQQ, SMH, TLT, DXY", positioningNote: "Do not add high-multiple exposure before print unless position size is small." },
  { date: "2026-05-21", time: "03:00 KST", country: "US", event: "FOMC minutes", consensus: "-", previous: "-", actual: "-", importance: "High", likelyMarketImpact: "Rate-cut timing and real-yield path", assetsToWatch: "TLT, IEF, QQQ, Gold", positioningNote: "Watch language on inflation confidence and balance-sheet runoff." },
  { date: "2026-05-21", time: "09:00 KST", country: "Korea", event: "Korea export 1-20 days", consensus: "+10% YoY", previous: "+11.8% YoY", actual: "-", importance: "High", likelyMarketImpact: "Korea semis and export large caps", assetsToWatch: "005930.KS, 000660.KS, PAVE/GRID themes", positioningNote: "Use confirmation for Korea quality accumulation." },
  { date: "2026-05-22", time: "21:30 KST", country: "US", event: "PCE", consensus: "+0.2% MoM", previous: "+0.3% MoM", actual: "-", importance: "High", likelyMarketImpact: "Fed path, real yields, quality growth multiples", assetsToWatch: "QQQ, QUAL, TLT, GLD", positioningNote: "If core PCE cools, add quality growth gradually rather than chase beta." },
  { date: "2026-05-23", time: "21:30 KST", country: "US", event: "Retail Sales", consensus: "+0.3% MoM", previous: "+0.4% MoM", actual: "-", importance: "Medium", likelyMarketImpact: "Soft-landing and consumer quality", assetsToWatch: "SPY, XLY, VIG", positioningNote: "Weak print with lower yields may help quality growth." },
  { date: "2026-05-24", time: "TBD", country: "US", event: "Fed speeches", consensus: "-", previous: "-", actual: "-", importance: "Medium", likelyMarketImpact: "Rate-cut timing and dollar tone", assetsToWatch: "US 2Y, DXY, TLT", positioningNote: "Hawkish inflation language supports cash buffer." },
  { date: "2026-05-27", time: "21:30 KST", country: "US", event: "GDP", consensus: "+1.8% QoQ SAAR", previous: "+1.6% QoQ SAAR", actual: "-", importance: "Medium", likelyMarketImpact: "Growth confidence and cyclicals", assetsToWatch: "SPY, XLI, COPX", positioningNote: "Growth upside with hot prices is reflationary, not pure Goldilocks." },
  { date: "2026-05-28", time: "10:00 KST", country: "Korea", event: "BOK rate decision", consensus: "Hold", previous: "Hold", actual: "-", importance: "High", likelyMarketImpact: "KRW, KOSDAQ growth, Korea duration", assetsToWatch: "USD/KRW, KOSDAQ, Korea growth names", positioningNote: "Watch FX comments more than headline rate." },
  { date: "2026-05-29", time: "TBD", country: "Japan", event: "BOJ", consensus: "Hold", previous: "Hold", actual: "-", importance: "Medium", likelyMarketImpact: "JPY, Asia FX, Korea sensitivity", assetsToWatch: "USD/JPY, USD/KRW, EWY", positioningNote: "JPY volatility can spill into Korea FX-sensitive exposure." },
  { date: "2026-05-29", time: "TBD", country: "Europe", event: "ECB", consensus: "Hold", previous: "Hold", actual: "-", importance: "Medium", likelyMarketImpact: "DXY and global duration", assetsToWatch: "DXY, Gold, TLT", positioningNote: "Dovish ECB can lift DXY and pressure EM/Korea." },
  { date: "2026-05-30", time: "10:30 KST", country: "China", event: "China PMI", consensus: "50.0", previous: "49.5", actual: "-", importance: "High", likelyMarketImpact: "Copper, materials, Korea cyclicals", assetsToWatch: "COPX, XLB, Korea materials", positioningNote: "Copper strength needs PMI confirmation." },
  { date: "2026-05-30", time: "After close", country: "US", event: "Big Tech earnings", consensus: "Positive AI capex commentary", previous: "-", actual: "-", importance: "High", likelyMarketImpact: "Mega-cap growth concentration", assetsToWatch: "QQQ, MSFT, NVDA, META", positioningNote: "Use earnings quality to confirm core holds; trim if guidance relies only on multiple expansion." },
  { date: "2026-05-31", time: "After close", country: "US/Korea", event: "Semiconductor earnings", consensus: "HBM demand strong", previous: "-", actual: "-", importance: "High", likelyMarketImpact: "AI memory and semiconductor ETF leadership", assetsToWatch: "SMH, SOXX, 000660.KS, AVGO", positioningNote: "Confirm backlog and margin durability before raising semiconductor concentration." },
  { date: "2026-06-01", time: "23:00 KST", country: "US", event: "ISM Manufacturing", consensus: "50.1", previous: "49.8", actual: "-", importance: "High", likelyMarketImpact: "Growth/reflation mix", assetsToWatch: "XLI, XLB, PAVE", positioningNote: "Sub-50 with price pressure is stagflationary." },
  { date: "2026-06-04", time: "23:00 KST", country: "US", event: "ISM Services", consensus: "52.0", previous: "52.1", actual: "-", importance: "High", likelyMarketImpact: "Soft landing and services inflation", assetsToWatch: "SPY, QQQ, DXY", positioningNote: "Prices-paid component matters for rate path." },
  { date: "2026-06-05", time: "21:30 KST", country: "US", event: "Payrolls", consensus: "180k", previous: "175k", actual: "-", importance: "High", likelyMarketImpact: "Rates, DXY, equity beta", assetsToWatch: "US 2Y, DXY, QQQ, IWM", positioningNote: "Hot payrolls plus wage pressure is negative for duration." },
  { date: "2026-06-12", time: "TBD", country: "OPEC", event: "OPEC policy meeting", consensus: "-", previous: "-", actual: "-", importance: "Medium", likelyMarketImpact: "Oil, inflation expectations, XLE", assetsToWatch: "WTI, XLE, XOP", positioningNote: "Treat oil spike as inflation risk, not pure growth signal." },
  { date: "Weekly", time: "23:30 KST", country: "US", event: "EIA inventory", consensus: "-", previous: "-", actual: "-", importance: "Medium", likelyMarketImpact: "Oil curve and energy equities", assetsToWatch: "WTI, XLE, OIH", positioningNote: "Inventory draw supports energy cash-flow sleeve." }
];

const macroImpactMap: MacroImpact[] = [
  { driver: "Real Yield Up", signal: "US 10Y real yield rises with DXY", sectorEtfImpact: "QQQ/SMH valuation pressure, TLT weak, banks relative support", stockImpact: "Quality growth still investable but entry price matters", portfolioAction: "Accumulate only on weakness; keep duration small." },
  { driver: "DXY Up", signal: "Dollar index and USD/KRW break higher", sectorEtfImpact: "EM/Korea pressure, Gold mixed, exporters need margin check", stockImpact: "KOSDAQ growth and FX-sensitive names risk review", portfolioAction: "Stage Korea buying; prefer export quality." },
  { driver: "HY OAS Up", signal: "Credit spreads widen for multiple sessions", sectorEtfImpact: "Small/mid cap risk down, quality factor up", stockImpact: "Avoid levered and low-liquidity names", portfolioAction: "Raise quality hurdle and cash buffer." },
  { driver: "Copper Up + China PMI Up", signal: "Copper trend confirmed by China demand", sectorEtfImpact: "Materials, industrials, COPX, PAVE positive", stockImpact: "Power equipment and copper leaders benefit", portfolioAction: "Upgrade commodity/resource sleeve selectively." },
  { driver: "Oil Up", signal: "WTI rises with tight inventories", sectorEtfImpact: "XLE positive, inflation risk negative for long-duration growth", stockImpact: "Energy cash-flow quality favored over high-beta services", portfolioAction: "Maintain energy hedge; watch CPI expectations." },
  { driver: "Net Liquidity Down", signal: "Fed assets down, TGA up, RRP offset fading", sectorEtfImpact: "Equity beta down, BIL/cash up, IWM weak", stockImpact: "Illiquid mid/small caps need position-size review", portfolioAction: "Keep dry powder and reduce speculative beta." }
];

const riskBudgetItems: RiskBudgetItem[] = [
  { item: "Equity Beta", current: "0.82", limit: "0.90", status: "Within", suggestedAction: "Keep beta below limit until liquidity improves." },
  { item: "Growth Factor Exposure", current: "38%", limit: "42%", status: "Watch", suggestedAction: "Prefer QUAL/MOAT over adding pure QQQ beta." },
  { item: "Mega-cap Growth Concentration", current: "29%", limit: "32%", status: "Watch", suggestedAction: "Rebalance if big-tech earnings fail to broaden." },
  { item: "Semiconductor/AI Concentration", current: "17%", limit: "20%", status: "Watch", suggestedAction: "Hold leaders, add only after valuation reset." },
  { item: "Korea FX-sensitive Exposure", current: "11%", limit: "13%", status: "Watch", suggestedAction: "Stage accumulation while USD/KRW is elevated." },
  { item: "Small/Mid Cap Liquidity Risk", current: "7%", limit: "10%", status: "Within", suggestedAction: "Require trading-value confirmation before adding." },
  { item: "Commodity Beta", current: "8%", limit: "12%", status: "Within", suggestedAction: "Use as reflation hedge, not core risk." },
  { item: "Duration Exposure", current: "5%", limit: "8%", status: "Within", suggestedAction: "Keep TLT underweight until real-yield trend turns." },
  { item: "Cash Buffer", current: "4%", limit: "4-6% target", status: "Watch", suggestedAction: "Maintain tactical buffer while macro confidence is below 65." }
];

function rowAsset(
  assetClass: string,
  signal: AllocationAction,
  suggestedWeight: number,
  previousWeight: number,
  rationale: string,
  riskLevel: AssetAllocation["riskLevel"],
  confidence = 70,
  dataStatus: UiDataStatus = "Modeled",
  options: Partial<Pick<AssetAllocation, "currentWeight" | "minWeight" | "maxWeight" | "rebalanceNeeded" | "rebalanceTrigger">> = {}
): AssetAllocation {
  const currentWeight = options.currentWeight ?? previousWeight;
  const minWeight = options.minWeight ?? Math.max(0, suggestedWeight - 3);
  const maxWeight = options.maxWeight ?? suggestedWeight + 3;
  const rebalanceNeeded = options.rebalanceNeeded ?? (currentWeight < minWeight ? "Increase toward band" : currentWeight > maxWeight ? "Trim toward band" : "Within band");
  const rebalanceTrigger = options.rebalanceTrigger ?? "Signal changes, regime confidence drops, or weight moves outside allowed band";
  return { assetClass, signal, currentWeight, suggestedWeight, previousWeight, minWeight, maxWeight, rebalanceNeeded, rebalanceTrigger, rationale, riskLevel, confidence, dataStatus };
}

function etf(ticker: string, name: string, assetClass: string, sector: string, macroFitScore: number, trendScore: number, valuationScore: number, cycleScore: number, liquidityScore: number, drawdownRisk: number, correlationToPortfolio: number, action: AllocationAction, rationale: string): EtfAllocation {
  const region: EtfAllocation["region"] = assetClass === "Bonds" || assetClass === "Cash" || assetClass === "Currency" ? "Macro" : assetClass.includes("Commodity") || assetClass === "Commodity" ? "Global" : "US";
  return { ticker, name, assetClass, sector, macroFitScore, trendScore, valuationScore, cycleScore, liquidityScore, drawdownRisk, correlationToPortfolio, action, rationale, region, dataStatus: "Modeled", confidence: Math.round((macroFitScore + trendScore + liquidityScore + (100 - drawdownRisk)) / 4) };
}

function stock(ticker: string, name: string, market: QualityStock["market"], sector: string, theme: string, marketCap: number, tradingValue: number, qualityScore: number, businessQualityScore: number, financialQualityScore: number, growthDurabilityScore: number, valuationScore: number, earningsRevisionScore: number, momentumScore: number, liquidityRisk: number, balanceSheetRisk: number, action: QualityAction, investmentThesis: string, keyRisk: string): QualityStock {
  const confidence = Math.round((qualityScore + earningsRevisionScore + (100 - liquidityRisk) + (100 - balanceSheetRisk)) / 4);
  return { ticker, name, market, sector, theme, marketCap, tradingValue, qualityScore, businessQualityScore, financialQualityScore, growthDurabilityScore, valuationScore, earningsRevisionScore, momentumScore, liquidityRisk, balanceSheetRisk, action, investmentThesis, keyRisk, dataStatus: "Modeled", confidence };
}

function mid(ticker: string, name: string, market: MidSmallQuality["market"], sector: string, theme: string, marketCap: number, tradingValue: number, qualityScore: number, businessQualityScore: number, financialQualityScore: number, growthDurabilityScore: number, valuationScore: number, earningsRevisionScore: number, momentumScore: number, liquidityRisk: number, balanceSheetRisk: number, action: QualityAction, investmentThesis: string, keyRisk: string, salesGrowth: number, operatingMargin: number, roe: number, roic: number, netDebtToEbitda: number, fcfPositive: boolean, consensusRevisionUp: boolean, drawdownFrom52wHigh: number, foreignInstitutionFlow: number, governanceRisk: number, earningsVisibilityRisk: number, overhangRisk: number): MidSmallQuality {
  return { ...stock(ticker, name, market, sector, theme, marketCap, tradingValue, qualityScore, businessQualityScore, financialQualityScore, growthDurabilityScore, valuationScore, earningsRevisionScore, momentumScore, liquidityRisk, balanceSheetRisk, action, investmentThesis, keyRisk), salesGrowth, operatingMargin, roe, roic, netDebtToEbitda, fcfPositive, consensusRevisionUp, drawdownFrom52wHigh, foreignInstitutionFlow, governanceRisk, earningsVisibilityRisk, overhangRisk };
}

function commodity(category: string, commodityTrend: string, futuresCurve: string, inventoryTrend: string, dollarSensitivity: CommodityMonitor["dollarSensitivity"], chinaDemandSensitivity: CommodityMonitor["chinaDemandSensitivity"], relatedEtfs: string[], relatedStocks: string[], action: CommodityMonitor["action"], rationale = "Use as a macro allocation sleeve; position size should follow commodity trend, balance-sheet quality, and portfolio correlation."): CommodityMonitor {
  return { category, commodityTrend, futuresCurve, inventoryTrend, dollarSensitivity, chinaDemandSensitivity, relatedEtfs, relatedStocks, action, rationale, dataStatus: "Modeled", confidence: 68 };
}

function risk(title: string, severity: RiskAlert["severity"], trigger: string, affectedAssetClasses: string[], affectedSectors: string[], affectedEtfs: string[], affectedStocks: string[], suggestedInvestorAction: string, type: RiskAlert["type"], confidence = 70): RiskAlert {
  return { title, severity, trigger, affectedAssetClasses, affectedSectors, affectedEtfs, affectedStocks, suggestedInvestorAction, type, confidence };
}

function bucket(bucketName: string, suggestedWeight: number, minWeight: number, maxWeight: number, regimeFit: number, rebalanceTrigger: string, riskComment: string): PortfolioBucket {
  return { bucket: bucketName, suggestedWeight, minWeight, maxWeight, regimeFit, rebalanceTrigger, riskComment };
}

function formatNumber(value: number, unit = "") {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1 }).format(value)}${unit ? ` ${unit}` : ""}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date);
}

function formatFullDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date);
}

function getIndicator(snapshot: MarketSnapshot, id: string) {
  return snapshot.indicators.find((indicator) => indicator.id === id);
}

function macroChange1d(indicator: Indicator | undefined, config: MacroMetricConfig) {
  if (!indicator) return config.change5d / 5;
  if (config.unit === "bp") return indicator.value - indicator.previousClose;
  if (config.category === "Rates") return (indicator.value - indicator.previousClose) * 100;
  if (config.category === "Inflation") return indicator.value - indicator.previousClose;
  return indicator.changePercent;
}

function macroMetric(snapshot: MarketSnapshot, config: MacroMetricConfig): MacroMetric {
  const indicator = getIndicator(snapshot, config.id);
  return {
    ...config,
    value: indicator?.value ?? config.fallbackValue,
    unit: indicator?.unit ?? config.unit,
    change1d: macroChange1d(indicator, config),
    dataStatus: config.status ?? (indicator ? uiStatusForIndicator(indicator) : "Modeled"),
    basisDate: indicator?.quality.tradeDate ?? indicator?.quality.baseDate ?? lastTradingDay(snapshot)
  };
}

function macroMetrics(snapshot: MarketSnapshot, configs: MacroMetricConfig[]) {
  return configs.map((config) => macroMetric(snapshot, config));
}

function formatMacroValue(metric: MacroMetric) {
  return formatNumber(metric.value, metric.unit);
}

function formatMacroDelta(metric: MacroMetric, value: number) {
  if (metric.unit === "bp" || metric.category === "Rates" || metric.label.includes("OAS") || metric.label.includes("Spread")) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}bp`;
  }
  if (metric.category === "Inflation" || metric.unit.includes("YoY") || metric.unit.includes("MoM")) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}pp`;
  }
  return formatPercent(value);
}

function indicatorStatus(indicator: Indicator): DataStatus {
  if (indicator.quality.status) return indicator.quality.status;
  if (indicator.quality.errorMessage) return "Error";
  if (indicator.quality.stale || indicator.quality.source.toLowerCase().includes("fallback")) return "Stale";
  return "Fresh";
}

function reliabilityScore(snapshot: MarketSnapshot) {
  const weights: Record<string, number> = {
    "Market Price Reliability": 0.25,
    "Flow Reliability": 0.15,
    "Macro Reliability": 0.25,
    "ETF Reliability": 0.1,
    "Fundamental Reliability": 0.15,
    "Commodity Reliability": 0.1
  };
  return Math.round(reliabilityGroups(snapshot).reduce((sum, group) => sum + group.score * (weights[group.label] ?? 0), 0));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreToStatus(score: number): DataStatus {
  if (score >= 85) return "Fresh";
  if (score >= 65) return "Delayed";
  if (score >= 35) return "Stale";
  return "Error";
}

function uiStatusFromDataStatus(status: DataStatus): UiDataStatus {
  if (status === "Fresh") return "Live";
  return status;
}

function uiStatusForIndicator(indicator: Indicator): UiDataStatus {
  if (indicator.quality.source.toLowerCase().includes("fallback")) return "Fallback";
  return uiStatusFromDataStatus(indicatorStatus(indicator));
}

function reliabilityFromIndicators(items: Indicator[]) {
  const weights: Record<DataStatus, number> = { Fresh: 100, Delayed: 72, Stale: 32, Error: 0 };
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + weights[indicatorStatus(item)], 0) / items.length);
}

function hasLogIssue(snapshot: MarketSnapshot, sourcePattern: RegExp) {
  return sourceLogs(snapshot).some((log) => sourcePattern.test(log.source) && (log.status === "Stale" || log.status === "Error"));
}

function allDataStatuses(snapshot: MarketSnapshot) {
  return [
    ...snapshot.indicators.map((item) => uiStatusForIndicator(item)),
    ...sourceLogs(snapshot).map((log) => log.source.toLowerCase().includes("fallback") ? "Fallback" as UiDataStatus : uiStatusFromDataStatus(log.status)),
    ...assetAllocations.map((item) => item.dataStatus),
    ...etfAllocations.map((item) => item.dataStatus),
    ...qualityStocks.map((item) => item.dataStatus),
    ...midSmallQuality.map((item) => item.dataStatus),
    ...commodityMonitors.map((item) => item.dataStatus),
    ...myWatchlist.map((item) => item.dataStatus)
  ];
}

function dataStatusCounts(snapshot: MarketSnapshot) {
  return allDataStatuses(snapshot).reduce<Record<Lowercase<UiDataStatus>, number>>(
    (counts, status) => {
      counts[status.toLowerCase() as Lowercase<UiDataStatus>] += 1;
      return counts;
    },
    { live: 0, delayed: 0, stale: 0, modeled: 0, fallback: 0, error: 0 }
  );
}

function isFlowSensitiveAlert(alert: RiskAlert) {
  return [
    alert.title,
    alert.trigger,
    ...alert.affectedAssetClasses,
    ...alert.affectedSectors,
    ...alert.affectedEtfs,
    ...alert.affectedStocks
  ].join(" ").match(/Korea|KOSPI|KOSDAQ|KRW|EWY|Mid\/Small|Small Cap|005930|000660|454910|141080/i);
}

function alertConfidence(snapshot: MarketSnapshot, alert: RiskAlert) {
  const flowPenalty = hasLogIssue(snapshot, /KRX investor flow endpoints/i) && isFlowSensitiveAlert(alert) ? 12 : 0;
  return clampScore(alert.confidence - flowPenalty);
}

function macroRegimeConfidence(snapshot: MarketSnapshot, regime: MacroRegime) {
  const ismPenalty = hasLogIssue(snapshot, /ISM Report on Business/i) ? 12 : 0;
  const macroPenalty = reliabilityGroups(snapshot).find((group) => group.label === "Macro Reliability")?.penalty ?? 0;
  return clampScore(regime.confidenceScore - ismPenalty - Math.round(macroPenalty / 3));
}

function flowScoreConfidence(snapshot: MarketSnapshot) {
  const flowReliability = reliabilityGroups(snapshot).find((group) => group.label === "Flow Reliability");
  return flowReliability ? flowReliability.score : 0;
}

function reliabilityGroups(snapshot: MarketSnapshot) {
  const byGroup = (groups: Indicator["group"][]) => snapshot.indicators.filter((item) => groups.includes(item.group));
  const krxFlowIssue = hasLogIssue(snapshot, /KRX investor flow endpoints/i);
  const ismIssue = hasLogIssue(snapshot, /ISM Report on Business/i);
  const marketPriceScore = reliabilityFromIndicators(byGroup(["price", "future", "volatility"]));
  const flowBase = reliabilityFromIndicators(byGroup(["flow"]));
  const macroBase = reliabilityFromIndicators(byGroup(["macro", "rates", "credit", "inflation", "liquidity"]));
  const groups = [
    {
      label: "Market Price Reliability",
      score: clampScore(marketPriceScore),
      penalty: 0,
      detail: "Index, futures, FX, and volatility market feeds."
    },
    {
      label: "Flow Reliability",
      score: clampScore(flowBase - (krxFlowIssue ? 20 : 0)),
      penalty: krxFlowIssue ? 20 : 0,
      detail: krxFlowIssue ? "KRX investor flow endpoints are stale, so Flow Score Confidence is reduced." : "Investor flow, ETF flow, and positioning proxies."
    },
    {
      label: "Macro Reliability",
      score: clampScore(macroBase - (ismIssue ? 18 : 0)),
      penalty: ismIssue ? 18 : 0,
      detail: ismIssue ? "ISM Report on Business error lowers Macro Regime Confidence." : "Official macro, rates, inflation, credit, and liquidity data."
    },
    {
      label: "ETF Reliability",
      score: clampScore(Math.min(88, marketPriceScore - 4)),
      penalty: 0,
      detail: "ETF allocation uses live market proxies plus the configured ETF universe."
    },
    {
      label: "Fundamental Reliability",
      score: 76,
      penalty: 0,
      detail: "Quality stock data is modeled until the fundamentals database feed is connected."
    },
    {
      label: "Commodity Reliability",
      score: 74,
      penalty: 0,
      detail: "Commodity categories use proxy trend, inventory, and futures-curve assumptions."
    }
  ];

  return groups.map((group) => ({ ...group, status: scoreToStatus(group.score) }));
}

function sourceLogs(snapshot: MarketSnapshot): SourceFetchLog[] {
  if (snapshot.sourceLogs?.length) return snapshot.sourceLogs;
  return [{ id: "fallback", source: "Local fallback snapshot", status: "Stale", lastAttemptAt: snapshot.generatedAt, message: "Live API not available.", affectedIndicatorIds: snapshot.indicators.map((item) => item.id) }];
}

function currentRegime() {
  return macroRegimes.reduce((best, item) => (item.probability > best.probability ? item : best), macroRegimes[0]);
}

function secondaryRegime() {
  return [...macroRegimes].sort((a, b) => b.probability - a.probability)[1] ?? macroRegimes[1];
}

function currentRegimeLabel() {
  const regime = currentRegime();
  const second = secondaryRegime();
  if (regime.probability < 45 && second.probability >= 20) return `${regime.name}-biased Mixed Regime`;
  return regime.name;
}

function currentRegimeInterpretation() {
  const regime = currentRegime();
  const second = secondaryRegime();
  return `${regime.name} is the leading regime but not a confirmed state; ${second.name} probability is ${second.probability}%, so the portfolio should pair Quality Growth with Commodity/Industrial hedges.`;
}

function basisDateForGroups(snapshot: MarketSnapshot, groups: Indicator["group"][]) {
  const dates = snapshot.indicators
    .filter((indicator) => groups.includes(indicator.group))
    .map((indicator) => indicator.quality.tradeDate ?? indicator.quality.baseDate)
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? lastTradingDay(snapshot);
}

function issueTapeUpdatedAt() {
  return macroIssues.map((issue) => issue.timestamp).sort().at(-1) ?? "-";
}

function sourceIssueCounts(snapshot: MarketSnapshot) {
  return sourceLogs(snapshot).reduce(
    (counts, log) => {
      if (log.status === "Stale") counts.stale += 1;
      if (log.status === "Error") counts.error += 1;
      if (log.source.toLowerCase().includes("fallback")) counts.fallback += 1;
      return counts;
    },
    { stale: 0, error: 0, fallback: 0 }
  );
}

function dataLoadLabel(snapshot: MarketSnapshot, state: "loaded" | "live" | "fallback") {
  const counts = sourceIssueCounts(snapshot);
  if (state === "fallback") return "Fallback / Modeled data included";
  if (counts.error || counts.stale) return `Loaded with ${counts.stale} stale sources and ${counts.error} error`;
  const modeledCount = allDataStatuses(snapshot).filter((status) => status === "Modeled" || status === "Fallback").length;
  if (modeledCount) return "Partially Updated";
  return "Loaded";
}

function regimeInputs(snapshot: MarketSnapshot) {
  const inputIds = [
    ["ISM Manufacturing", "ism-mfg"],
    ["ISM Services", "ism-services"],
    ["US CPI", "cpi"],
    ["Core CPI", "core-cpi"],
    ["PCE", "pce"],
    ["US 10Y Yield", "us-10y"],
    ["Real Yield", "real-yield-10y"],
    ["DXY", "dxy"],
    ["USD/KRW", "usd-krw"],
    ["HY OAS", "hy-oas"],
    ["Net Liquidity", "net-liquidity"],
    ["Korea Export Growth", "kr-export-20d"]
  ];
  const extras = [
    ["China PMI", "49.5"],
    ["Copper", "+4.2% 20D"],
    ["Oil", "+2.8% 20D"],
    ["Gold", "+6.1% 20D"]
  ];
  return [
    ...inputIds.map(([label, id]) => {
      const indicator = getIndicator(snapshot, id);
      return [label, indicator ? `${formatNumber(indicator.value, indicator.unit)} (${formatPercent(indicator.changePercent)})` : "-"];
    }),
    ...extras
  ];
}

function etfScore(row: EtfAllocation) {
  return Math.round(row.macroFitScore * 0.3 + row.trendScore * 0.2 + row.valuationScore * 0.15 + row.cycleScore * 0.15 + row.liquidityScore * 0.1 + (100 - row.drawdownRisk) * 0.1);
}

function qualityFormulaScore(row: QualityStock) {
  return Math.round(row.businessQualityScore * 0.25 + row.financialQualityScore * 0.2 + row.growthDurabilityScore * 0.2 + row.valuationScore * 0.15 + row.earningsRevisionScore * 0.1 + (100 - (row.liquidityRisk + row.balanceSheetRisk) / 2) * 0.1);
}

function assetWhy(row: AssetAllocation) {
  const map: Record<string, string[]> = {
    "US Equity": ["+ Quality growth earnings leadership remains intact", "- Real yield rebound creates valuation pressure", "- DXY strength tightens global liquidity", "Conclusion: Keep core exposure, but prefer QUAL/MOAT over adding pure QQQ beta."],
    "Korea Equity": ["+ Export cycle is constructive", "- USD/KRW strength and foreign-flow uncertainty cap conviction", "Conclusion: Hold large export quality; be selective in KOSDAQ growth."],
    "Quality Large Cap": ["+ Balance-sheet strength and earnings visibility fit mixed macro", "- Crowding can rise when macro confidence is low", "Conclusion: Maintain overweight as the core risk sleeve."],
    "Mid/Small Cap Quality": ["+ Select compounders can outperform after liquidity resets", "- Credit and liquidity signals are not broad small-cap friendly", "Conclusion: Keep exposure narrow and require trading-value confirmation."],
    "Semiconductor/AI": ["+ AI capex and HBM demand remain durable", "- Valuation and concentration risk are elevated", "Conclusion: Hold leaders and add only on weakness."],
    "Commodity Equity": ["+ Copper and energy provide reflation hedge", "- China demand confirmation is incomplete", "Conclusion: Keep Neutral+ hedge, favor quality resource cash flow."],
    "Sector ETFs": ["+ ETFs express macro views with lower single-name risk", "- Correlation can rise during liquidity stress", "Conclusion: Use ETFs for regime sleeves and rebalance when scores fall below 55."],
    Bonds: ["+ Useful if growth weakens and real yields roll over", "- Current real yields and term premium still pressure duration", "Conclusion: Keep duration measured; prefer IEF over TLT."],
    Gold: ["+ Hedge against policy, FX, and real-yield uncertainty", "- Real-yield rebound can cap upside", "Conclusion: Maintain hedge sleeve rather than aggressive overweight."],
    "Cash / Tactical Buffer": ["+ Macro confidence below 65 argues for dry powder", "+ Liquidity drag supports tactical cash buffer", "Conclusion: Base Cash 1% plus 3-5% tactical buffer until confidence or reliability improves."]
  };
  return map[row.assetClass] ?? [row.rationale, "Conclusion: Keep weight inside the allowed band until macro signal changes."];
}

function etfWhy(row: EtfAllocation) {
  return [
    `+ Macro Fit ${row.macroFitScore}: ${row.macroFitScore >= 75 ? "strong fit with current top-down regime" : "acceptable but not a clear regime leader"}`,
    `+ Trend ${row.trendScore}: ${row.trendScore >= 70 ? "price leadership remains constructive" : "trend confirmation is incomplete"}`,
    `- Valuation ${row.valuationScore}: ${row.valuationScore < 45 ? "valuation discipline limits new overweight" : "valuation is not the main constraint"}`,
    `- Drawdown Risk ${row.drawdownRisk}: ${row.drawdownRisk > 55 ? "position size should stay controlled" : "drawdown risk is manageable"}`,
    `Conclusion: ${row.rationale}`
  ];
}

function stockWhy(row: QualityStock) {
  return [
    `+ Business Quality ${row.businessQualityScore}: ${row.businessQualityScore >= 85 ? "durable franchise or technology leadership" : "quality case needs monitoring"}`,
    `+ Financial Quality ${row.financialQualityScore}: ${row.financialQualityScore >= 80 ? "balance sheet and profitability support core ownership" : "financial quality is not yet best-in-class"}`,
    `+ Growth Durability ${row.growthDurabilityScore}: ${row.growthDurabilityScore >= 80 ? "medium-term growth visibility is strong" : "growth durability requires confirmation"}`,
    `- Valuation ${row.valuationScore}: ${row.valuationScore < 50 ? "valuation risk argues against chasing" : "valuation discipline is acceptable"}`,
    `Conclusion: ${row.investmentThesis}`
  ];
}

function stockRiskLevel(row: QualityStock) {
  const risk = (row.liquidityRisk + row.balanceSheetRisk) / 2;
  if (risk >= 55) return "High";
  if (risk >= 30) return "Medium";
  return "Low";
}

function timeParts(timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
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
  return [marketSession("korea"), marketSession("us")].some((status) => status !== "Closed") ? 60_000 : 300_000;
}

function refreshCadenceLabel(ms: number) {
  return ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`;
}

function nextRefreshLabel(ms: number) {
  const next = new Date(Date.now() + ms);
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(next);
}

function marketStatusSummary() {
  const korea = marketSession("korea");
  const us = marketSession("us");
  const weekend = korea === "Closed" && us === "Closed" && ["Sat", "Sun"].includes(timeParts("Asia/Seoul").weekday);
  return weekend ? "Weekend / Last Trading Day Data" : `Korea ${korea} / US ${us}`;
}

function lastTradingDay(snapshot: MarketSnapshot) {
  const dates = snapshot.indicators.map((indicator) => indicator.quality.tradeDate ?? indicator.quality.baseDate).filter(Boolean).sort();
  return dates.at(-1) ?? "-";
}

function dataBasis(snapshot: MarketSnapshot) {
  const koreaDate = snapshot.indicators.find((indicator) => indicator.region === "korea")?.quality.baseDate ?? "-";
  const usDate = snapshot.indicators.find((indicator) => indicator.region === "us")?.quality.baseDate ?? "-";
  return `${koreaDate} Korea data + ${usDate} US close`;
}

function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function localizedOption(option: string) {
  if (option === "All") return "\uC804\uCCB4";
  if (option in actionLabel) return actionLabel[option as InvestmentAction] + " (" + option + ")";
  if (option in statusLabel) return statusLabel[option as UiDataStatus] + " (" + option + ")";
  return option;
}

function investorActionText(value: string) {
  return value
    .replaceAll("Add only on weakness", "\uCD94\uACA9\uB9E4\uC218\uBCF4\uB2E4 \uB20C\uB9BC\uBAA9 \uC911\uC2EC \uC811\uADFC")
    .replaceAll("Keep valuation discipline", "\uBC38\uB958\uC5D0\uC774\uC158 \uBD80\uB2F4\uC744 \uAC10\uC548\uD574 \uBD84\uD560 \uC811\uADFC")
    .replaceAll("Stagger accumulation", "\uD55C \uBC88\uC5D0 \uBE44\uC911\uD655\uB300\uD558\uC9C0 \uB9D0\uACE0 \uBD84\uD560 \uC811\uADFC")
    .replaceAll("Move candidates to thesis review", "\uD22C\uC790\uB17C\uB9AC \uD6FC\uC190 \uC5EC\uBD80 \uC7AC\uC810\uAC80")
    .replaceAll("Reduce position sizing", "\uC885\uBAA9\uBCC4 \uBE44\uC911 \uCD95\uC18C");
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
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

function StatCard({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail?: string; tone?: IndicatorTone }) {
  return (
    <div className={`panel rounded-lg p-4 ${toneClass[tone]}`}>
      <div className="text-xs uppercase tracking-[0.14em] text-white/60">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-white">{value}</div>
      {detail ? <div className="mt-1 text-xs text-white/70">{detail}</div> : null}
    </div>
  );
}

function ActionPill({ action }: { action: InvestmentAction }) {
  return (
    <Pill className={actionClass[action]}>
      <span>{actionLabel[action]}</span>
      <span className="ml-1 text-[10px] font-normal opacity-65">{action}</span>
    </Pill>
  );
}

function DataStatusPill({ status }: { status: UiDataStatus | DataStatus }) {
  const english = status === "Fresh" ? "Live" : status;
  return (
    <Pill className={statusClass[status]}>
      <span>{statusLabel[status]}</span>
      <span className="ml-1 text-[10px] font-normal opacity-65">{english}</span>
    </Pill>
  );
}

function WhyDetails({ label = ko.detail, children }: { label?: string; children: React.ReactNode }) {
  return (
    <details className="mt-2 rounded border border-white/10 bg-black/20 px-2 py-1 text-xs">
      <summary className="cursor-pointer list-none font-semibold text-accent">{label}</summary>
      <div className="mt-2 space-y-1 text-white/75">{children}</div>
    </details>
  );
}

function ExecutiveSummaryCard({ snapshot }: { snapshot: MarketSnapshot }) {
  const regime = currentRegime();
  const confidence = macroRegimeConfidence(snapshot, regime);
  const preferredAssets = assetAllocations.filter((item) => ["Overweight", "Neutral+"].includes(item.signal)).slice(0, 4);
  const preferredEtfs = [...etfAllocations].sort((a, b) => etfScore(b) - etfScore(a)).slice(0, 5);
  const stockTypes = ["Core quality compounders", "AI infrastructure leaders", "Balance-sheet resilient mid caps"];
  const topRisks = riskAlerts.slice(0, 3).map((alert) => alert.title.replace(" Alert", ""));
  const macroDrivers = ["US real yield rebound", "USD/KRW strength", "HY OAS stable-to-wider", "Korea export cycle constructive", "Copper/gold strength"];
  const whatChanged = macroIssues.slice(0, 3).map((issue) => issue.title).join(" / ");
  const watchList = ["CPI/PCE", "FOMC minutes", "Korea export 1-20 days", "China PMI"].join(", ");
  return (
    <section className="panel rounded-lg border-accent/35 bg-accent/5 p-5">
      <SectionHeader eyebrow="Executive Summary" title="1분 투자 배분 요약" icon={<RadioTower className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <StatCard label="Current Macro Regime" value={currentRegimeLabel()} detail={regime.quadrant} tone="positive" />
        <StatCard label="Regime Confidence" value={`${confidence}/100`} detail={hasLogIssue(snapshot, /ISM Report on Business/i) ? "ISM data error penalty applied" : "Macro inputs available"} tone={confidence >= 70 ? "positive" : "caution"} />
        <StatCard label="Overall Investment Stance" value="Neutral+" detail="Quality Bias" tone="positive" />
        <StatCard label="Today's Action" value="Core Hold" detail="Selective accumulation, avoid low-quality cyclicals" tone="neutral" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="Preferred Asset Classes" value={preferredAssets.map((item) => item.assetClass).join(", ")} />
        <InfoBlock label="Preferred ETFs" value={preferredEtfs.map((item) => item.ticker).join(", ")} />
        <InfoBlock label="Preferred Stock Types" value={stockTypes.join(", ")} />
        <InfoBlock label="Key Risks" value={topRisks.join(", ")} />
        <InfoBlock label="Key Macro Drivers" value={macroDrivers.join(", ")} />
        <InfoBlock label="What Changed Today" value={whatChanged} />
        <InfoBlock label="What to Watch This Week" value={watchList} />
        <InfoBlock label="Regime Interpretation" value={currentRegimeInterpretation()} />
        <InfoBlock label="Macro Risk / Data Confidence" value={`Risk: Medium-High · Confidence: ${confidence}/100`} />
      </div>
    </section>
  );
}

function HomeView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <ExecutiveSummaryCard snapshot={snapshot} />
      <div className="hidden space-y-6 lg:block">
        <TopMacroDrivers snapshot={snapshot} />
        <MacroIssueTape compact limit={4} />
        <AllocationChanges />
        <TopIdeas />
        <HomeRiskDataIssues snapshot={snapshot} />
      </div>
      <div className="space-y-4 lg:hidden">
        <TopMacroDrivers snapshot={snapshot} />
        <MacroIssueTape compact limit={4} />
        <AllocationChanges />
        <TopIdeas />
        <details className="panel rounded-lg p-4">
          <summary className="cursor-pointer list-none font-semibold text-white">More Dashboard Sections</summary>
          <div className="mt-4 space-y-4">
            <HomeRiskDataIssues snapshot={snapshot} />
            <MacroEventCalendar compact limit={4} />
          </div>
        </details>
      </div>
    </div>
  );
}

function TopMacroDrivers({ snapshot }: { snapshot: MarketSnapshot }) {
  const drivers = macroMetrics(snapshot, macroSnapshotConfigs).filter((row) => ["real-yield-10y", "usd-krw", "hy-oas", "kr-export-20d", "copper"].includes(row.id));
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow={"\uD575\uC2EC \uB9E4\uD06C\uB85C \uB3D9\uC778 TOP 5"} title={"\uC624\uB298 \uBC30\uBD84 \uD310\uB2E8\uC5D0 \uAC00\uC7A5 \uC911\uC694\uD55C \uC785\uB825\uAC12"} icon={<TrendingUp className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        {drivers.map((row) => (
          <div key={row.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{row.label}</div>
                <div className="mt-1 font-mono text-xl text-white">{formatMacroValue(row)}</div>
              </div>
              <DataStatusPill status={row.dataStatus} />
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="text-muted">20D</span>
              <span className={row.change20d >= 0 ? "text-caution" : "text-positive"}>{formatMacroDelta(row, row.change20d)}</span>
            </div>
            <p className="mt-3 text-xs text-white/70">{row.regimeImpact}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AllocationChanges() {
  const rows = assetAllocations.filter((row) => row.rebalanceNeeded !== "Within band" || row.assetClass.includes("Cash")).slice(0, 6);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Allocation Changes" title="Portfolio bands and rebalance triggers" icon={<BriefcaseBusiness className="h-5 w-5" />} />
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["asset", "current", "suggested", "band", "action", "rebalance needed", "trigger"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.assetClass} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-white">{row.assetClass}</td>
                <td className="px-4 py-3 font-mono text-white">{row.currentWeight}%</td>
                <td className="px-4 py-3 font-mono text-positive">{row.suggestedWeight}%</td>
                <td className="px-4 py-3 font-mono text-muted">{row.minWeight}-{row.maxWeight}%</td>
                <td className="px-4 py-3"><ActionPill action={row.signal} /></td>
                <td className="px-4 py-3 text-accent">{row.rebalanceNeeded}</td>
                <td className="px-4 py-3 text-muted">{row.rebalanceTrigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopIdeas() {
  const etfs = [...etfAllocations].sort((a, b) => etfScore(b) - etfScore(a)).slice(0, 5);
  const stocks = [...qualityStocks].sort((a, b) => qualityFormulaScore(b) - qualityFormulaScore(a)).slice(0, 5);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="ETF / Quality Stock Top Ideas" title="Best execution vehicles from the top-down view" icon={<Gem className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 font-semibold text-white">ETF Top Ideas</div>
          <div className="space-y-2">
            {etfs.map((row) => (
              <div key={row.ticker} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2">
                <div><span className="font-mono text-white">{row.ticker}</span><span className="ml-2 text-sm text-muted">{row.sector}</span></div>
                <div className="flex items-center gap-2"><span className="font-mono text-white">{etfScore(row)}</span><ActionPill action={row.action} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 font-semibold text-white">Quality Stock Top Ideas</div>
          <div className="space-y-2">
            {stocks.map((row) => (
              <div key={row.ticker} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2">
                <div><span className="font-mono text-white">{row.ticker}</span><span className="ml-2 text-sm text-muted">{row.name}</span></div>
                <div className="flex items-center gap-2"><span className="font-mono text-white">{qualityFormulaScore(row)}</span><ActionPill action={row.action} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeRiskDataIssues({ snapshot }: { snapshot: MarketSnapshot }) {
  const counts = sourceIssueCounts(snapshot);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Risk & Data Issues" title="What can invalidate today's allocation" icon={<ShieldAlert className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Macro Confidence" value={`${macroRegimeConfidence(snapshot, currentRegime())}/100`} tone="caution" />
        <StatCard label="Reliability" value={`${reliabilityScore(snapshot)}/100`} tone={reliabilityScore(snapshot) >= 85 ? "positive" : "caution"} />
        <StatCard label="Stale Sources" value={counts.stale} tone={counts.stale ? "caution" : "positive"} />
        <StatCard label="Errors" value={counts.error} tone={counts.error ? "negative" : "positive"} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {riskAlerts.slice(0, 4).map((alert) => (
          <InfoBlock key={alert.title} label={alert.title} value={alert.suggestedInvestorAction} />
        ))}
      </div>
    </section>
  );
}

function MacroSnapshot({ snapshot, compact = false, limit }: { snapshot: MarketSnapshot; compact?: boolean; limit?: number }) {
  const rows = macroMetrics(snapshot, macroSnapshotConfigs);
  const visibleRows = compact ? rows.slice(0, limit ?? rows.length) : rows;
  const groups = ["Rates", "FX", "Volatility", "Credit", "Liquidity", "Commodities", "Korea Macro", "Growth"] as MacroCategory[];
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Macro Snapshot" title="Core macro inputs before allocation" icon={<Gauge className="h-5 w-5" />} />
      <div className="space-y-3">
        {groups.map((group, index) => {
          const groupRows = visibleRows.filter((row) => row.category === group);
          if (!groupRows.length) return null;
          return (
            <details key={group} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open={compact ? index < 2 : true}>
              <summary className="cursor-pointer list-none font-semibold text-white">{group}</summary>
              <div className="thin-scrollbar mt-3 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
                    <tr>{["indicator", "current value", "1D", "20D", "data status", "key impact", "detail"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {groupRows.map((row) => (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                        <td className="px-4 py-3 font-mono text-white">{formatMacroValue(row)}</td>
                        <td className={row.change1d >= 0 ? "px-4 py-3 text-caution" : "px-4 py-3 text-positive"}>{formatMacroDelta(row, row.change1d)}</td>
                        <td className={row.change20d >= 0 ? "px-4 py-3 text-caution" : "px-4 py-3 text-positive"}>{formatMacroDelta(row, row.change20d)}</td>
                        <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
                        <td className="px-4 py-3 text-white/75">{row.sectorImpact}</td>
                        <td className="px-4 py-3">
                          <WhyDetails label="Detail">
                            <div>5D: {formatMacroDelta(row, row.change5d)}</div>
                            <div>Regime impact: {row.regimeImpact}</div>
                            <div>Sector impact: {row.sectorImpact}</div>
                            <div>Source: {row.source}</div>
                            <div>Data basis date: {row.basisDate}</div>
                          </WhyDetails>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function MacroIssueTape({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const rows = compact ? macroIssues.slice(0, limit ?? 4) : macroIssues;
  const severityClass: Record<MacroIssue["severity"], string> = {
    High: toneClass.negative,
    Medium: toneClass.caution,
    Low: toneClass.neutral
  };
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow={"\uB9E4\uD06C\uB85C \uC774\uC288 \uD750\uB984"} title={"\uC624\uB298\uC758 \uC774\uC288\uC640 \uC790\uC0B0\uBC30\uBD84 \uC601\uD5A5"} icon={<AlertTriangle className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rows.map((issue) => (
          <article key={issue.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill className={severityClass[issue.severity]}>{severityLabel[issue.severity]}</Pill>
                  <Pill className={toneClass.neutral}>{issue.category}</Pill>
                  <DataStatusPill status={issue.dataStatus} />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{issueTitleKo[issue.title] ?? issue.title}</h3>
              </div>
              <div className="text-right text-xs text-muted">{issue.timestamp}</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBlock label={"\uAD00\uB828 \uC9C0\uD45C"} value={issue.relatedIndicators.join(", ")} />
              <InfoBlock label={"\uC601\uD5A5 \uC790\uC0B0"} value={issue.affectedAssetClasses.join(", ")} />
              <InfoBlock label={"\uC601\uD5A5 ETF"} value={issue.affectedEtfs.join(", ")} />
              <InfoBlock label={"\uC601\uD5A5 \uC885\uBAA9"} value={issue.affectedStocks.join(", ")} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <InfoBlock label={"\uD574\uC11D"} value={issue.interpretation} />
              <InfoBlock label={"\uB300\uC751 \uC804\uB7B5"} value={investorActionText(issue.suggestedAction)} />
              <InfoBlock label={"\uCD9C\uCC98"} value={issue.source} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function GroupedMacroIndicators({ snapshot }: { snapshot: MarketSnapshot }) {
  const groups = [
    { label: "Rates", ids: ["us-2y", "us-10y", "real-yield-10y", "yield-10y-2y"] },
    { label: "FX", ids: ["dxy", "usd-krw", "usd-jpy"] },
    { label: "Volatility", ids: ["vix", "move", "put-call"] },
    { label: "Credit", ids: ["hy-oas", "ig-oas"] },
    { label: "Liquidity", ids: ["fed-assets", "tga", "rrp", "net-liquidity"] },
    { label: "Commodities", ids: ["wti", "copper", "gold"] },
    { label: "Korea Macro", ids: ["kr-export-20d", "foreign-kospi-flow", "institution-flow"] }
  ];
  const configFor = (id: string) => macroSnapshotConfigs.find((item) => item.id === id)
    ?? ratesMonitorMetrics.find((item) => item.id === id)
    ?? fxKoreaMetrics.find((item) => item.id === id)
    ?? liquidityCreditMetrics.find((item) => item.id === id);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Market Indicators" title="Grouped macro indicator board" icon={<Gauge className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 font-semibold text-white">{group.label}</div>
            <div className="space-y-2">
              {group.ids.map((id) => {
                const indicator = getIndicator(snapshot, id);
                const config = configFor(id);
                if (!indicator && !config) return null;
                const metric = config ? macroMetric(snapshot, config) : null;
                const value = indicator ? formatNumber(indicator.value, indicator.unit) : metric ? formatMacroValue(metric) : "-";
                const change = indicator ? indicator.changePercent : metric?.change1d ?? 0;
                const status = indicator ? uiStatusForIndicator(indicator) : metric?.dataStatus ?? "Modeled";
                const label = config?.label ?? indicator?.name ?? id;
                return (
                  <div key={id} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium text-white">{label}</div>
                      <div className="font-mono text-xs text-muted">{value}</div>
                    </div>
                    <div className="text-right">
                      <div className={change >= 0 ? "text-caution" : "text-positive"}>{formatPercent(change)}</div>
                      <DataStatusPill status={status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MacroMetricMiniGrid({ rows }: { rows: MacroMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded border border-white/10 bg-black/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-muted">{row.label}</div>
              <div className="mt-1 font-mono text-lg text-white">{formatMacroValue(row)}</div>
            </div>
            <DataStatusPill status={row.dataStatus} />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-muted">1D</span>
            <span className={row.change1d >= 0 ? "text-caution" : "text-positive"}>{formatMacroDelta(row, row.change1d)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MacroMonitorSection({ snapshot, section, compact = false }: { snapshot: MarketSnapshot; section: MacroMonitorConfig; compact?: boolean }) {
  const rows = macroMetrics(snapshot, section.metrics);
  const visibleRows = compact ? rows.slice(0, 6) : rows;
  const entries = Object.entries(section.interpretation);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow={section.eyebrow} title={section.title} icon={<LineChart className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>{["indicator", "value", "1D", "5D", "20D", "impact", "data"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={`${section.title}-${row.id}`} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                  <td className="px-4 py-3 font-mono text-white">{formatMacroValue(row)}</td>
                  <td className={row.change1d >= 0 ? "px-4 py-3 text-caution" : "px-4 py-3 text-positive"}>{formatMacroDelta(row, row.change1d)}</td>
                  <td className={row.change5d >= 0 ? "px-4 py-3 text-caution" : "px-4 py-3 text-positive"}>{formatMacroDelta(row, row.change5d)}</td>
                  <td className={row.change20d >= 0 ? "px-4 py-3 text-caution" : "px-4 py-3 text-positive"}>{formatMacroDelta(row, row.change20d)}</td>
                  <td className="px-4 py-3 text-muted">{row.sectorImpact}</td>
                  <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {entries.slice(0, compact ? 5 : entries.length).map(([label, value]) => (
            <InfoBlock key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RatesFxLiquidityDashboard({ snapshot }: { snapshot: MarketSnapshot }) {
  const sections = macroMonitorSections.filter((section) => ["Rates", "Liquidity & Credit", "FX & Korea"].includes(section.eyebrow));
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Rates / FX / Liquidity Dashboard" title="Macro pressure points for today's allocation" icon={<SlidersHorizontal className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {sections.map((section) => {
          const rows = macroMetrics(snapshot, section.metrics).slice(0, 4);
          const firstEntries = Object.entries(section.interpretation).slice(0, 3);
          return (
            <div key={section.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 font-semibold text-white">{section.title}</div>
              <MacroMetricMiniGrid rows={rows} />
              <div className="mt-3 space-y-2">
                {firstEntries.map(([label, value]) => (
                  <div key={label} className="rounded border border-white/10 bg-black/20 p-2 text-xs">
                    <div className="text-white/50">{label}</div>
                    <div className="mt-1 text-white/80">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MacroImpactMap() {
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Macro to Sector/ETF Impact Map" title="How macro changes translate into allocation moves" icon={<Layers3 className="h-5 w-5" />} />
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["macro driver", "signal", "sector / ETF impact", "stock impact", "portfolio action"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {macroImpactMap.map((row) => (
              <tr key={row.driver} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-white">{row.driver}</td>
                <td className="px-4 py-3 text-muted">{row.signal}</td>
                <td className="px-4 py-3 text-white/75">{row.sectorEtfImpact}</td>
                <td className="px-4 py-3 text-muted">{row.stockImpact}</td>
                <td className="px-4 py-3 text-accent">{row.portfolioAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MacroEventCalendar({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const rows = compact ? macroEvents.slice(0, limit ?? 5) : macroEvents;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow={"\uB9E4\uD06C\uB85C \uC774\uBCA4\uD2B8 \uCEA8\uB9B0\uB354"} title={"\uC608\uC815 \uC774\uBCA4\uD2B8 \uBC0F \uC0AC\uC804 \uD3EC\uC9C0\uC158 \uC810\uAC80"} icon={<Bell className="h-5 w-5" />} />
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1220px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["\uB0A0\uC9DC", "\uC2DC\uAC04", "\uAD6D\uAC00", "\uC774\uBCA4\uD2B8", "\uC608\uC0C1\uCE58", "\uC774\uC804\uCE58", "\uC2E4\uC81C\uCE58", "\uC911\uC694\uB3C4", "\uC608\uC0C1 \uC2DC\uC7A5 \uC601\uD5A5", "\uC810\uAC80 \uC790\uC0B0", "\uC0AC\uC804 \uD3EC\uC9C0\uC158 \uC810\uAC80"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={`${event.date}-${event.event}`} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{event.date}</td>
                <td className="px-4 py-3 text-muted">{event.time}</td>
                <td className="px-4 py-3 text-muted">{event.country}</td>
                <td className="px-4 py-3 font-medium text-white">{event.event}</td>
                <td className="px-4 py-3 text-muted">{event.consensus}</td>
                <td className="px-4 py-3 text-muted">{event.previous}</td>
                <td className="px-4 py-3 text-muted">{event.actual}</td>
                <td className="px-4 py-3"><Pill className={event.importance === "High" ? toneClass.negative : event.importance === "Medium" ? toneClass.caution : toneClass.neutral}>{event.importance}</Pill></td>
                <td className="px-4 py-3 text-white/75">{event.likelyMarketImpact}</td>
                <td className="px-4 py-3 text-muted">{event.assetsToWatch}</td>
                <td className="px-4 py-3 text-accent">{event.positioningNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MacroCockpitView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <MacroSnapshot snapshot={snapshot} />
      <GroupedMacroIndicators snapshot={snapshot} />
      <MacroIssueTape />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[0]} />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[1]} />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[2]} />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[3]} />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[4]} />
      <MacroMonitorSection snapshot={snapshot} section={macroMonitorSections[5]} />
      <MacroImpactMap />
      <MacroEventCalendar />
    </div>
  );
}

function RiskAndDataView({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  return (
    <div className="space-y-6">
      <RiskValuationAlerts snapshot={snapshot} compact={compact} limit={compact ? 4 : undefined} />
      <DataReliability snapshot={snapshot} compact={compact} />
    </div>
  );
}

function MacroRegimeSummary({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  const regime = currentRegime();
  const confidence = macroRegimeConfidence(snapshot, regime);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Macro Regime Summary" title={`${currentRegimeLabel()}: ${regime.quadrant}`} icon={<Globe2 className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-muted">현재 국면</div>
              <div className="mt-2 text-3xl font-semibold text-white">{currentRegimeLabel()}</div>
              <div className="mt-1 text-sm text-muted">{regime.quadrant}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Probability" value={`${regime.probability}%`} tone="positive" />
              <StatCard label="MoM Change" value={formatPercent(regime.changeMoM)} tone={regime.changeMoM >= 0 ? "positive" : "caution"} />
              <StatCard label="Previous" value={regime.previousRegime} tone="neutral" />
              <StatCard label="Confidence" value={`${confidence}/100`} tone={confidence >= 70 ? "positive" : confidence >= 55 ? "caution" : "negative"} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoBlock label="선호 자산군" value={regime.preferredAssets.join(", ")} />
            <InfoBlock label="선호 섹터" value={regime.preferredSectors.join(", ")} />
            <InfoBlock label="회피 섹터" value={regime.avoidSectors.join(", ")} />
            <InfoBlock label="추천 ETF" value={regime.recommendedEtfs.join(", ")} />
            <InfoBlock label="주요 리스크" value={regime.keyRisks.join(", ")} />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 font-semibold text-white">Macro Regime Matrix</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {macroRegimes.map((item) => (
              <div key={item.name} className={`rounded-lg border p-3 ${item.name === regime.name ? "border-positive/45 bg-positive/10" : "border-white/10 bg-black/20"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-muted">{item.quadrant}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl text-white">{item.probability}%</div>
                    <div className="text-xs text-muted">Conf. {macroRegimeConfidence(snapshot, item)}</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded bg-white/10">
                  <div className="h-1.5 rounded bg-positive" style={{ width: `${item.probability}%` }} />
                </div>
              </div>
            ))}
          </div>
          {!compact ? <MacroInputs snapshot={snapshot} /> : null}
        </div>
      </div>
      <div className="mt-4">
        <InfoBlock label="Interpretation" value={currentRegimeInterpretation()} />
      </div>
      {compact ? <MacroInputs snapshot={snapshot} /> : null}
    </section>
  );
}

function MacroInputs({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <details className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4" open>
      <summary className="cursor-pointer list-none font-semibold text-white">사용 지표</summary>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3 xl:grid-cols-4">
        {regimeInputs(snapshot).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 rounded bg-white/[0.03] px-3 py-2">
            <span className="text-muted">{label}</span>
            <span className="font-mono text-white">{value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function AssetAllocationView({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [actionFilter, setActionFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const filtered = assetAllocations
    .filter((row) => actionFilter === "All" || row.signal === actionFilter)
    .filter((row) => riskFilter === "All" || row.riskLevel === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.confidence) === confidenceFilter);
  const rows = compact ? filtered.slice(0, limit ?? 10) : filtered;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Asset Allocation View" title="자산군별 권고 비중" icon={<BriefcaseBusiness className="h-5 w-5" />} />
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Overweight", "Neutral+", "Neutral", "Neutral-", "Underweight", "Avoid"]} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-72 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="assetClass" hide />
              <YAxis />
              <Tooltip contentStyle={{ background: "#101419", border: "1px solid #26313d", color: "#e7edf4" }} />
              <Bar dataKey="suggestedWeight" radius={[5, 5, 0, 0]}>
                {rows.map((row) => <Cell key={row.assetClass} fill={row.signal.includes("Over") ? "#21c17a" : row.signal.includes("Under") || row.signal === "Avoid" ? "#f5b84b" : "#8f9baa"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="thin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>{["Asset Class", "Action", "Current", "Suggested", "Min", "Max", "Rebalance", "Trigger", "Risk", "Data", "Why"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.assetClass} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{row.assetClass}</td>
                  <td className="px-4 py-3"><ActionPill action={row.signal} /></td>
                  <td className="px-4 py-3 font-mono text-white">{row.currentWeight}%</td>
                  <td className="px-4 py-3 font-mono text-positive">{row.suggestedWeight}%</td>
                  <td className="px-4 py-3 font-mono text-muted">{row.minWeight}%</td>
                  <td className="px-4 py-3 font-mono text-muted">{row.maxWeight}%</td>
                  <td className="px-4 py-3 text-accent">{row.rebalanceNeeded}</td>
                  <td className="px-4 py-3 text-muted">{row.rebalanceTrigger}</td>
                  <td className="px-4 py-3 text-muted">{row.riskLevel}</td>
                  <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
                  <td className="px-4 py-3 text-muted">
                    <WhyDetails>
                      {assetWhy(row).map((line) => <div key={line}>{line}</div>)}
                    </WhyDetails>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SectorEtfBoard({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [query, setQuery] = React.useState("");
  const [assetClass, setAssetClass] = React.useState("All");
  const [actionFilter, setActionFilter] = React.useState("All");
  const [regionFilter, setRegionFilter] = React.useState("All");
  const [sectorFilter, setSectorFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const options = ["All", ...Array.from(new Set(etfAllocations.map((item) => item.assetClass)))];
  const sectorOptions = ["All", ...Array.from(new Set(etfAllocations.map((item) => item.sector)))];
  const etfRiskLevel = (row: EtfAllocation) => row.drawdownRisk >= 60 ? "High" : row.drawdownRisk >= 40 ? "Medium" : "Low";
  const rows = etfAllocations
    .filter((row) => assetClass === "All" || row.assetClass === assetClass)
    .filter((row) => actionFilter === "All" || row.action === actionFilter)
    .filter((row) => regionFilter === "All" || row.region === regionFilter)
    .filter((row) => sectorFilter === "All" || row.sector === sectorFilter)
    .filter((row) => riskFilter === "All" || etfRiskLevel(row) === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.confidence) === confidenceFilter)
    .filter((row) => `${row.ticker} ${row.name} ${row.sector}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => etfScore(b) - etfScore(a));
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Sector & ETF Allocation Board" title="섹터 ETF와 원자재 ETF 평가" icon={<Layers3 className="h-5 w-5" />} />
      <p className="mb-4 text-sm text-muted">ETF Allocation Score = Macro Fit 30% + Trend 20% + Valuation/Mean Reversion 15% + Earnings or Commodity Cycle 15% + Liquidity 10% + Risk/Drawdown 10%</p>
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Input label="Search" value={query} onChange={setQuery} />
          <Select label="Asset Class" value={assetClass} onChange={setAssetClass} options={options} />
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Overweight", "Neutral+", "Neutral", "Neutral-", "Underweight", "Avoid"]} />
          <Select label="Region" value={regionFilter} onChange={setRegionFilter} options={["All", "US", "Global", "Macro"]} />
          <Select label="Sector" value={sectorFilter} onChange={setSectorFilter} options={sectorOptions} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <EtfTable rows={compact ? rows.slice(0, limit ?? 12) : rows} />
    </section>
  );
}

function EtfTable({ rows }: { rows: EtfAllocation[] }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
          <tr>{["ticker", "name", "allocationScore", "action", "data", "macroFit", "valuation", "drawdownRisk", "rationale"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="border-t border-white/10">
              <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 font-mono text-white">{etfScore(row)}</td>
              <td className="px-4 py-3">
                <ActionPill action={row.action} />
                <WhyDetails>
                  {etfWhy(row).map((line) => <div key={line}>{line}</div>)}
                  <div>Cycle {row.cycleScore}, Liquidity {row.liquidityScore}, Correlation {row.correlationToPortfolio.toFixed(2)}</div>
                </WhyDetails>
              </td>
              <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
              <td className="px-4 py-3 font-mono text-white">{row.macroFitScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.valuationScore}</td>
              <td className="px-4 py-3 font-mono text-caution">{row.drawdownRisk}</td>
              <td className="px-4 py-3 text-muted">{row.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualityStockCandidates({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [query, setQuery] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("All");
  const [regionFilter, setRegionFilter] = React.useState("All");
  const [sectorFilter, setSectorFilter] = React.useState("All");
  const [themeFilter, setThemeFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const sectors = ["All", ...Array.from(new Set(qualityStocks.map((item) => item.sector)))];
  const themes = ["All", ...Array.from(new Set(qualityStocks.map((item) => item.theme)))];
  const rows = [...qualityStocks]
    .filter((row) => `${row.ticker} ${row.name} ${row.sector} ${row.theme}`.toLowerCase().includes(query.toLowerCase()))
    .filter((row) => actionFilter === "All" || row.action === actionFilter)
    .filter((row) => regionFilter === "All" || row.market === regionFilter)
    .filter((row) => sectorFilter === "All" || row.sector === sectorFilter)
    .filter((row) => themeFilter === "All" || row.theme === themeFilter)
    .filter((row) => riskFilter === "All" || stockRiskLevel(row) === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.confidence) === confidenceFilter)
    .sort((a, b) => b.qualityScore - a.qualityScore);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Quality Stock Candidates" title="퀄리티 종목 후보" icon={<Gem className="h-5 w-5" />} />
      <p className="mb-4 text-sm text-muted">Quality Stock Score = Business Quality 25% + Financial Quality 20% + Growth Durability 20% + Valuation Discipline 15% + Earnings Revision 10% + Liquidity/Risk 10%</p>
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Input label="Search" value={query} onChange={setQuery} />
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Core Hold", "Accumulate", "Buy on Weakness", "Valuation Watch", "Deep Dive Needed", "Trim", "Avoid"]} />
          <Select label="Region" value={regionFilter} onChange={setRegionFilter} options={["All", "KOSPI", "KOSDAQ", "NASDAQ", "S&P500"]} />
          <Select label="Sector" value={sectorFilter} onChange={setSectorFilter} options={sectors} />
          <Select label="Theme" value={themeFilter} onChange={setThemeFilter} options={themes} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <QualityStockTable rows={compact ? rows.slice(0, limit ?? 8) : rows} />
    </section>
  );
}

function QualityStockTable({ rows }: { rows: QualityStock[] }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[1280px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
          <tr>{["ticker", "name", "qualityScore", "valuation", "earningsRevision", "riskLevel", "action", "fundamentalData", "investmentThesis"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="border-t border-white/10">
              <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 font-mono text-positive">{qualityFormulaScore(row)}</td>
              <td className="px-4 py-3 font-mono text-white">{row.valuationScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.earningsRevisionScore}</td>
              <td className="px-4 py-3 text-muted">{stockRiskLevel(row)}</td>
              <td className="px-4 py-3">
                <ActionPill action={row.action} />
                <WhyDetails>
                  {stockWhy(row).map((line) => <div key={line}>{line}</div>)}
                  <div>Liquidity Risk {row.liquidityRisk}, Balance Sheet Risk {row.balanceSheetRisk}</div>
                  <div>Key risk: {row.keyRisk}</div>
                </WhyDetails>
              </td>
              <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
              <td className="px-4 py-3 text-muted">{row.investmentThesis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MidSmallQualityWatchlist({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [minMarketCap, setMinMarketCap] = React.useState(0);
  const [minTradingValue, setMinTradingValue] = React.useState(0);
  const [minRevenueGrowth, setMinRevenueGrowth] = React.useState(0);
  const [minOperatingMargin, setMinOperatingMargin] = React.useState(-100);
  const [minRoe, setMinRoe] = React.useState(-100);
  const [minRoic, setMinRoic] = React.useState(-100);
  const [maxNetDebt, setMaxNetDebt] = React.useState(5);
  const [revisionOnly, setRevisionOnly] = React.useState(false);
  const [maxDrawdown, setMaxDrawdown] = React.useState(100);
  const [minForeignFlow, setMinForeignFlow] = React.useState(-999);
  const [minInstitutionFlow, setMinInstitutionFlow] = React.useState(-999);
  const [maxGovernanceRisk, setMaxGovernanceRisk] = React.useState(100);
  const [maxCbOverhangRisk, setMaxCbOverhangRisk] = React.useState(100);
  const [fcfOnly, setFcfOnly] = React.useState(false);
  const [actionFilter, setActionFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const rows = midSmallQuality
    .filter((row) => row.marketCap >= minMarketCap)
    .filter((row) => row.tradingValue >= minTradingValue)
    .filter((row) => row.salesGrowth >= minRevenueGrowth)
    .filter((row) => row.operatingMargin >= minOperatingMargin)
    .filter((row) => row.roe >= minRoe)
    .filter((row) => row.roic >= minRoic)
    .filter((row) => row.netDebtToEbitda <= maxNetDebt)
    .filter((row) => !fcfOnly || row.fcfPositive)
    .filter((row) => !revisionOnly || row.consensusRevisionUp)
    .filter((row) => Math.abs(row.drawdownFrom52wHigh) <= maxDrawdown)
    .filter((row) => row.foreignInstitutionFlow >= minForeignFlow)
    .filter((row) => row.foreignInstitutionFlow * 0.6 >= minInstitutionFlow)
    .filter((row) => row.governanceRisk <= maxGovernanceRisk)
    .filter((row) => row.overhangRisk <= maxCbOverhangRisk)
    .filter((row) => actionFilter === "All" || row.action === actionFilter)
    .filter((row) => riskFilter === "All" || stockRiskLevel(row) === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.confidence) === confidenceFilter)
    .sort((a, b) => b.qualityScore - a.qualityScore);
  const visibleRows = compact ? rows.slice(0, limit ?? rows.length) : rows;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Mid/Small Cap Quality Watchlist" title="미드스몰캡 퀄리티 필터" icon={<Sprout className="h-5 w-5" />} />
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <NumberInput label="Min Market Cap" value={minMarketCap} onChange={setMinMarketCap} />
          <NumberInput label="Min Trading Value" value={minTradingValue} onChange={setMinTradingValue} />
          <NumberInput label="Min Revenue Growth" value={minRevenueGrowth} onChange={setMinRevenueGrowth} />
          <NumberInput label="Min Operating Margin" value={minOperatingMargin} onChange={setMinOperatingMargin} />
          <NumberInput label="Min ROE" value={minRoe} onChange={setMinRoe} />
          <NumberInput label="Min ROIC" value={minRoic} onChange={setMinRoic} />
          <NumberInput label="Max Net Debt/EBITDA" value={maxNetDebt} onChange={setMaxNetDebt} />
          <NumberInput label="Max 52W Drawdown" value={maxDrawdown} onChange={setMaxDrawdown} />
          <NumberInput label="Min Foreign Flow" value={minForeignFlow} onChange={setMinForeignFlow} />
          <NumberInput label="Min Institution Flow" value={minInstitutionFlow} onChange={setMinInstitutionFlow} />
          <NumberInput label="Max Governance Risk" value={maxGovernanceRisk} onChange={setMaxGovernanceRisk} />
          <NumberInput label="Max CB Overhang Risk" value={maxCbOverhangRisk} onChange={setMaxCbOverhangRisk} />
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Core Hold", "Accumulate", "Buy on Weakness", "Valuation Watch", "Deep Dive Needed", "Trim", "Avoid"]} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
          <Toggle label="FCF positive only" checked={fcfOnly} onChange={setFcfOnly} />
          <Toggle label="Revision up only" checked={revisionOnly} onChange={setRevisionOnly} />
        </div>
      ) : null}
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["ticker", "name", "qualityScore", "market", "revenueGrowth", "OPM", "riskLevel", "action", "data", "investmentThesis"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.ticker} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 font-mono text-positive">{qualityFormulaScore(row)}</td>
                <td className="px-4 py-3 text-muted">{row.market}</td>
                <td className="px-4 py-3 text-positive">{formatPercent(row.salesGrowth)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.operatingMargin}%</td>
                <td className="px-4 py-3 text-muted">{stockRiskLevel(row)}</td>
                <td className="px-4 py-3">
                  <ActionPill action={row.action} />
                  <WhyDetails>
                    <div>Market cap {formatNumber(row.marketCap)}, trading value {formatNumber(row.tradingValue)}</div>
                    <div>ROE {row.roe}%, ROIC {row.roic}%, net debt/EBITDA {row.netDebtToEbitda.toFixed(1)}x</div>
                    <div>FCF {row.fcfPositive ? "positive" : "not yet positive"}, revision {row.consensusRevisionUp ? "up" : "flat/down"}, 52W drawdown {formatPercent(row.drawdownFrom52wHigh)}</div>
                    <div>Foreign flow {formatNumber(row.foreignInstitutionFlow)}, institution proxy {formatNumber(row.foreignInstitutionFlow * 0.6)}</div>
                    <div>Liquidity {row.liquidityRisk}, Governance {row.governanceRisk}, Balance Sheet {row.balanceSheetRisk}, Visibility {row.earningsVisibilityRisk}, Overhang {row.overhangRisk}</div>
                    <div>{row.investmentThesis}</div>
                  </WhyDetails>
                </td>
                <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
                <td className="px-4 py-3 text-muted">{row.investmentThesis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CommodityResourceMonitor({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [actionFilter, setActionFilter] = React.useState("All");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const categoryOptions = ["All", ...commodityMonitors.map((item) => item.category)];
  const commodityRiskLevel = (row: CommodityMonitor) => {
    if (row.dollarSensitivity === "High" || row.chinaDemandSensitivity === "High") return "High";
    if (row.dollarSensitivity === "Medium" || row.chinaDemandSensitivity === "Medium") return "Medium";
    return "Low";
  };
  const filteredRows = commodityMonitors
    .filter((row) => actionFilter === "All" || row.action === actionFilter)
    .filter((row) => categoryFilter === "All" || row.category === categoryFilter)
    .filter((row) => riskFilter === "All" || commodityRiskLevel(row) === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.confidence) === confidenceFilter);
  const rows = compact ? filteredRows.slice(0, limit ?? 9) : filteredRows;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Commodity & Resource Equity Monitor" title="원자재와 리소스 기업 모니터" icon={<Factory className="h-5 w-5" />} />
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Overweight", "Neutral+", "Neutral", "Neutral-", "Underweight", "Avoid"]} />
          <Select label="Asset Class" value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {rows.map((row) => (
          <details key={row.category} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open={!compact}>
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{row.category}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{row.commodityTrend}</span>
                    <DataStatusPill status={row.dataStatus} />
                    <Pill className="border-purple-400/45 bg-purple-400/10 text-purple-200">Proxy / Assumption</Pill>
                  </div>
                </div>
                <div className="text-right">
                  <ActionPill action={row.action} />
                  <WhyDetails>
                    <div>Commodity trend: {row.commodityTrend}</div>
                    <div>Futures curve: {row.futuresCurve}</div>
                    <div>Inventory: {row.inventoryTrend}</div>
                    <div>Dollar/China sensitivity: {row.dollarSensitivity} / {row.chinaDemandSensitivity}</div>
                    <div>Conclusion: {row.rationale}</div>
                  </WhyDetails>
                </div>
              </div>
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <InfoBlock label="Underlying Commodity Trend" value={row.commodityTrend} />
              <InfoBlock label="Futures Curve" value={row.futuresCurve} />
              <InfoBlock label="Inventory Trend" value={row.inventoryTrend} />
              <InfoBlock label="Dollar / China Sensitivity" value={`${row.dollarSensitivity} / ${row.chinaDemandSensitivity}`} />
              <InfoBlock label="Data Basis" value={`Proxy/Assumption; confidence ${row.confidence}/100`} />
              <InfoBlock label="Related ETFs" value={row.relatedEtfs.join(", ")} />
              <InfoBlock label="Related Stocks" value={row.relatedStocks.join(", ")} />
              <InfoBlock label="Rationale" value={row.rationale} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function RiskValuationAlerts({ snapshot, compact = false, limit }: { snapshot: MarketSnapshot; compact?: boolean; limit?: number }) {
  const [severityFilter, setSeverityFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const filteredRows = riskAlerts
    .filter((alert) => severityFilter === "All" || alert.severity === severityFilter)
    .filter((alert) => typeFilter === "All" || alert.type === typeFilter)
    .filter((alert) => confidenceFilter === "All" || confidenceLevel(alertConfidence(snapshot, alert)) === confidenceFilter);
  const rows = compact ? filteredRows.slice(0, limit ?? 6) : filteredRows;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Risk & Valuation Alerts" title="리스크와 밸류에이션 알림" icon={<ShieldAlert className="h-5 w-5" />} />
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Select label="Risk Level" value={severityFilter} onChange={setSeverityFilter} options={["All", "Red", "Orange", "Yellow"]} />
          <Select label="Alert Type" value={typeFilter} onChange={setTypeFilter} options={["All", "Tactical", "Fundamental"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rows.map((alert) => {
          const confidence = alertConfidence(snapshot, alert);
          return (
          <details key={alert.title} className={`rounded-lg border p-4 ${alert.severity === "Red" ? toneClass.negative : alert.severity === "Orange" ? toneClass.caution : "border-accent/35 bg-accent/10 text-accent"}`} open={!compact}>
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill className={alert.severity === "Red" ? toneClass.negative : alert.severity === "Orange" ? toneClass.caution : "border-accent/35 bg-accent/10 text-accent"}>{alert.severity} · {alert.type}</Pill>
                  <h3 className="mt-2 font-semibold text-white">{alert.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{alert.trigger}</p>
                </div>
                <div className="text-right">
                  <Bell className="ml-auto h-5 w-5" />
                  <div className="mt-2 font-mono text-sm text-white">{confidence}/100</div>
                  {confidence < alert.confidence ? <div className="text-xs text-caution">flow adjusted</div> : <div className="text-xs text-muted">confidence</div>}
                </div>
              </div>
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoBlock label="Affected Asset Classes" value={alert.affectedAssetClasses.join(", ")} />
              <InfoBlock label="Affected Sectors" value={alert.affectedSectors.join(", ")} />
              <InfoBlock label="Affected ETFs" value={alert.affectedEtfs.join(", ")} />
              <InfoBlock label="Affected Stocks" value={alert.affectedStocks.join(", ")} />
              <InfoBlock label="Suggested Investor Action" value={alert.suggestedInvestorAction} />
              <InfoBlock label="Confidence" value={`${confidence}/100${confidence < alert.confidence ? " (KRX flow stale penalty applied)" : ""}`} />
            </div>
          </details>
          );
        })}
      </div>
    </section>
  );
}

function MyWatchlistView({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [regionFilter, setRegionFilter] = React.useState("All");
  const [riskFilter, setRiskFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [confidenceFilter, setConfidenceFilter] = React.useState("All");
  const riskLevel = (row: WatchlistItem) => {
    if (row.currentAction === "Avoid" || row.currentAction === "Risk Review" || row.currentScore < 60) return "High";
    if (row.currentScore < 75 || row.currentAction === "Neutral-" || row.currentAction === "Trim") return "Medium";
    return "Low";
  };
  const rows = myWatchlist
    .filter((row) => `${row.asset} ${row.type} ${row.region} ${row.keyRisk}`.toLowerCase().includes(query.toLowerCase()))
    .filter((row) => actionFilter === "All" || row.currentAction === actionFilter)
    .filter((row) => typeFilter === "All" || row.type === typeFilter)
    .filter((row) => regionFilter === "All" || row.region === regionFilter)
    .filter((row) => riskFilter === "All" || riskLevel(row) === riskFilter)
    .filter((row) => statusFilter === "All" || row.dataStatus === statusFilter)
    .filter((row) => confidenceFilter === "All" || confidenceLevel(row.currentScore) === confidenceFilter)
    .sort((a, b) => b.currentScore - a.currentScore);
  const visibleRows = compact ? rows.slice(0, 6) : rows;

  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="My Watchlist" title="관심 ETF · 주식 · 원자재" icon={<Gem className="h-5 w-5" />} />
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <Input label="Search" value={query} onChange={setQuery} />
          <Select label="Action" value={actionFilter} onChange={setActionFilter} options={["All", "Overweight", "Neutral+", "Neutral", "Neutral-", "Underweight", "Core Hold", "Accumulate", "Buy on Weakness", "Trim", "Risk Review", "Avoid"]} />
          <Select label="Asset Class" value={typeFilter} onChange={setTypeFilter} options={["All", "ETF", "Stock", "Commodity", "Asset Class"]} />
          <Select label="Region" value={regionFilter} onChange={setRegionFilter} options={["All", "US", "Korea", "Global", "Macro"]} />
          <Select label="Risk Level" value={riskFilter} onChange={setRiskFilter} options={["All", "Low", "Medium", "High"]} />
          <Select label="Data Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Live", "Delayed", "Stale", "Modeled", "Fallback", "Error"]} />
          <Select label="Confidence" value={confidenceFilter} onChange={setConfidenceFilter} options={["All", "High", "Medium", "Low"]} />
        </div>
      ) : null}
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["asset", "type", "region", "currentWeight", "targetWeight", "suggestedWeight", "action", "rebalanceNeeded", "macroSensitivity", "dataStatus", "keyRisk"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.asset} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{row.asset}</td>
                <td className="px-4 py-3 text-muted">{row.type}</td>
                <td className="px-4 py-3 text-muted">{row.region}</td>
                <td className="px-4 py-3 font-mono text-white">{row.currentWeight}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.targetWeight}%</td>
                <td className="px-4 py-3 font-mono text-positive">{row.suggestedWeight}%</td>
                <td className="px-4 py-3">
                  <ActionPill action={row.currentAction} />
                  <WhyDetails>
                    <div>Score: {row.currentScore}/100</div>
                    <div>Risk level: {riskLevel(row)}</div>
                    <div>Current / Target / Suggested: {row.currentWeight}% / {row.targetWeight}% / {row.suggestedWeight}%</div>
                    <div>Macro sensitivity: {row.macroSensitivity}</div>
                    <div>Conclusion: {row.rebalanceNeeded}</div>
                  </WhyDetails>
                </td>
                <td className="px-4 py-3 text-muted">{row.rebalanceNeeded}</td>
                <td className="px-4 py-3 text-muted">{row.macroSensitivity}</td>
                <td className="px-4 py-3"><DataStatusPill status={row.dataStatus} /></td>
                <td className="px-4 py-3 text-muted">{row.keyRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PortfolioConstructionView() {
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Portfolio Construction View" title="Core / Satellite / Tactical 구조" icon={<Landmark className="h-5 w-5" />} />
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["bucket", "suggested", "min", "max", "regimeFit", "rebalanceTrigger", "riskComment"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {portfolioBuckets.map((row) => (
              <tr key={row.bucket} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-white">{row.bucket}</td>
                <td className="px-4 py-3 font-mono text-positive">{row.suggestedWeight}%</td>
                <td className="px-4 py-3 font-mono text-muted">{row.minWeight}%</td>
                <td className="px-4 py-3 font-mono text-muted">{row.maxWeight}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.regimeFit}</td>
                <td className="px-4 py-3 text-muted">{row.rebalanceTrigger}</td>
                <td className="px-4 py-3 text-muted">{row.riskComment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RiskBudgetView() {
  const statusClassMap: Record<RiskBudgetItem["status"], string> = {
    Within: toneClass.positive,
    Watch: toneClass.caution,
    Breach: toneClass.negative
  };
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Risk Budget View" title="Portfolio exposure limits and pressure points" icon={<ShieldAlert className="h-5 w-5" />} />
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["risk budget", "current", "limit", "status", "suggested action"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {riskBudgetItems.map((row) => (
              <tr key={row.item} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-white">{row.item}</td>
                <td className="px-4 py-3 font-mono text-white">{row.current}</td>
                <td className="px-4 py-3 font-mono text-muted">{row.limit}</td>
                <td className="px-4 py-3"><Pill className={statusClassMap[row.status]}>{row.status}</Pill></td>
                <td className="px-4 py-3 text-muted">{row.suggestedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatBacktestPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function formatBacktestRatio(value: number) {
  return value.toFixed(2);
}

function returnHeatClass(value: number) {
  if (value >= 0.04) return "border-positive/35 bg-positive/15";
  if (value >= 0) return "border-positive/20 bg-positive/5";
  if (value <= -0.04) return "border-negative/35 bg-negative/15";
  return "border-caution/25 bg-caution/10";
}

function BacktestLabView() {
  const [settings, setSettings] = React.useState<BacktestSettings>(DEFAULT_BACKTEST_SETTINGS);
  const preview = React.useMemo(() => buildReconstructedBacktestPreview(settings), [settings]);
  const metricRows = [
    ["Cumulative Return", formatBacktestPercent(preview.metrics.cumulativeReturn), "3-year total"],
    ["CAGR", formatBacktestPercent(preview.metrics.cagr), "annualized"],
    ["Volatility", formatBacktestPercent(preview.metrics.annualizedVolatility), "annualized"],
    ["Sharpe", formatBacktestRatio(preview.metrics.sharpeRatio), "rf 3.5%"],
    ["Sortino", formatBacktestRatio(preview.metrics.sortinoRatio), "downside risk"],
    ["Max Drawdown", formatBacktestPercent(preview.metrics.maxDrawdown), "peak-to-trough"],
    ["Calmar", formatBacktestRatio(preview.metrics.calmarRatio), "CAGR / MDD"],
    ["Hit Ratio", formatBacktestPercent(preview.metrics.hitRatio), "daily positive"],
    ["Best Month", formatBacktestPercent(preview.metrics.bestMonth), "monthly"],
    ["Worst Month", formatBacktestPercent(preview.metrics.worstMonth), "monthly"],
    ["Turnover", formatBacktestPercent(preview.metrics.turnover), "annualized"],
    ["Transaction Cost", formatBacktestPercent(preview.metrics.transactionCost), "estimated"],
    ["Excess Return", formatBacktestPercent(preview.metrics.excessReturnVsBenchmark), `vs ${settings.benchmark}`]
  ];
  const chartData = preview.points
    .filter((_, index) => index % 21 === 0)
    .concat(preview.points.at(-1) ? [preview.points.at(-1)!] : [])
    .map((point) => ({
      date: point.date.slice(2, 7),
      strategy: Number((point.cumulativeReturn * 100).toFixed(1)),
      benchmark: Number((point.benchmarkCumulativeReturn * 100).toFixed(1)),
      drawdown: Number((point.drawdown * 100).toFixed(1)),
      cashWeight: Number((point.cashWeight * 100).toFixed(1))
    }));
  const updateSetting = <Key extends keyof BacktestSettings>(key: Key, value: BacktestSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="panel rounded-lg border-caution/35 bg-caution/5 p-5">
        <SectionHeader eyebrow="Backtest Lab" title="3-year reconstructed engine design" icon={<BarChart3 className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Lookback" value={`${settings.lookbackYears}Y`} detail="Recent rolling window" tone="neutral" />
          <StatCard label="Currency" value={settings.currency} detail="USD and KRW supported" tone="neutral" />
          <StatCard label="Rebalance" value={settings.rebalancePolicy} detail="Weekly / Monthly / Signal" tone="neutral" />
          <StatCard label="Execution" value={settings.executionPrice} detail="Signal + next trading day" tone="neutral" />
          <StatCard label="Confidence" value={preview.confidence} detail="Based on return/fundamental data quality" tone={preview.confidence === "High" ? "positive" : preview.confidence === "Medium" ? "caution" : "negative"} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          {BACKTEST_LIMITATIONS.map((warning) => (
            <div key={warning} className="rounded border border-caution/25 bg-black/20 px-3 py-2 text-white/75">{warning}</div>
          ))}
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <SectionHeader eyebrow="Backtest Settings" title="Execution, cost, currency, and benchmark assumptions" icon={<SlidersHorizontal className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Select label="Currency" value={settings.currency} onChange={(value) => updateSetting("currency", value as BacktestSettings["currency"])} options={["KRW", "USD"]} />
          <Select label="Rebalance" value={settings.rebalancePolicy} onChange={(value) => updateSetting("rebalancePolicy", value as BacktestSettings["rebalancePolicy"])} options={["Weekly", "Monthly", "Signal Change"]} />
          <Select label="Execution" value={settings.executionPrice} onChange={(value) => updateSetting("executionPrice", value as BacktestSettings["executionPrice"])} options={["Next Open", "Next Close"]} />
          <Select label="Benchmark" value={settings.benchmark} onChange={(value) => updateSetting("benchmark", value as BacktestSettings["benchmark"])} options={BACKTEST_BENCHMARKS} />
          <Select label="Return Basis" value={settings.returnBasis} onChange={(value) => updateSetting("returnBasis", value as BacktestSettings["returnBasis"])} options={["Total Return", "Price Return"]} />
          <NumberInput label="Trading Cost bps" value={settings.transactionCostBps} onChange={(value) => updateSetting("transactionCostBps", value)} />
          <NumberInput label="FX Cost bps" value={settings.fxCostBps} onChange={(value) => updateSetting("fxCostBps", value)} />
        </div>
        <div className="mt-3">
          <Toggle label="Survivorship-bias removal enabled" checked={settings.survivalBiasRemoved} onChange={(value) => updateSetting("survivalBiasRemoved", value)} />
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <SectionHeader eyebrow="Performance Summary" title="Strategy results versus selected benchmark" icon={<LineChart className="h-5 w-5" />} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {metricRows.map(([label, value, detail]) => (
            <StatCard key={label} label={label} value={value} detail={detail} tone={String(value).startsWith("-") ? "negative" : "neutral"} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Cumulative Return" title="Portfolio vs benchmark" icon={<TrendingUp className="h-5 w-5" />} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={chartData}>
                <CartesianGrid stroke="#1f2a38" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8a96a8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a96a8" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#0b1118", border: "1px solid #223044", color: "#e8eef7" }} />
                <Line type="monotone" dataKey="strategy" stroke="#36d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="benchmark" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Drawdown Chart" title="Peak-to-trough risk path" icon={<ShieldAlert className="h-5 w-5" />} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={chartData}>
                <CartesianGrid stroke="#1f2a38" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8a96a8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a96a8" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#0b1118", border: "1px solid #223044", color: "#e8eef7" }} />
                <Line type="monotone" dataKey="drawdown" stroke="#fb7185" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Monthly Return Heatmap" title="Last 36 months" icon={<Bell className="h-5 w-5" />} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {preview.monthlyReturns.slice(-36).map((row) => (
              <div key={row.month} className={`rounded border px-3 py-2 text-xs ${returnHeatClass(row.strategyReturn)}`}>
                <div className="text-white/60">{row.month}</div>
                <div className="mt-1 font-mono text-sm text-white">{formatBacktestPercent(row.strategyReturn)}</div>
                <div className="mt-1 text-white/50">excess {formatBacktestPercent(row.excessReturn)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Asset Weight Path" title="Current target bands used by the engine" icon={<BriefcaseBusiness className="h-5 w-5" />} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={preview.allocationHistory}>
                <CartesianGrid stroke="#1f2a38" strokeDasharray="3 3" />
                <XAxis dataKey="assetClass" stroke="#8a96a8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8a96a8" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#0b1118", border: "1px solid #223044", color: "#e8eef7" }} />
                <Bar dataKey="currentWeight" fill="#64748b" />
                <Bar dataKey="suggestedWeight" fill="#36d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="Regime Performance" title="Return quality by macro regime" icon={<Globe2 className="h-5 w-5" />} />
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
                <tr>{["regime", "days", "avg monthly return", "hit ratio", "max drawdown"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
              </thead>
              <tbody>
                {preview.regimeResults.map((row) => (
                  <tr key={row.regime} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium text-white">{row.regime}</td>
                    <td className="px-4 py-3 font-mono text-white">{row.days}</td>
                    <td className="px-4 py-3 font-mono text-white">{formatBacktestPercent(row.averageReturn)}</td>
                    <td className="px-4 py-3 font-mono text-white">{formatBacktestPercent(row.hitRatio)}</td>
                    <td className="px-4 py-3 font-mono text-negative">{formatBacktestPercent(row.maxDrawdown)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel rounded-lg p-5">
          <SectionHeader eyebrow="ETF / Sleeve Contribution" title="Performance attribution preview" icon={<Layers3 className="h-5 w-5" />} />
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
                <tr>{["name", "sleeve", "contribution", "avg weight", "hit ratio"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
              </thead>
              <tbody>
                {preview.contributions.map((row) => (
                  <tr key={row.name} className="border-t border-white/10">
                    <td className="px-4 py-3 font-mono text-white">{row.name}</td>
                    <td className="px-4 py-3 text-muted">{row.sleeve}</td>
                    <td className="px-4 py-3 font-mono text-positive">{formatBacktestPercent(row.contribution)}</td>
                    <td className="px-4 py-3 font-mono text-white">{formatBacktestPercent(row.averageWeight)}</td>
                    <td className="px-4 py-3 font-mono text-white">{formatBacktestPercent(row.hitRatio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel rounded-lg p-5">
        <SectionHeader eyebrow="Strategy Rulebook" title="How dashboard signals become portfolio positions" icon={<Database className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {BACKTEST_STRATEGY_RULES.map((group) => (
            <div key={group.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold text-white">{group.name}</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {group.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel rounded-lg p-5">
        <SectionHeader eyebrow="Data Model" title="Snapshot tables required for point-in-time replay" icon={<Database className="h-5 w-5" />} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "macro_snapshot_history",
            "macro_regime_history",
            "asset_allocation_history",
            "etf_score_history",
            "quality_stock_score_history",
            "risk_alert_history",
            "price_history",
            "portfolio_backtest_results"
          ].map((table) => (
            <div key={table} className="rounded border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-white/80">{table}</div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
          ETF universe: {BACKTEST_ETF_UNIVERSE.join(", ")}
        </div>
      </section>
    </div>
  );
}

function DataReliability({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  const counts = dataStatusCounts(snapshot);
  const groups = reliabilityGroups(snapshot);
  const overall = reliabilityScore(snapshot);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Data Reliability" title="데이터 신뢰도" icon={<Database className="h-5 w-5" />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
        <StatCard label="Overall" value={`${overall}/100`} detail="Weighted reliability" tone={overall >= 85 ? "positive" : overall >= 65 ? "caution" : "negative"} />
        <StatCard label="Live" value={counts.live} tone="positive" />
        <StatCard label="Delayed" value={counts.delayed} tone="caution" />
        <StatCard label="Stale" value={counts.stale} tone="caution" />
        <StatCard label="Modeled" value={counts.modeled} tone="neutral" />
        <StatCard label="Fallback" value={counts.fallback} tone="neutral" />
        <StatCard label="Error" value={counts.error} tone="negative" />
      </div>
      <p className="mt-3 text-xs text-muted">Overall = Market Price 25% + Flow 15% + Macro 25% + ETF 10% + Fundamental 15% + Commodity 10%. Stale, fallback, and error items are reflected automatically.</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{group.label}</div>
                <div className="mt-1 text-xs text-muted">{group.detail}</div>
              </div>
              <DataStatusPill status={uiStatusFromDataStatus(group.status)} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="font-mono text-2xl font-semibold text-white">{group.score}/100</div>
              {group.penalty ? <div className="text-xs text-caution">Penalty -{group.penalty}</div> : <div className="text-xs text-muted">No penalty</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard label="Macro Regime Confidence" value={`${macroRegimeConfidence(snapshot, currentRegime())}/100`} detail="Reduced when ISM Report on Business is stale or errors." tone={macroRegimeConfidence(snapshot, currentRegime()) >= 70 ? "positive" : "caution"} />
        <StatCard label="Flow Score Confidence" value={`${flowScoreConfidence(snapshot)}/100`} detail="Reduced when KRX investor flow endpoints are stale." tone={flowScoreConfidence(snapshot) >= 70 ? "positive" : "caution"} />
      </div>
      <details className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4" open={!compact}>
        <summary className="cursor-pointer list-none font-semibold text-white">Source fetch logs</summary>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm lg:grid-cols-2">
          {sourceLogs(snapshot).slice(0, compact ? 8 : 30).map((log) => {
            const displayStatus = log.source.toLowerCase().includes("fallback") ? "Fallback" : log.status;
            return (
              <div key={log.id} className="flex items-center justify-between gap-3 rounded border border-white/10 px-3 py-2">
                <span className="truncate text-muted">{log.source}</span>
                <DataStatusPill status={displayStatus} />
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}

function KeyIndicatorPanel({ snapshot }: { snapshot: MarketSnapshot }) {
  const ids = ["spx", "kospi", "vix", "us-10y", "real-yield-10y", "dxy", "usd-krw", "hy-oas", "net-liquidity", "kr-export-20d"];
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Market Indicators" title="핵심 지표" icon={<Gauge className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {ids.map((id) => {
          const indicator = getIndicator(snapshot, id);
          if (!indicator) return null;
          return (
            <details key={id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3" open>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{indicator.name}</div>
                  <div className={indicator.changePercent >= 0 ? "text-positive" : "text-negative"}>{formatPercent(indicator.changePercent)}</div>
                </div>
              </summary>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{formatNumber(indicator.value, indicator.unit)}</span>
                <DataStatusPill status={uiStatusForIndicator(indicator)} />
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-white/50">{label}</div>
      <div className="mt-1 text-sm text-white/80">{value}</div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
        {options.map((option) => <option key={option} value={option}>{localizedOption(option)}</option>)}
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

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
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

function UnitLegend() {
  const rows = [
    ["Rates", "bp change"],
    ["Spreads", "bp change"],
    ["FX / Indices / Commodities", "% change"],
    ["YoY indicators", "pp change"],
    ["Flows", "amount basis + direction"]
  ];
  return (
    <section className="panel rounded-lg p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-muted">Number Unit Legend</div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-5">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-white/50">{label}</div>
            <div className="mt-1 text-white/80">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="block text-white/70">{label}</span>
      <span className="block break-words font-medium text-white">{value}</span>
    </div>
  );
}

export function MarketDashboard() {
  const [active, setActive] = React.useState<NavItem>("Home");
  const [snapshot, setSnapshot] = React.useState<MarketSnapshot>(marketSnapshot);
  const [dataStatus, setDataStatus] = React.useState<"loaded" | "live" | "fallback">("loaded");
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
    if (active === "Home") return <HomeView snapshot={snapshot} />;
    if (active === "Macro Cockpit") return <MacroCockpitView snapshot={snapshot} />;
    if (active === "Macro Regime") return <><MacroRegimeSummary snapshot={snapshot} /><GroupedMacroIndicators snapshot={snapshot} /></>;
    if (active === "Asset Allocation") return <><AssetAllocationView /><PortfolioConstructionView /></>;
    if (active === "Sector & ETF") return <SectorEtfBoard />;
    if (active === "Quality Stocks") return <><QualityStockCandidates /><MidSmallQualityWatchlist /></>;
    if (active === "Commodity") return <CommodityResourceMonitor />;
    if (active === "Portfolio") return <><PortfolioConstructionView /><RiskBudgetView /><MyWatchlistView /></>;
    if (active === "Backtest Lab") return <BacktestLabView />;
    return <RiskAndDataView snapshot={snapshot} />;
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{ko.title}</h1>
            <p className="mt-1 text-sm text-muted">Macro raw inputs · issue tape · events · sector ETF · quality stock allocation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <HeaderStat label="Dashboard Generated At" value={formatFullDateTime(snapshot.generatedAt)} />
          <HeaderStat label="Market Data Basis Date" value={basisDateForGroups(snapshot, ["price", "future", "volatility"])} />
          <HeaderStat label="Macro Data Basis Date" value={basisDateForGroups(snapshot, ["macro", "rates", "inflation", "credit", "liquidity"])} />
          <HeaderStat label="Flow Data Basis Date" value={basisDateForGroups(snapshot, ["flow"])} />
          <HeaderStat label="Fundamental Data Basis Date" value={`${lastTradingDay(snapshot)} modeled`} />
          <HeaderStat label="Issue Tape Updated At" value={issueTapeUpdatedAt()} />
          <HeaderStat label="Next Expected Refresh" value={`${nextRefreshLabel(nextRefreshMs)} / ${refreshCadenceLabel(nextRefreshMs)}`} />
          <HeaderStat label="Reliability / Load State" value={`${reliabilityScore(snapshot)}/100 · ${dataLoadLabel(snapshot, dataStatus)}`} />
        </div>
      </header>

      <div className="mx-auto mt-4 grid max-w-[1680px] grid-cols-1 gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="panel h-fit rounded-lg p-3 lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between px-2 py-1 text-xs uppercase tracking-[0.16em] text-muted">
            <span>{ko.menu}</span>
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
                <span>{navLabel[item]}</span>
                <ChevronDown className={`h-4 w-4 transition ${active === item ? "-rotate-90 text-accent" : "text-white/30"}`} />
              </button>
            ))}
          </nav>
          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">{ko.actionLanguage}</div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>{"\uD655\uB300"}</span><span className="text-positive">{"\uBE44\uC911\uD655\uB300 / \uBD84\uD560\uB9E4\uC218"}</span></div>
              <div className="flex justify-between"><span>{"\uADE0\uD615"}</span><span className="text-muted">{"\uC911\uB9BD"}</span></div>
              <div className="flex justify-between"><span>{"\uC870\uC808"}</span><span className="text-caution">{"\uC77C\uBD80\uCD95\uC18C / \uB9AC\uBC38\uB7F0\uC2F1"}</span></div>
              <div className="flex justify-between"><span>{"\uD68C\uD53C"}</span><span className="text-negative">{"\uB9AC\uC2A4\uD06C \uC7AC\uC810\uAC80"}</span></div>
            </div>
          </div>
        </aside>
        <section className="min-w-0 space-y-6">
          {renderContent()}
          <UnitLegend />
        </section>
      </div>
    </main>
  );
}
