import type {
  AlertSeverity,
  CalendarEvent,
  DataAccess,
  DataQuality,
  Indicator,
  IndicatorTone,
  MarketAlert,
  MarketSnapshot,
  Region,
  SparkPoint,
  ThemeMomentum
} from "./market-types";
import { changePercent, makeMarketScore } from "./score";

const generatedAt = "2026-05-15T09:10:00+09:00";
const koreaBaseDate = "2026-05-14";
const usBaseDate = "2026-05-14";

function quality(
  source: string,
  frequency: string,
  baseDate: string,
  lastUpdated: string,
  access: DataAccess,
  stale = false,
  sourceUrl?: string
): DataQuality {
  return { source, frequency, baseDate, lastUpdated, access, stale, sourceUrl };
}

function spark(seed: number, drift = 0.35): SparkPoint[] {
  const dates = [
    "04-17",
    "04-18",
    "04-21",
    "04-22",
    "04-23",
    "04-24",
    "04-25",
    "04-28",
    "04-29",
    "04-30",
    "05-01",
    "05-02",
    "05-05",
    "05-06",
    "05-07",
    "05-08",
    "05-09",
    "05-12",
    "05-13",
    "05-14"
  ];

  return dates.map((date, index) => ({
    date,
    value: Number((seed + Math.sin(index / 2) * seed * 0.008 + index * drift).toFixed(2))
  }));
}

function indicator(input: {
  id: string;
  name: string;
  region: Region;
  group: Indicator["group"];
  value: number;
  previousClose: number;
  unit?: string;
  tone?: IndicatorTone;
  source: string;
  frequency?: string;
  baseDate?: string;
  lastUpdated?: string;
  access?: DataAccess;
  stale?: boolean;
  description?: string;
  sourceUrl?: string;
  drift?: number;
}): Indicator {
  const change = changePercent(input.value, input.previousClose);
  const tone = input.tone ?? (change > 0 ? "positive" : change < 0 ? "negative" : "neutral");

  return {
    id: input.id,
    name: input.name,
    region: input.region,
    group: input.group,
    value: input.value,
    unit: input.unit ?? "pt",
    previousClose: input.previousClose,
    changePercent: change,
    tone,
    description: input.description,
    sparkline: spark(input.previousClose, input.drift ?? change / 6),
    quality: quality(
      input.source,
      input.frequency ?? "Daily",
      input.baseDate ?? (input.region === "us" ? usBaseDate : koreaBaseDate),
      input.lastUpdated ?? generatedAt,
      input.access ?? "free",
      input.stale,
      input.sourceUrl
    )
  };
}

