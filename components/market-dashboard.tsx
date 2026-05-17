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
import type {
  DataStatus,
  Indicator,
  IndicatorTone,
  MarketSnapshot,
  SourceFetchLog
} from "@/lib/market-types";

const navItems = [
  "Home",
  "Macro Regime",
  "Asset Allocation",
  "Sector & ETF",
  "Quality Stocks",
  "Mid/Small Quality",
  "Commodity Monitor",
  "Portfolio Construction",
  "Risk & Valuation Alerts",
  "Data Reliability"
] as const;

type NavItem = (typeof navItems)[number];
type AllocationAction = "Overweight" | "Neutral+" | "Neutral" | "Neutral-" | "Underweight" | "Avoid";
type QualityAction = "Core Hold" | "Accumulate" | "Buy on Weakness" | "Valuation Watch" | "Deep Dive Needed" | "Trim" | "Avoid";
type RegimeName = "Goldilocks" | "Reflation" | "Slowdown" | "Stagflation";

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
  suggestedWeight: number;
  previousWeight: number;
  rationale: string;
  riskLevel: "Low" | "Medium" | "High";
  confidence: number;
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
  action: AllocationAction | QualityAction;
  rationale: string;
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

const actionClass: Record<AllocationAction | QualityAction, string> = {
  Overweight: "border-positive/40 bg-positive/10 text-positive",
  "Neutral+": "border-positive/30 bg-positive/5 text-positive",
  Neutral: "border-white/10 bg-white/5 text-white",
  "Neutral-": "border-caution/35 bg-caution/10 text-caution",
  Underweight: "border-caution/45 bg-caution/10 text-caution",
  Avoid: "border-negative/40 bg-negative/10 text-negative",
  "Core Hold": "border-accent/35 bg-accent/10 text-accent",
  Accumulate: "border-positive/40 bg-positive/10 text-positive",
  "Buy on Weakness": "border-positive/35 bg-positive/5 text-positive",
  "Valuation Watch": "border-caution/40 bg-caution/10 text-caution",
  "Deep Dive Needed": "border-white/10 bg-white/5 text-white",
  Trim: "border-caution/45 bg-caution/10 text-caution"
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
  rowAsset("Cash", "Neutral", 1, 6, "Keep dry powder for valuation resets in quality names.", "Low", 78)
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

function rowAsset(assetClass: string, signal: AllocationAction, suggestedWeight: number, previousWeight: number, rationale: string, riskLevel: AssetAllocation["riskLevel"], confidence = 70): AssetAllocation {
  return { assetClass, signal, suggestedWeight, previousWeight, rationale, riskLevel, confidence };
}

function etf(ticker: string, name: string, assetClass: string, sector: string, macroFitScore: number, trendScore: number, valuationScore: number, cycleScore: number, liquidityScore: number, drawdownRisk: number, correlationToPortfolio: number, action: AllocationAction, rationale: string): EtfAllocation {
  return { ticker, name, assetClass, sector, macroFitScore, trendScore, valuationScore, cycleScore, liquidityScore, drawdownRisk, correlationToPortfolio, action, rationale };
}

function stock(ticker: string, name: string, market: QualityStock["market"], sector: string, theme: string, marketCap: number, tradingValue: number, qualityScore: number, businessQualityScore: number, financialQualityScore: number, growthDurabilityScore: number, valuationScore: number, earningsRevisionScore: number, momentumScore: number, liquidityRisk: number, balanceSheetRisk: number, action: QualityAction, investmentThesis: string, keyRisk: string): QualityStock {
  return { ticker, name, market, sector, theme, marketCap, tradingValue, qualityScore, businessQualityScore, financialQualityScore, growthDurabilityScore, valuationScore, earningsRevisionScore, momentumScore, liquidityRisk, balanceSheetRisk, action, investmentThesis, keyRisk };
}

function mid(ticker: string, name: string, market: MidSmallQuality["market"], sector: string, theme: string, marketCap: number, tradingValue: number, qualityScore: number, businessQualityScore: number, financialQualityScore: number, growthDurabilityScore: number, valuationScore: number, earningsRevisionScore: number, momentumScore: number, liquidityRisk: number, balanceSheetRisk: number, action: QualityAction, investmentThesis: string, keyRisk: string, salesGrowth: number, operatingMargin: number, roe: number, roic: number, netDebtToEbitda: number, fcfPositive: boolean, consensusRevisionUp: boolean, drawdownFrom52wHigh: number, foreignInstitutionFlow: number, governanceRisk: number, earningsVisibilityRisk: number, overhangRisk: number): MidSmallQuality {
  return { ...stock(ticker, name, market, sector, theme, marketCap, tradingValue, qualityScore, businessQualityScore, financialQualityScore, growthDurabilityScore, valuationScore, earningsRevisionScore, momentumScore, liquidityRisk, balanceSheetRisk, action, investmentThesis, keyRisk), salesGrowth, operatingMargin, roe, roic, netDebtToEbitda, fcfPositive, consensusRevisionUp, drawdownFrom52wHigh, foreignInstitutionFlow, governanceRisk, earningsVisibilityRisk, overhangRisk };
}

function commodity(category: string, commodityTrend: string, futuresCurve: string, inventoryTrend: string, dollarSensitivity: CommodityMonitor["dollarSensitivity"], chinaDemandSensitivity: CommodityMonitor["chinaDemandSensitivity"], relatedEtfs: string[], relatedStocks: string[], action: CommodityMonitor["action"], rationale = "Use as a macro allocation sleeve; position size should follow commodity trend, balance-sheet quality, and portfolio correlation."): CommodityMonitor {
  return { category, commodityTrend, futuresCurve, inventoryTrend, dollarSensitivity, chinaDemandSensitivity, relatedEtfs, relatedStocks, action, rationale };
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

function getIndicator(snapshot: MarketSnapshot, id: string) {
  return snapshot.indicators.find((indicator) => indicator.id === id);
}

function indicatorStatus(indicator: Indicator): DataStatus {
  if (indicator.quality.status) return indicator.quality.status;
  if (indicator.quality.errorMessage) return "Error";
  if (indicator.quality.stale || indicator.quality.source.toLowerCase().includes("fallback")) return "Stale";
  return "Fresh";
}

function reliabilityScore(snapshot: MarketSnapshot) {
  const weights: Record<DataStatus, number> = { Fresh: 100, Delayed: 72, Stale: 32, Error: 0 };
  const statuses = allDataStatuses(snapshot);
  if (!statuses.length) return 0;
  return Math.round(statuses.reduce((sum, status) => sum + weights[status], 0) / statuses.length);
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
    ...snapshot.indicators.map((item) => indicatorStatus(item)),
    ...sourceLogs(snapshot).map((log) => log.status)
  ];
}

function dataStatusCounts(snapshot: MarketSnapshot) {
  return allDataStatuses(snapshot).reduce<Record<Lowercase<DataStatus>, number>>(
    (counts, status) => {
      counts[status.toLowerCase() as Lowercase<DataStatus>] += 1;
      return counts;
    },
    { fresh: 0, delayed: 0, stale: 0, error: 0 }
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

function ActionPill({ action }: { action: AllocationAction | QualityAction }) {
  return <Pill className={actionClass[action]}>{action}</Pill>;
}

function HomeView({ snapshot }: { snapshot: MarketSnapshot }) {
  return (
    <div className="space-y-6">
      <MacroRegimeSummary snapshot={snapshot} compact />
      <AssetAllocationView compact />
      <SectorEtfBoard compact />
      <QualityStockCandidates compact />
      <MidSmallQualityWatchlist compact />
      <CommodityResourceMonitor compact />
      <RiskValuationAlerts snapshot={snapshot} compact />
      <KeyIndicatorPanel snapshot={snapshot} />
      <DataReliability snapshot={snapshot} compact />
    </div>
  );
}

function MacroRegimeSummary({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  const regime = currentRegime();
  const confidence = macroRegimeConfidence(snapshot, regime);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Macro Regime Summary" title={`${regime.name}: ${regime.quadrant}`} icon={<Globe2 className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-muted">현재 국면</div>
              <div className="mt-2 text-3xl font-semibold text-white">{regime.name}</div>
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

function AssetAllocationView({ compact = false }: { compact?: boolean }) {
  const rows = compact ? assetAllocations.slice(0, 10) : assetAllocations;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Asset Allocation View" title="자산군별 권고 비중" icon={<BriefcaseBusiness className="h-5 w-5" />} />
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
              <tr>{["Asset Class", "Current Signal", "Suggested", "Previous", "Change", "Risk", "Confidence", "Rationale"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.assetClass} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{row.assetClass}</td>
                  <td className="px-4 py-3"><ActionPill action={row.signal} /></td>
                  <td className="px-4 py-3 font-mono text-white">{row.suggestedWeight}%</td>
                  <td className="px-4 py-3 font-mono text-muted">{row.previousWeight}%</td>
                  <td className={(row.suggestedWeight - row.previousWeight) >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-caution"}>{row.suggestedWeight - row.previousWeight >= 0 ? "+" : ""}{row.suggestedWeight - row.previousWeight}%p</td>
                  <td className="px-4 py-3 text-muted">{row.riskLevel}</td>
                  <td className="px-4 py-3 font-mono text-white">{row.confidence}</td>
                  <td className="px-4 py-3 text-muted">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SectorEtfBoard({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = React.useState("");
  const [assetClass, setAssetClass] = React.useState("All");
  const options = ["All", ...Array.from(new Set(etfAllocations.map((item) => item.assetClass)))];
  const rows = etfAllocations
    .filter((row) => assetClass === "All" || row.assetClass === assetClass)
    .filter((row) => `${row.ticker} ${row.name} ${row.sector}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => etfScore(b) - etfScore(a));
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Sector & ETF Allocation Board" title="섹터 ETF와 원자재 ETF 평가" icon={<Layers3 className="h-5 w-5" />} />
      <p className="mb-4 text-sm text-muted">ETF Allocation Score = Macro Fit 30% + Trend 20% + Valuation/Mean Reversion 15% + Earnings or Commodity Cycle 15% + Liquidity 10% + Risk/Drawdown 10%</p>
      {!compact ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input label="Search" value={query} onChange={setQuery} />
          <Select label="Asset Class" value={assetClass} onChange={setAssetClass} options={options} />
        </div>
      ) : null}
      <EtfTable rows={compact ? rows.slice(0, 12) : rows} />
    </section>
  );
}

function EtfTable({ rows }: { rows: EtfAllocation[] }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[1500px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
          <tr>{["ticker", "name", "assetClass", "sector", "allocationScore", "macroFit", "trend", "valuation", "liquidity", "drawdownRisk", "correlation", "action", "rationale"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="border-t border-white/10">
              <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 text-muted">{row.assetClass}</td>
              <td className="px-4 py-3 text-muted">{row.sector}</td>
              <td className="px-4 py-3 font-mono text-white">{etfScore(row)}</td>
              <td className="px-4 py-3 font-mono text-white">{row.macroFitScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.trendScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.valuationScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.liquidityScore}</td>
              <td className="px-4 py-3 font-mono text-caution">{row.drawdownRisk}</td>
              <td className="px-4 py-3 font-mono text-muted">{row.correlationToPortfolio.toFixed(2)}</td>
              <td className="px-4 py-3"><ActionPill action={row.action} /></td>
              <td className="px-4 py-3 text-muted">{row.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualityStockCandidates({ compact = false }: { compact?: boolean }) {
  const rows = [...qualityStocks].sort((a, b) => b.qualityScore - a.qualityScore);
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Quality Stock Candidates" title="퀄리티 종목 후보" icon={<Gem className="h-5 w-5" />} />
      <p className="mb-4 text-sm text-muted">Quality Stock Score = Business Quality 25% + Financial Quality 20% + Growth Durability 20% + Valuation Discipline 15% + Earnings Revision 10% + Liquidity/Risk 10%</p>
      <QualityStockTable rows={compact ? rows.slice(0, 8) : rows} />
    </section>
  );
}

function QualityStockTable({ rows }: { rows: QualityStock[] }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <table className="w-full min-w-[1700px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
          <tr>{["ticker", "name", "market", "sector", "theme", "marketCap", "tradingValue", "qualityScore", "businessQuality", "financialQuality", "growthDurability", "valuation", "earningsRevision", "momentum", "liquidityRisk", "balanceSheetRisk", "action", "investmentThesis", "keyRisk"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker} className="border-t border-white/10">
              <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
              <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
              <td className="px-4 py-3 text-muted">{row.market}</td>
              <td className="px-4 py-3 text-muted">{row.sector}</td>
              <td className="px-4 py-3 text-muted">{row.theme}</td>
              <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.marketCap)}</td>
              <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.tradingValue)}</td>
              <td className="px-4 py-3 font-mono text-positive">{qualityFormulaScore(row)}</td>
              <td className="px-4 py-3 font-mono text-white">{row.businessQualityScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.financialQualityScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.growthDurabilityScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.valuationScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.earningsRevisionScore}</td>
              <td className="px-4 py-3 font-mono text-white">{row.momentumScore}</td>
              <td className="px-4 py-3 font-mono text-caution">{row.liquidityRisk}</td>
              <td className="px-4 py-3 font-mono text-caution">{row.balanceSheetRisk}</td>
              <td className="px-4 py-3"><ActionPill action={row.action} /></td>
              <td className="px-4 py-3 text-muted">{row.investmentThesis}</td>
              <td className="px-4 py-3 text-muted">{row.keyRisk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MidSmallQualityWatchlist({ compact = false }: { compact?: boolean }) {
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
    .sort((a, b) => b.qualityScore - a.qualityScore);
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
          <Toggle label="FCF positive only" checked={fcfOnly} onChange={setFcfOnly} />
          <Toggle label="Revision up only" checked={revisionOnly} onChange={setRevisionOnly} />
        </div>
      ) : null}
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1500px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>{["ticker", "name", "marketCap", "tradingValue", "revenueGrowth", "OPM", "ROE", "ROIC", "netDebt/EBITDA", "FCF", "revision", "52W drawdown", "foreignFlow", "institutionFlow", "liquidityRisk", "governanceRisk", "balanceSheetRisk", "visibilityRisk", "CBOverhangRisk", "action"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker} className="border-t border-white/10">
                <td className="px-4 py-3 font-mono text-white">{row.ticker}</td>
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.marketCap)}</td>
                <td className="px-4 py-3 font-mono text-muted">{formatNumber(row.tradingValue)}</td>
                <td className="px-4 py-3 text-positive">{formatPercent(row.salesGrowth)}</td>
                <td className="px-4 py-3 font-mono text-white">{row.operatingMargin}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.roe}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.roic}%</td>
                <td className="px-4 py-3 font-mono text-white">{row.netDebtToEbitda.toFixed(1)}x</td>
                <td className="px-4 py-3">{row.fcfPositive ? <Pill className={toneClass.positive}>Yes</Pill> : <Pill className={toneClass.caution}>No</Pill>}</td>
                <td className="px-4 py-3">{row.consensusRevisionUp ? <Pill className={toneClass.positive}>Up</Pill> : <Pill className={toneClass.caution}>Flat/Down</Pill>}</td>
                <td className="px-4 py-3 text-caution">{formatPercent(row.drawdownFrom52wHigh)}</td>
                <td className={row.foreignInstitutionFlow >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.foreignInstitutionFlow)}</td>
                <td className={row.foreignInstitutionFlow >= 0 ? "px-4 py-3 text-positive" : "px-4 py-3 text-negative"}>{formatNumber(row.foreignInstitutionFlow * 0.6)}</td>
                <td className="px-4 py-3 text-caution">{row.liquidityRisk}</td>
                <td className="px-4 py-3 text-caution">{row.governanceRisk}</td>
                <td className="px-4 py-3 text-caution">{row.balanceSheetRisk}</td>
                <td className="px-4 py-3 text-caution">{row.earningsVisibilityRisk}</td>
                <td className="px-4 py-3 text-caution">{row.overhangRisk}</td>
                <td className="px-4 py-3"><ActionPill action={row.action} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CommodityResourceMonitor({ compact = false }: { compact?: boolean }) {
  const rows = compact ? commodityMonitors.slice(0, 9) : commodityMonitors;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Commodity & Resource Equity Monitor" title="원자재와 리소스 기업 모니터" icon={<Factory className="h-5 w-5" />} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {rows.map((row) => (
          <details key={row.category} className="rounded-lg border border-white/10 bg-white/[0.03] p-4" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{row.category}</div>
                  <div className="text-xs text-muted">{row.commodityTrend}</div>
                </div>
                <ActionPill action={row.action} />
              </div>
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <InfoBlock label="Underlying Commodity Trend" value={row.commodityTrend} />
              <InfoBlock label="Futures Curve" value={row.futuresCurve} />
              <InfoBlock label="Inventory Trend" value={row.inventoryTrend} />
              <InfoBlock label="Dollar / China Sensitivity" value={`${row.dollarSensitivity} / ${row.chinaDemandSensitivity}`} />
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

function RiskValuationAlerts({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  const rows = compact ? riskAlerts.slice(0, 6) : riskAlerts;
  return (
    <section className="panel rounded-lg p-5">
      <SectionHeader eyebrow="Risk & Valuation Alerts" title="리스크와 밸류에이션 알림" icon={<ShieldAlert className="h-5 w-5" />} />
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

function DataReliability({ snapshot, compact = false }: { snapshot: MarketSnapshot; compact?: boolean }) {
  const counts = dataStatusCounts(snapshot);
  const groups = reliabilityGroups(snapshot);
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
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{group.label}</div>
                <div className="mt-1 text-xs text-muted">{group.detail}</div>
              </div>
              <Pill className={statusClass[group.status]}>{group.status}</Pill>
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
          {sourceLogs(snapshot).slice(0, compact ? 8 : 30).map((log) => (
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
                <Pill className={statusClass[indicatorStatus(indicator)]}>{indicatorStatus(indicator)}</Pill>
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

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="block text-white/70">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

export function MarketDashboard() {
  const [active, setActive] = React.useState<NavItem>("Home");
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
    if (active === "Home") return <HomeView snapshot={snapshot} />;
    if (active === "Macro Regime") return <><MacroRegimeSummary snapshot={snapshot} /><KeyIndicatorPanel snapshot={snapshot} /></>;
    if (active === "Asset Allocation") return <><AssetAllocationView /><PortfolioConstructionView /></>;
    if (active === "Sector & ETF") return <SectorEtfBoard />;
    if (active === "Quality Stocks") return <QualityStockCandidates />;
    if (active === "Mid/Small Quality") return <MidSmallQualityWatchlist />;
    if (active === "Commodity Monitor") return <CommodityResourceMonitor />;
    if (active === "Portfolio Construction") return <PortfolioConstructionView />;
    if (active === "Risk & Valuation Alerts") return <RiskValuationAlerts snapshot={snapshot} />;
    return <DataReliability snapshot={snapshot} />;
  };

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-[1680px] flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Top-down Quality Investment Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Macro · Sector ETF · Commodity · Quality Stock Allocation · KST {formatDateTime(snapshot.generatedAt)}</p>
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

      <div className="mx-auto mt-4 grid max-w-[1680px] grid-cols-1 gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="panel h-fit rounded-lg p-3 lg:sticky lg:top-4">
          <div className="mb-3 flex items-center justify-between px-2 py-1 text-xs uppercase tracking-[0.16em] text-muted">
            <span>Views</span>
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
            <div className="text-xs uppercase tracking-[0.14em] text-muted">Investment Language</div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><span>Increase</span><span className="text-positive">Overweight / Accumulate</span></div>
              <div className="flex justify-between"><span>Balanced</span><span className="text-muted">Neutral</span></div>
              <div className="flex justify-between"><span>Control</span><span className="text-caution">Trim / Rebalance</span></div>
              <div className="flex justify-between"><span>Avoid</span><span className="text-negative">Risk Review</span></div>
            </div>
          </div>
        </aside>
        <section className="min-w-0 space-y-6">{renderContent()}</section>
      </div>
    </main>
  );
}