const indicators: Indicator[] = [
  indicator({ id: "kospi", name: "코스피", region: "korea", group: "price", value: 2746.8, previousClose: 2728.6, source: "KRX", sourceUrl: "https://data.krx.co.kr" }),
  indicator({ id: "kosdaq", name: "코스닥", region: "korea", group: "price", value: 866.4, previousClose: 873.2, source: "KRX", tone: "negative" }),
  indicator({ id: "kospi200", name: "코스피200", region: "korea", group: "price", value: 373.9, previousClose: 370.2, source: "KRX" }),
  indicator({ id: "kosdaq150", name: "코스닥150", region: "korea", group: "price", value: 1432.1, previousClose: 1452.6, source: "KRX", tone: "negative" }),
  indicator({ id: "krx300", name: "KRX300", region: "korea", group: "price", value: 1684.3, previousClose: 1669.7, source: "KRX" }),
  indicator({ id: "k200-fut", name: "코스피200 선물", region: "korea", group: "future", value: 374.45, previousClose: 371.4, source: "KRX" }),
  indicator({ id: "mini-k200-fut", name: "미니코스피200 선물", region: "korea", group: "future", value: 374.1, previousClose: 371.25, source: "KRX" }),
  indicator({ id: "kq150-fut", name: "코스닥150 선물", region: "korea", group: "future", value: 1438.5, previousClose: 1457.2, source: "KRX", tone: "negative" }),
  indicator({ id: "k200-night", name: "코스피200 야간선물", region: "korea", group: "future", value: 375.3, previousClose: 371.8, source: "KRX/Eurex", access: "paid" }),
  indicator({ id: "kq150-night", name: "코스닥150 야간선물", region: "korea", group: "future", value: 1431.2, previousClose: 1451.4, source: "KRX/Eurex", access: "paid", tone: "negative" }),
  indicator({ id: "foreign-kospi-flow", name: "외국인 코스피 순매수", region: "korea", group: "flow", value: -3840, previousClose: -2110, unit: "억원", source: "KRX", tone: "negative" }),
  indicator({ id: "institution-flow", name: "기관 순매수", region: "korea", group: "flow", value: 1260, previousClose: 820, unit: "억원", source: "KRX" }),
  indicator({ id: "pension-flow", name: "연기금 순매수", region: "korea", group: "flow", value: 730, previousClose: 440, unit: "억원", source: "KRX" }),
  indicator({ id: "financial-investment-flow", name: "금융투자 순매수", region: "korea", group: "flow", value: -910, previousClose: -350, unit: "억원", source: "KRX", tone: "negative" }),
  indicator({ id: "retail-flow", name: "개인 순매수", region: "korea", group: "flow", value: 2580, previousClose: 1290, unit: "억원", source: "KRX", tone: "caution" }),
  indicator({ id: "program-trading", name: "프로그램 매매", region: "korea", group: "flow", value: -1420, previousClose: -620, unit: "억원", source: "KRX", tone: "negative" }),
  indicator({ id: "short-sale-value", name: "공매도 거래대금", region: "korea", group: "sentiment", value: 8120, previousClose: 7340, unit: "억원", source: "KRX", tone: "caution" }),
  indicator({ id: "stock-lending", name: "대차잔고", region: "korea", group: "sentiment", value: 74.6, previousClose: 74.1, unit: "조원", source: "KSD", access: "paid", tone: "caution", stale: true }),
  indicator({ id: "margin-loan", name: "신용융자", region: "korea", group: "liquidity", value: 19.4, previousClose: 19.2, unit: "조원", source: "KOFIA", tone: "caution" }),
  indicator({ id: "customer-deposits", name: "고객예탁금", region: "korea", group: "liquidity", value: 56.8, previousClose: 55.9, unit: "조원", source: "KOFIA" }),
  indicator({ id: "usd-krw", name: "USD/KRW", region: "macro", group: "rates", value: 1378.2, previousClose: 1365.4, unit: "원", source: "Bank of Korea", tone: "negative" }),
  indicator({ id: "dxy", name: "DXY", region: "macro", group: "rates", value: 104.8, previousClose: 104.2, source: "ICE", access: "paid", tone: "negative" }),
  indicator({ id: "kr-advancers", name: "상승종목 수", region: "korea", group: "breadth", value: 832, previousClose: 1014, unit: "개", source: "KRX", tone: "negative" }),
  indicator({ id: "kr-decliners", name: "하락종목 수", region: "korea", group: "breadth", value: 1186, previousClose: 996, unit: "개", source: "KRX", tone: "negative" }),
  indicator({ id: "kr-above-ma20", name: "20일선 위 종목", region: "korea", group: "breadth", value: 48.2, previousClose: 51.4, unit: "%", source: "Internal calculation", tone: "negative" }),
  indicator({ id: "kr-above-ma60", name: "60일선 위 종목", region: "korea", group: "breadth", value: 55.1, previousClose: 57.8, unit: "%", source: "Internal calculation", tone: "negative" }),
  indicator({ id: "kr-above-ma200", name: "200일선 위 종목", region: "korea", group: "breadth", value: 61.6, previousClose: 60.2, unit: "%", source: "Internal calculation" }),
  indicator({ id: "kr-52w-high", name: "52주 신고가", region: "korea", group: "breadth", value: 71, previousClose: 64, unit: "개", source: "KRX" }),
  indicator({ id: "kr-52w-low", name: "52주 신저가", region: "korea", group: "breadth", value: 86, previousClose: 74, unit: "개", source: "KRX", tone: "negative" }),

  indicator({ id: "spx", name: "S&P500", region: "us", group: "price", value: 5324.7, previousClose: 5297.1, source: "Stooq/Yahoo Finance" }),
  indicator({ id: "nasdaq-composite", name: "Nasdaq Composite", region: "us", group: "price", value: 16842.2, previousClose: 16716.4, source: "Stooq/Yahoo Finance" }),
  indicator({ id: "ndx", name: "Nasdaq100", region: "us", group: "price", value: 18872.5, previousClose: 18698.9, source: "Nasdaq" }),
  indicator({ id: "dow", name: "Dow", region: "us", group: "price", value: 39869.4, previousClose: 39702.8, source: "Stooq/Yahoo Finance" }),
  indicator({ id: "russell2000", name: "Russell2000", region: "us", group: "price", value: 2096.4, previousClose: 2082.1, source: "FTSE Russell", access: "paid" }),
  indicator({ id: "sox", name: "SOX", region: "us", group: "price", value: 5142.8, previousClose: 5018.6, source: "Nasdaq", tone: "positive" }),
  indicator({ id: "spx-equal-weight", name: "S&P500 Equal Weight", region: "us", group: "breadth", value: 7021.8, previousClose: 7009.5, source: "S&P Dow Jones", access: "paid" }),
  indicator({ id: "es-fut", name: "S&P500 선물", region: "us", group: "future", value: 5342.0, previousClose: 5316.5, source: "CME", access: "paid" }),
  indicator({ id: "nq-fut", name: "Nasdaq100 선물", region: "us", group: "future", value: 19024.5, previousClose: 18813.2, source: "CME", access: "paid" }),
  indicator({ id: "ym-fut", name: "Dow 선물", region: "us", group: "future", value: 39980, previousClose: 39820, source: "CME", access: "paid" }),
  indicator({ id: "rty-fut", name: "Russell2000 선물", region: "us", group: "future", value: 2104.9, previousClose: 2090.2, source: "CME", access: "paid" }),
  indicator({ id: "vix", name: "VIX", region: "us", group: "volatility", value: 14.9, previousClose: 12.6, source: "CBOE", tone: "negative" }),
  indicator({ id: "vxn", name: "VXN", region: "us", group: "volatility", value: 18.4, previousClose: 17.1, source: "CBOE", tone: "caution" }),
  indicator({ id: "vvix", name: "VVIX", region: "us", group: "volatility", value: 86.2, previousClose: 82.4, source: "CBOE", tone: "caution" }),
  indicator({ id: "move", name: "MOVE", region: "us", group: "volatility", value: 104.1, previousClose: 99.8, source: "ICE/BofA", access: "paid", tone: "caution" }),
  indicator({ id: "put-call", name: "Put/Call Ratio", region: "us", group: "sentiment", value: 0.82, previousClose: 0.76, source: "CBOE", tone: "caution" }),
  indicator({ id: "spy-flow", name: "SPY ETF Flow", region: "us", group: "flow", value: 1.9, previousClose: -0.4, unit: "십억달러", source: "ETF.com", access: "paid" }),
  indicator({ id: "qqq-flow", name: "QQQ ETF Flow", region: "us", group: "flow", value: 0.8, previousClose: 0.2, unit: "십억달러", source: "ETF.com", access: "paid" }),
  indicator({ id: "iwm-flow", name: "IWM ETF Flow", region: "us", group: "flow", value: -0.3, previousClose: -0.1, unit: "십억달러", source: "ETF.com", access: "paid", tone: "negative" }),
  indicator({ id: "cftc-spx", name: "CFTC S&P500 Net", region: "us", group: "flow", value: 42.5, previousClose: 36.9, unit: "천계약", source: "CFTC", frequency: "Weekly" }),
  indicator({ id: "cftc-nq", name: "CFTC Nasdaq100 Net", region: "us", group: "flow", value: 18.4, previousClose: 15.3, unit: "천계약", source: "CFTC", frequency: "Weekly" }),
  indicator({ id: "cftc-10y", name: "CFTC 10Y Treasury Net", region: "us", group: "rates", value: -611.2, previousClose: -584.7, unit: "천계약", source: "CFTC", frequency: "Weekly", tone: "caution" }),
  indicator({ id: "cftc-dollar", name: "CFTC Dollar Net", region: "us", group: "rates", value: 21.8, previousClose: 18.2, unit: "천계약", source: "CFTC", frequency: "Weekly", tone: "negative" }),
  indicator({ id: "aaii", name: "AAII Bull-Bear Spread", region: "us", group: "sentiment", value: 17.4, previousClose: 12.6, unit: "%p", source: "AAII", frequency: "Weekly" }),
  indicator({ id: "finra-margin", name: "FINRA Margin Debt", region: "us", group: "liquidity", value: 812.3, previousClose: 798.5, unit: "십억달러", source: "FINRA", frequency: "Monthly", stale: true, tone: "caution" }),

  indicator({ id: "us-2y", name: "미국채 2년", region: "macro", group: "rates", value: 4.82, previousClose: 4.76, unit: "%", source: "FRED" }),
  indicator({ id: "us-10y", name: "미국채 10년", region: "macro", group: "rates", value: 4.51, previousClose: 4.42, unit: "%", source: "FRED", tone: "negative" }),
  indicator({ id: "us-30y", name: "미국채 30년", region: "macro", group: "rates", value: 4.66, previousClose: 4.58, unit: "%", source: "FRED", tone: "negative" }),
  indicator({ id: "real-yield-10y", name: "미국 10년 실질금리", region: "macro", group: "rates", value: 2.14, previousClose: 2.06, unit: "%", source: "FRED", tone: "negative" }),
  indicator({ id: "bei-10y", name: "10년 BEI", region: "macro", group: "inflation", value: 2.37, previousClose: 2.34, unit: "%", source: "FRED", tone: "caution" }),
  indicator({ id: "yield-10y-2y", name: "10년-2년 금리차", region: "macro", group: "rates", value: -31, previousClose: -34, unit: "bp", source: "Internal calculation", tone: "neutral" }),
  indicator({ id: "kr-3y", name: "한국 국고채 3년", region: "macro", group: "rates", value: 3.42, previousClose: 3.38, unit: "%", source: "Bank of Korea" }),
  indicator({ id: "kr-10y", name: "한국 국고채 10년", region: "macro", group: "rates", value: 3.61, previousClose: 3.54, unit: "%", source: "Bank of Korea", tone: "negative" }),
  indicator({ id: "hy-oas", name: "미국 HY OAS", region: "macro", group: "credit", value: 335, previousClose: 328, unit: "bp", source: "FRED", tone: "negative" }),
  indicator({ id: "ig-oas", name: "미국 IG OAS", region: "macro", group: "credit", value: 91, previousClose: 88, unit: "bp", source: "FRED", tone: "caution" }),
  indicator({ id: "fed-assets", name: "Fed 총자산", region: "macro", group: "liquidity", value: 7.28, previousClose: 7.31, unit: "조달러", source: "Federal Reserve H.4.1", frequency: "Weekly", tone: "negative" }),
  indicator({ id: "tga", name: "TGA", region: "macro", group: "liquidity", value: 0.78, previousClose: 0.74, unit: "조달러", source: "US Treasury", tone: "negative" }),
  indicator({ id: "rrp", name: "RRP", region: "macro", group: "liquidity", value: 0.42, previousClose: 0.45, unit: "조달러", source: "New York Fed" }),
  indicator({ id: "bank-reserves", name: "은행 지급준비금", region: "macro", group: "liquidity", value: 3.26, previousClose: 3.22, unit: "조달러", source: "Federal Reserve" }),
  indicator({ id: "net-liquidity", name: "Net Liquidity Proxy", region: "macro", group: "liquidity", value: 6.08, previousClose: 6.12, unit: "조달러", source: "Fed - TGA - RRP", tone: "negative" }),
  indicator({ id: "sofr", name: "SOFR", region: "macro", group: "rates", value: 5.31, previousClose: 5.31, unit: "%", source: "New York Fed", tone: "neutral" }),
  indicator({ id: "usd-jpy", name: "USD/JPY", region: "macro", group: "rates", value: 156.3, previousClose: 155.2, unit: "엔", source: "Bank of Japan", tone: "negative" }),
  indicator({ id: "cpi", name: "CPI", region: "macro", group: "inflation", value: 3.4, previousClose: 3.5, unit: "% YoY", source: "BLS", frequency: "Monthly", tone: "positive" }),
  indicator({ id: "core-cpi", name: "Core CPI", region: "macro", group: "inflation", value: 3.6, previousClose: 3.8, unit: "% YoY", source: "BLS", frequency: "Monthly", tone: "positive" }),
  indicator({ id: "pce", name: "PCE", region: "macro", group: "inflation", value: 2.7, previousClose: 2.8, unit: "% YoY", source: "BEA", frequency: "Monthly", tone: "positive" }),
  indicator({ id: "core-pce", name: "Core PCE", region: "macro", group: "inflation", value: 2.8, previousClose: 2.8, unit: "% YoY", source: "BEA", frequency: "Monthly", tone: "neutral" }),
  indicator({ id: "cleveland-nowcast", name: "Cleveland Fed Nowcast", region: "macro", group: "inflation", value: 3.3, previousClose: 3.2, unit: "% YoY", source: "Cleveland Fed", tone: "caution" }),
  indicator({ id: "ism-mfg", name: "ISM 제조업", region: "macro", group: "macro", value: 49.8, previousClose: 50.3, source: "ISM", frequency: "Monthly", tone: "caution" }),
  indicator({ id: "ism-services", name: "ISM 서비스업", region: "macro", group: "macro", value: 52.1, previousClose: 51.4, source: "ISM", frequency: "Monthly" }),
  indicator({ id: "jobless-claims", name: "신규실업수당 청구", region: "macro", group: "macro", value: 221, previousClose: 227, unit: "천건", source: "Department of Labor" }),
  indicator({ id: "unemployment", name: "실업률", region: "macro", group: "macro", value: 3.9, previousClose: 3.8, unit: "%", source: "BLS", frequency: "Monthly", tone: "caution" }),
  indicator({ id: "retail-sales", name: "소매판매", region: "macro", group: "macro", value: 0.4, previousClose: 0.1, unit: "% MoM", source: "US Census", frequency: "Monthly" }),
  indicator({ id: "kr-export-20d", name: "한국 수출 1~20일", region: "macro", group: "macro", value: 11.8, previousClose: 9.2, unit: "% YoY", source: "Korea Customs Service" }),
  indicator({ id: "kr-trade-balance", name: "한국 무역수지", region: "macro", group: "macro", value: 3.9, previousClose: 2.1, unit: "십억달러", source: "Korea Customs Service" })
];

function theme(
  name: string,
  region: "korea" | "us",
  score: number,
  oneDay: number,
  fiveDay: number,
  volumeRatio: number,
  leaders: string[],
  source: string,
  access: DataAccess = "free"
): ThemeMomentum {
  const tone: IndicatorTone = score >= 70 ? "positive" : score >= 45 ? "neutral" : "negative";
  return {
    name,
    region,
    score,
    oneDay,
    fiveDay,
    volumeRatio,
    leaders,
    tone,
    quality: quality(source, "Daily", region === "us" ? usBaseDate : koreaBaseDate, generatedAt, access)
  };
}

const themes: ThemeMomentum[] = [
  theme("반도체", "korea", 84, 2.7, 6.4, 1.8, ["SK하이닉스", "한미반도체", "이오테크닉스"], "KRX + internal baskets"),
  theme("AI인프라", "korea", 78, 1.6, 4.2, 1.5, ["HD현대일렉트릭", "LS ELECTRIC", "효성중공업"], "KRX + internal baskets"),
  theme("바이오", "korea", 51, -0.4, 1.2, 0.9, ["삼성바이오로직스", "리가켐바이오"], "KRX + internal baskets"),
  theme("조선", "korea", 72, 1.3, 3.9, 1.4, ["HD현대중공업", "한화오션"], "KRX + internal baskets"),
  theme("방산", "korea", 67, 0.8, 2.5, 1.1, ["한화에어로스페이스", "LIG넥스원"], "KRX + internal baskets"),
  theme("원전", "korea", 63, 0.3, 2.1, 1.0, ["두산에너빌리티", "비에이치아이"], "KRX + internal baskets"),
  theme("2차전지", "korea", 32, -1.9, -5.4, 1.3, ["LG에너지솔루션", "에코프로비엠"], "KRX + internal baskets"),
  theme("로봇", "korea", 56, 0.4, 1.8, 1.0, ["레인보우로보틱스", "두산로보틱스"], "KRX + internal baskets"),
  theme("밸류업", "korea", 61, 0.5, 1.9, 1.2, ["KB금융", "현대차", "삼성물산"], "KRX + internal baskets"),
  theme("AI", "us", 88, 2.1, 7.2, 1.7, ["NVDA", "MSFT", "META"], "Nasdaq + internal baskets"),
  theme("반도체", "us", 86, 2.5, 8.1, 1.9, ["NVDA", "AVGO", "AMD"], "Nasdaq + internal baskets"),
  theme("빅테크", "us", 81, 1.4, 4.8, 1.4, ["MSFT", "AAPL", "GOOGL"], "Nasdaq + internal baskets"),
  theme("전력망", "us", 74, 1.1, 3.5, 1.3, ["ETN", "GEV", "PWR"], "Nasdaq + internal baskets"),
  theme("ESS", "us", 57, 0.2, 1.4, 1.0, ["TSLA", "FLNC", "STEM"], "Nasdaq + internal baskets"),
  theme("원전/우라늄", "us", 66, 0.7, 2.8, 1.2, ["CCJ", "CEG", "UEC"], "Nasdaq + internal baskets"),
  theme("바이오텍", "us", 42, -0.8, -1.9, 0.8, ["XBI", "MRNA", "REGN"], "Nasdaq + internal baskets"),
  theme("금융", "us", 59, 0.2, 1.1, 0.9, ["JPM", "GS", "BAC"], "Nasdaq + internal baskets"),
  theme("중소형주", "us", 46, -0.3, -1.4, 0.8, ["IWM", "RVT", "VTWO"], "Nasdaq + internal baskets")
];

function alert(
  id: string,
  title: string,
  detail: string,
  severity: AlertSeverity,
  region: Region,
  rule: string,
  sourceIndicatorIds: string[]
): MarketAlert {
  return {
    id,
    title,
    detail,
    severity,
    region,
    rule,
    sourceIndicatorIds,
    triggeredAt: generatedAt
  };
}

const alerts: MarketAlert[] = [
  alert("vix-spike", "VIX 급등", "VIX가 전일 대비 18.25% 상승해 변동성 경계 구간에 진입했습니다.", "critical", "us", "VIX가 전일 대비 15% 이상 상승", ["vix"]),
  alert("usdkrw-breakout", "USD/KRW 20일 신고가", "원/달러 환율이 20일 고점을 돌파해 국내 위험자산에 부담입니다.", "warning", "macro", "USD/KRW가 20일 신고가 돌파", ["usd-krw"]),
  alert("foreign-selling", "외국인 코스피 매도 지속", "외국인이 코스피 현물을 3거래일 연속 순매도했습니다.", "warning", "korea", "외국인 코스피 현물 3일 연속 순매도", ["foreign-kospi-flow"]),
  alert("weak-breadth", "지수 상승 대비 내부강도 약화", "코스피는 상승했지만 상승종목 비율이 40%대 초반에 머물고 있습니다.", "warning", "korea", "상승종목 비율이 40% 이하인데 지수만 상승", ["kospi", "kr-advancers", "kr-decliners"]),
  alert("sox-high", "SOX 52주 신고가 접근", "미국 반도체 모멘텀이 시장 주도 테마로 재부상했습니다.", "info", "us", "SOX 52주 신고가", ["sox"])
];

const calendar: CalendarEvent[] = [
  { id: "us-cpi", title: "미국 CPI 발표", region: "macro", startsAt: "2026-05-20T21:30:00+09:00", importance: "high", source: "BLS" },
  { id: "fomc-minutes", title: "FOMC 의사록", region: "macro", startsAt: "2026-05-21T03:00:00+09:00", importance: "high", source: "Federal Reserve" },
  { id: "kr-export", title: "한국 수출 1~20일", region: "macro", startsAt: "2026-05-21T09:00:00+09:00", importance: "medium", source: "Korea Customs Service" },
  { id: "nvidia-earnings", title: "NVIDIA 실적", region: "us", startsAt: "2026-05-22T05:00:00+09:00", importance: "high", source: "Company IR" },
  { id: "bok-rate", title: "한국은행 금통위", region: "korea", startsAt: "2026-05-28T10:00:00+09:00", importance: "high", source: "Bank of Korea" }
];

const scores = [
  makeMarketScore("global-risk", "Global Risk Score", "global", { trend: 69, breadth: 54, liquidity: 48, ratesCredit: 42, flow: 57, sentimentVolatility: 36 }, generatedAt),
  makeMarketScore("korea-market", "Korea Market Score", "korea", { trend: 61, breadth: 44, liquidity: 57, ratesCredit: 40, flow: 39, sentimentVolatility: 48 }, generatedAt),
  makeMarketScore("us-market", "US Market Score", "us", { trend: 76, breadth: 58, liquidity: 45, ratesCredit: 43, flow: 65, sentimentVolatility: 38 }, generatedAt),
  makeMarketScore("liquidity", "Liquidity Score", "macro", { trend: 50, breadth: 50, liquidity: 46, ratesCredit: 45, flow: 49, sentimentVolatility: 50 }, generatedAt),
  makeMarketScore("breadth", "Breadth Score", "global", { trend: 50, breadth: 49, liquidity: 50, ratesCredit: 50, flow: 50, sentimentVolatility: 50 }, generatedAt),
  makeMarketScore("volatility", "Volatility Score", "global", { trend: 50, breadth: 50, liquidity: 50, ratesCredit: 50, flow: 50, sentimentVolatility: 34 }, generatedAt)
];

export const marketSnapshot: MarketSnapshot = {
  generatedAt,
  timezone: {
    korea: "Asia/Seoul",
    us: "America/New_York"
  },
  scores,
  indicators,
  themes,
  alerts,
  calendar
};

export function getIndicators(region?: Region, group?: Indicator["group"]) {
  return marketSnapshot.indicators.filter((item) => {
    const regionMatches = region ? item.region === region : true;
    const groupMatches = group ? item.group === group : true;
    return regionMatches && groupMatches;
  });
}

export function getScore(id: string) {
  return marketSnapshot.scores.find((score) => score.id === id);
}
