import { marketSnapshot } from "./market-data";
import type {
  AlertSeverity,
  DataStatus,
  Indicator,
  IndicatorTone,
  MarketAlert,
  MarketSnapshot,
  SourceFetchLog,
  SparkPoint,
  ThemeMomentum
} from "./market-types";
import { changePercent, clampScore, makeMarketScore, movingAverage } from "./score";

type Fetcher = typeof fetch;

type PriceSeries = {
  source: string;
  sourceUrl: string;
  baseDate: string;
  lastUpdated: string;
  value: number;
  previousClose: number;
  changePercent: number;
  sparkline: SparkPoint[];
  volumeRatio?: number;
  high52Week?: boolean;
};

type FredSeries = {
  source: string;
  sourceUrl: string;
  baseDate: string;
  lastUpdated: string;
  value: number;
  previousClose: number;
  changePercent: number;
  sparkline: SparkPoint[];
  rawValues: number[];
};

type BlsSeries = {
  source: string;
  sourceUrl: string;
  frequency: string;
  baseDate: string;
  lastUpdated: string;
  value: number;
  previousClose: number;
  changePercent: number;
  sparkline: SparkPoint[];
};

type CftcSeries = {
  source: string;
  sourceUrl: string;
  baseDate: string;
  lastUpdated: string;
  value: number;
  previousClose: number;
  changePercent: number;
  sparkline: SparkPoint[];
};

type DatedSeries = {
  source: string;
  sourceUrl: string;
  frequency: string;
  baseDate: string;
  lastUpdated: string;
  value: number;
  previousClose: number;
  changePercent: number;
  sparkline: SparkPoint[];
};

type TreasuryCurveRow = {
  date: string;
  values: Record<string, number>;
};

type Update = Partial<Indicator> & {
  id: string;
};

const yahooSources: Record<string, string[]> = {
  kospi: ["^KS11"],
  kosdaq: ["^KQ11", "KQ11.KQ"],
  kospi200: ["^KS200", "KS200.KS", "102110.KS"],
  "usd-krw": ["KRW=X"],
  dxy: ["DX-Y.NYB"],
  spx: ["^GSPC"],
  "nasdaq-composite": ["^IXIC"],
  ndx: ["^NDX"],
  dow: ["^DJI"],
  russell2000: ["^RUT"],
  sox: ["^SOX"],
  "spx-equal-weight": ["^SPXEW", "^SP500EW"],
  "es-fut": ["ES=F"],
  "nq-fut": ["NQ=F"],
  "ym-fut": ["YM=F"],
  "rty-fut": ["RTY=F"],
  vix: ["^VIX"],
  vxn: ["^VXN"],
  vvix: ["^VVIX"],
  move: ["^MOVE", "MOVE"],
  "put-call": ["^CPC"],
  "usd-jpy": ["JPY=X"]
};

const fredSources: Record<string, { series: string; unit?: string; transform?: (value: number) => number }> = {
  "us-2y": { series: "DGS2" },
  "us-10y": { series: "DGS10" },
  "us-30y": { series: "DGS30" },
  "real-yield-10y": { series: "DFII10" },
  "bei-10y": { series: "T10YIE" },
  "kr-10y": { series: "IRLTLT01KRM156N" },
  "hy-oas": { series: "BAMLH0A0HYM2", transform: (value) => value * 100 },
  "ig-oas": { series: "BAMLC0A0CM", transform: (value) => value * 100 },
  "fed-assets": { series: "WALCL", transform: (value) => value / 1_000_000 },
  tga: { series: "WTREGEN", transform: (value) => value / 1_000 },
  rrp: { series: "RRPONTSYD", transform: (value) => value / 1_000 },
  "bank-reserves": { series: "WRESBAL", transform: (value) => value / 1_000 },
  sofr: { series: "SOFR" },
  cpi: { series: "CPIAUCSL" },
  "core-cpi": { series: "CPILFESL" },
  pce: { series: "PCEPI" },
  "core-pce": { series: "PCEPILFE" },
  "ism-mfg": { series: "NAPM" },
  "jobless-claims": { series: "ICSA", transform: (value) => value / 1_000 },
  unemployment: { series: "UNRATE" },
  "retail-sales": { series: "RSAFS" }
};

const blsSources: Record<string, string> = {
  cpi: "CUSR0000SA0",
  "core-cpi": "CUSR0000SA0L1E"
};

const blsLevelSources: Record<string, string> = {
  unemployment: "LNS14000000"
};

const cftcSources: Record<string, string[]> = {
  "cftc-spx": ["E-MINI S&P 500", "S&P 500 Consolidated", "S&P 500 STOCK INDEX"],
  "cftc-nq": ["NASDAQ-100", "NASDAQ 100"],
  "cftc-10y": ["UST 10Y NOTE", "10-YEAR U.S. TREASURY", "10-YEAR TREASURY"],
  "cftc-dollar": ["USD INDEX", "U.S. DOLLAR INDEX", "US DOLLAR INDEX"]
};

const yahooRateFallbacks: Record<string, { symbols: string[]; transform: (value: number) => number }> = {
  "us-10y": { symbols: ["^TNX"], transform: (value) => value / 10 },
  "us-30y": { symbols: ["^TYX"], transform: (value) => value / 10 }
};

const themeBaskets: Record<string, string[]> = {
  "korea:반도체": ["000660.KS", "042700.KQ", "039030.KQ"],
  "korea:AI인프라": ["267260.KS", "010120.KS", "298040.KS"],
  "korea:바이오": ["207940.KS", "141080.KQ", "068270.KS"],
  "korea:조선": ["329180.KS", "042660.KS", "010140.KS"],
  "korea:방산": ["012450.KS", "079550.KS", "047810.KS"],
  "korea:원전": ["034020.KS", "083650.KQ", "052690.KS"],
  "korea:2차전지": ["373220.KS", "247540.KQ", "006400.KS"],
  "korea:로봇": ["277810.KQ", "454910.KS", "090360.KQ"],
  "korea:밸류업": ["105560.KS", "005380.KS", "028260.KS"],
  "us:AI": ["NVDA", "MSFT", "META"],
  "us:반도체": ["NVDA", "AVGO", "AMD"],
  "us:빅테크": ["MSFT", "AAPL", "GOOGL"],
  "us:전력망": ["ETN", "GEV", "PWR"],
  "us:ESS": ["TSLA", "FLNC", "ENPH"],
  "us:원전/우라늄": ["CCJ", "CEG", "UEC"],
  "us:바이오텍": ["XBI", "MRNA", "REGN"],
  "us:금융": ["JPM", "GS", "BAC"],
  "us:중소형주": ["IWM", "VTWO", "RVT"]
};

function nowIso() {
  return new Date().toISOString();
}

function deriveQualityStatus(quality: Indicator["quality"]): DataStatus {
  if (quality.status) return quality.status;
  if (quality.stale) return "Stale";

  const baseDate = quality.tradeDate ?? quality.baseDate;
  const parsed = baseDate ? Date.parse(baseDate) : NaN;
  if (!Number.isFinite(parsed)) return "Delayed";

  const ageDays = (Date.now() - parsed) / 86_400_000;
  const frequency = quality.frequency.toLowerCase();

  if (frequency.includes("monthly")) return ageDays <= 45 ? "Delayed" : "Stale";
  if (frequency.includes("weekly")) return ageDays <= 10 ? "Delayed" : "Stale";
  if (frequency.includes("daily/weekly")) return ageDays <= 10 ? "Delayed" : "Stale";
  if (ageDays <= 3) return "Fresh";
  if (ageDays <= 7) return "Delayed";
  return "Stale";
}

function normalizeQuality(quality: Indicator["quality"]): Indicator["quality"] {
  const tradeDate = quality.tradeDate ?? quality.baseDate;
  const status = deriveQualityStatus({ ...quality, tradeDate });
  return { ...quality, tradeDate, status };
}

function dateLabel(timestampSeconds: number) {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

function cloneFallbackSnapshot(): MarketSnapshot {
  const cloned = structuredClone(marketSnapshot) as MarketSnapshot;
  const now = nowIso();
  cloned.generatedAt = now;
  cloned.indicators = cloned.indicators.map((indicator) => ({
    ...indicator,
    quality: normalizeQuality({
      ...indicator.quality,
      lastUpdated: now,
      stale: true,
      source: `${indicator.quality.source} / fallback sample`
    })
  }));
  cloned.themes = cloned.themes.map((theme) => ({
    ...theme,
    quality: normalizeQuality({
      ...theme.quality,
      lastUpdated: now,
      stale: true,
      source: `${theme.quality.source} / fallback sample`
    })
  }));
  return cloned;
}

function toneForChange(change: number, inverse = false): IndicatorTone {
  if (Math.abs(change) < 0.05) return "neutral";
  const positive = inverse ? change < 0 : change > 0;
  return positive ? "positive" : "negative";
}

function isRiskIndicator(id: string) {
  return [
    "vix",
    "vxn",
    "vvix",
    "move",
    "put-call",
    "usd-krw",
    "dxy",
    "usd-jpy",
    "us-2y",
    "us-10y",
    "us-30y",
    "real-yield-10y",
    "bei-10y",
    "hy-oas",
    "ig-oas",
    "tga",
    "sofr"
  ].includes(id);
}

function isLiveIndicator(indicator: Indicator | undefined): indicator is Indicator {
  return Boolean(indicator && !indicator.quality.stale);
}

async function fetchWithTimeout(fetcher: Fetcher, input: string, init: RequestInit = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function twoYearsAgo() {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 2);
  return date.toISOString().slice(0, 10);
}

function sparkFromPairs(timestamps: number[], values: Array<number | null>) {
  const points: SparkPoint[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const timestamp = timestamps[index];
    if (typeof value === "number" && Number.isFinite(value) && timestamp) {
      points.push({
        date: dateLabel(timestamp).slice(5),
        value: Number(value.toFixed(4))
      });
    }
  }
  return points.slice(-40);
}

async function fetchYahooSeries(fetcher: Fetcher, symbols: string[], range = "1mo"): Promise<PriceSeries | null> {
  for (const symbol of symbols) {
    const encoded = encodeURIComponent(symbol);
    const sourceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=${range}&interval=1d&includePrePost=false`;
    try {
      const response = await fetchWithTimeout(fetcher, sourceUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 market-regime-monitor"
        }
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            meta?: { regularMarketPrice?: number; chartPreviousClose?: number; regularMarketTime?: number };
            indicators?: {
              quote?: Array<{ close?: Array<number | null>; volume?: Array<number | null> }>;
            };
          }>;
        };
      };
      const result = payload.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const quote = result?.indicators?.quote?.[0];
      const closes = quote?.close ?? [];
      const valid = closes
        .map((value, index) => ({ value, timestamp: timestamps[index], volume: quote?.volume?.[index] ?? null }))
        .filter((point) => typeof point.value === "number" && Number.isFinite(point.value) && point.timestamp);
      if (valid.length < 2) continue;
      const latest = valid[valid.length - 1];
      const previous = valid[valid.length - 2];
      const latestValue = Number(latest.value);
      const previousValue = Number(previous.value);
      const volumeValues = valid.map((point) => point.volume).filter((value): value is number => typeof value === "number" && value > 0);
      const recentVolumes = volumeValues.slice(-21, -1);
      const averageVolume = recentVolumes.length ? recentVolumes.reduce((acc, item) => acc + item, 0) / recentVolumes.length : null;
      const latestVolume = typeof latest.volume === "number" ? latest.volume : null;
      const values = valid.map((point) => Number(point.value));
      const high52Week = range === "1y" ? latestValue >= Math.max(...values) * 0.995 : undefined;
      return {
        source: `Yahoo Finance (${symbol})`,
        sourceUrl,
        baseDate: dateLabel(Number(latest.timestamp)),
        lastUpdated: nowIso(),
        value: latestValue,
        previousClose: previousValue,
        changePercent: changePercent(latestValue, previousValue),
        sparkline: sparkFromPairs(timestamps, closes),
        volumeRatio: latestVolume && averageVolume ? latestVolume / averageVolume : undefined,
        high52Week
      };
    } catch {
      continue;
    }
  }
  return null;
}

function parseFredCsv(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, rawValue] = line.split(",");
      const value = Number(rawValue);
      if (!date || !Number.isFinite(value)) return null;
      return { date, value };
    })
    .filter((item): item is { date: string; value: number } => Boolean(item));
}

async function fetchFredSeries(fetcher: Fetcher, series: string, transform?: (value: number) => number): Promise<FredSeries | null> {
  const sourceUrl = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(series)}&cosd=${twoYearsAgo()}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 9000);
    if (!response.ok) return null;
    const rows = parseFredCsv(await response.text());
    if (rows.length < 2) return null;
    const transformed = rows.map((row) => ({
      date: row.date,
      value: transform ? transform(row.value) : row.value
    }));
    const latest = transformed[transformed.length - 1];
    const previous = transformed[transformed.length - 2];
    return {
      source: `FRED (${series})`,
      sourceUrl,
      baseDate: latest.date,
      lastUpdated: nowIso(),
      value: latest.value,
      previousClose: previous.value,
      changePercent: changePercent(latest.value, previous.value),
      sparkline: transformed.slice(-40).map((row) => ({ date: row.date.slice(5), value: Number(row.value.toFixed(4)) })),
      rawValues: transformed.map((row) => row.value)
    };
  } catch {
    return null;
  }
}

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseNumberField(value: string | undefined) {
  if (!value || value === ".") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchCboePutCall(fetcher: Fetcher): Promise<PriceSeries | null> {
  const sourceUrl = "https://www.cboe.com/us/options/market_statistics/daily/?PrintPage=true";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const html = await response.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const ratio = /TOTAL PUT\/CALL RATIO\s+([0-9.]+)/i.exec(text);
    if (!ratio) return null;
    const value = Number(ratio[1]);
    if (!Number.isFinite(value)) return null;
    const dateMatch =
      /placeholder="yyyy\/mm\/dd"[^>]*value="([^"]+)"/i.exec(html) ??
      /value="([^"]+)"[^>]*placeholder="yyyy\/mm\/dd"/i.exec(html);
    const baseDate = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);
    return {
      source: "CBOE Daily Market Statistics",
      sourceUrl,
      baseDate,
      lastUpdated: nowIso(),
      value,
      previousClose: value,
      changePercent: 0,
      sparkline: [{ date: baseDate, value }]
    };
  } catch {
    return null;
  }
}

async function fetchCftcTffText(fetcher: Fetcher): Promise<{ text: string; sourceUrl: string } | null> {
  const sourceUrl = "https://www.cftc.gov/dea/newcot/FinComWk.txt";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    return { text: await response.text(), sourceUrl };
  } catch {
    return null;
  }
}

function parseCftcTff(text: string, sourceUrl: string, matchers: string[]): CftcSeries | null {
  const records = text.match(/"[^"]+",\d{6},\d{4}-\d{2}-\d{2}[\s\S]*?(?=\s+"[^"]+",\d{6},\d{4}-\d{2}-\d{2}|$)/g) ??
    text.split(/\r?\n/).filter((item) => item.trim().length > 20);
  const line = records.find((item) => {
    const upper = item.toUpperCase();
    return matchers.some((matcher) => upper.includes(matcher.toUpperCase()));
  });
  if (!line) return null;
  const fields = parseCsvLine(line);
  const baseDate = fields[2] ?? new Date().toISOString().slice(0, 10);
  const levLong = parseNumberField(fields[14]);
  const levShort = parseNumberField(fields[15]);
  const changeLevLong = parseNumberField(fields[31]);
  const changeLevShort = parseNumberField(fields[32]);
  if (levLong === null || levShort === null) return null;
  const value = levLong - levShort;
  const netChange = changeLevLong !== null && changeLevShort !== null ? changeLevLong - changeLevShort : 0;
  const previousClose = value - netChange;
  return {
    source: "CFTC Traders in Financial Futures (Leveraged Funds net)",
    sourceUrl,
    baseDate,
    lastUpdated: nowIso(),
    value,
    previousClose,
    changePercent: changePercent(value, previousClose),
    sparkline: [
      { date: "prev", value: previousClose },
      { date: baseDate.slice(5), value }
    ]
  };
}

async function fetchBlsInflation(fetcher: Fetcher, id: string, seriesId: string): Promise<BlsSeries | null> {
  const sourceUrl = `https://api.bls.gov/publicAPI/v2/timeseries/data/${encodeURIComponent(seriesId)}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      Results?: {
        series?: Array<{
          data?: Array<{ year: string; period: string; value: string }>;
        }>;
      };
    };
    const rows = payload.Results?.series?.[0]?.data
      ?.filter((row) => /^M\d{2}$/.test(row.period))
      .map((row) => ({
        date: `${row.year}-${row.period.slice(1)}-01`,
        value: Number(row.value)
      }))
      .filter((row) => Number.isFinite(row.value))
      .sort((a, b) => a.date.localeCompare(b.date)) ?? [];
    if (rows.length < 14) return null;
    const latestIndex = rows.length - 1;
    const latest = rows[latestIndex];
    const previous = rows[latestIndex - 1];
    const yearAgo = rows[latestIndex - 12];
    const previousYearAgo = rows[latestIndex - 13];
    const value = ((latest.value / yearAgo.value) - 1) * 100;
    const previousClose = ((previous.value / previousYearAgo.value) - 1) * 100;
    return {
      source: `BLS Public API (${seriesId})`,
      sourceUrl,
      frequency: "Monthly",
      baseDate: latest.date,
      lastUpdated: nowIso(),
      value,
      previousClose,
      changePercent: changePercent(value, previousClose),
      sparkline: rows.slice(-24).map((row, index, sliced) => {
        const sourceIndex = rows.length - sliced.length + index;
        const base = rows[sourceIndex - 12];
        return {
          date: row.date.slice(5, 7),
          value: base ? Number((((row.value / base.value) - 1) * 100).toFixed(3)) : 0
        };
      })
    };
  } catch {
    return null;
  }
}

async function fetchBlsLevel(fetcher: Fetcher, seriesId: string): Promise<DatedSeries | null> {
  const sourceUrl = `https://api.bls.gov/publicAPI/v2/timeseries/data/${encodeURIComponent(seriesId)}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      Results?: {
        series?: Array<{
          data?: Array<{ year: string; period: string; value: string }>;
        }>;
      };
    };
    const rows = payload.Results?.series?.[0]?.data
      ?.filter((row) => /^M\d{2}$/.test(row.period))
      .map((row) => ({
        date: `${row.year}-${row.period.slice(1)}-01`,
        value: Number(row.value)
      }))
      .filter((row) => Number.isFinite(row.value))
      .sort((a, b) => a.date.localeCompare(b.date)) ?? [];
    if (rows.length < 2) return null;
    const latest = rows[rows.length - 1];
    const previous = rows[rows.length - 2];
    return {
      source: `BLS Public API (${seriesId})`,
      sourceUrl,
      frequency: "Monthly",
      baseDate: latest.date,
      lastUpdated: nowIso(),
      value: latest.value,
      previousClose: previous.value,
      changePercent: changePercent(latest.value, previous.value),
      sparkline: rows.slice(-40).map((row) => ({ date: row.date.slice(5, 7), value: row.value }))
    };
  } catch {
    return null;
  }
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function compactDate(date: string) {
  return date.replace(/-/g, "");
}

function dashedDate(date: string) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

function monthNumber(label: string) {
  const index = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].findIndex((month) =>
    label.toLowerCase().startsWith(month.toLowerCase())
  );
  return index >= 0 ? String(index + 1).padStart(2, "0") : "01";
}

function latestWeekdayInTimeZone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
  const probe = new Date();
  for (let offset = 0; offset < 4; offset += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(probe).map((part) => [part.type, part.value]));
    if (parts.weekday !== "Sat" && parts.weekday !== "Sun") return `${parts.year}-${parts.month}-${parts.day}`;
    probe.setUTCDate(probe.getUTCDate() - 1);
  }
  return new Date().toISOString().slice(0, 10);
}

function makeDatedSeries(input: {
  rows: Array<{ date: string; value: number }>;
  source: string;
  sourceUrl: string;
  frequency: string;
  lastUpdated?: string;
}): DatedSeries | null {
  const rows = input.rows
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 2) return null;
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2];
  return {
    source: input.source,
    sourceUrl: input.sourceUrl,
    frequency: input.frequency,
    baseDate: latest.date,
    lastUpdated: input.lastUpdated ?? nowIso(),
    value: latest.value,
    previousClose: previous.value,
    changePercent: changePercent(latest.value, previous.value),
    sparkline: rows.slice(-40).map((row) => ({ date: row.date.slice(5), value: Number(row.value.toFixed(4)) }))
  };
}

function extractXmlValue(entry: string, field: string) {
  const match = new RegExp(`<d:${field}\\b[^>]*>([^<]+)<\\/d:${field}>`).exec(entry);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

async function fetchTreasuryCurve(fetcher: Fetcher, dataType: string, fields: string[]) {
  const year = new Date().getUTCFullYear();
  const sourceUrl = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=${dataType}&field_tdr_date_value=${year}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    const rows: TreasuryCurveRow[] = [];
    for (const entry of entries) {
      const date = /<d:NEW_DATE\b[^>]*>(\d{4}-\d{2}-\d{2})T/.exec(entry)?.[1];
      if (!date) continue;
      const values: Record<string, number> = {};
      let hasAllFields = true;
      for (const field of fields) {
        const value = extractXmlValue(entry, field);
        if (value === null) {
          hasAllFields = false;
          break;
        }
        values[field] = value;
      }
      if (hasAllFields) rows.push({ date, values });
    }
    return {
      sourceUrl,
      rows: rows.sort((a, b) => a.date.localeCompare(b.date))
    };
  } catch {
    return null;
  }
}

function treasuryCurveSeries(curve: { sourceUrl: string; rows: TreasuryCurveRow[] }, field: string, source: string): DatedSeries | null {
  return makeDatedSeries({
    rows: curve.rows.map((row) => ({ date: row.date, value: row.values[field] })),
    source,
    sourceUrl: curve.sourceUrl,
    frequency: "Daily"
  });
}

async function fetchNewYorkFedSofr(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = `https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${daysAgo(35)}&endDate=${new Date().toISOString().slice(0, 10)}&type=rate`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      refRates?: Array<{ effectiveDate: string; percentRate: number }>;
    };
    return makeDatedSeries({
      rows: payload.refRates?.map((row) => ({ date: row.effectiveDate, value: Number(row.percentRate) })) ?? [],
      source: "Federal Reserve Bank of New York SOFR API",
      sourceUrl,
      frequency: "Daily"
    });
  } catch {
    return null;
  }
}

async function fetchNewYorkFedRrp(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = "https://markets.newyorkfed.org/api/rp/all/all/results/lastTwoWeeks.json";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      repo?: {
        operations?: Array<{
          operationDate: string;
          operationType: string;
          term: string;
          note?: string;
          totalAmtAccepted?: number;
        }>;
      };
    };
    const rows = payload.repo?.operations
      ?.filter((operation) =>
        operation.operationType === "Reverse Repo" &&
        operation.term === "Overnight" &&
        !(operation.note ?? "").toLowerCase().includes("small value") &&
        typeof operation.totalAmtAccepted === "number"
      )
      .map((operation) => ({
        date: operation.operationDate,
        value: Number(operation.totalAmtAccepted) / 1_000_000_000_000
      })) ?? [];
    return makeDatedSeries({
      rows,
      source: "Federal Reserve Bank of New York Repo/Reverse Repo API",
      sourceUrl,
      frequency: "Daily"
    });
  } catch {
    return null;
  }
}

async function fetchFiscalDataTga(fetcher: Fetcher): Promise<DatedSeries | null> {
  const year = new Date().getUTCFullYear();
  const sourceUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts/operating_cash_balance?filter=record_date:gte:${year}-01-01,account_type:eq:Treasury%20General%20Account%20%28TGA%29%20Closing%20Balance&sort=-record_date&page%5Bsize%5D=40`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      data?: Array<{ record_date: string; open_today_bal: string }>;
    };
    return makeDatedSeries({
      rows: payload.data?.map((row) => ({ date: row.record_date, value: Number(row.open_today_bal) / 1_000_000 })) ?? [],
      source: "U.S. Treasury FiscalData Daily Treasury Statement",
      sourceUrl,
      frequency: "Daily"
    });
  } catch {
    return null;
  }
}

async function fetchKrxIndexMain(fetcher: Fetcher): Promise<Record<string, PriceSeries> | null> {
  const otpUrl = "https://index.krx.co.kr/contents/COM/GenerateOTP.jspx?bld=%2FIDX%2Fmain%2Fnew%2Findex_data&name=bld";
  const dataUrlBase = "https://index.krx.co.kr/contents/IDX/99/IDX99000001.jspx";
  const sourceUrl = "https://index.krx.co.kr/main/main.jsp";
  const idByName: Record<string, string> = {
    KOSPI: "kospi",
    KOSDAQ: "kosdaq",
    "KOSPI 200": "kospi200",
    "KOSDAQ 150": "kosdaq150",
    "KRX 300": "krx300"
  };
  try {
    const otpResponse = await fetchWithTimeout(fetcher, otpUrl, {
      headers: {
        Referer: sourceUrl,
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!otpResponse.ok) return null;
    const code = (await otpResponse.text()).trim();
    if (!code) return null;
    const response = await fetchWithTimeout(fetcher, `${dataUrlBase}?code=${encodeURIComponent(code)}`, {
      headers: {
        Referer: sourceUrl,
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      board?: Array<{ idx_nm?: string; clsprc_idx?: string; cmpr_idx?: string; cmpr_rt?: string; updown?: string }>;
    };
    const baseDate = latestWeekdayInTimeZone("Asia/Seoul");
    const results: Record<string, PriceSeries> = {};
    for (const row of payload.board ?? []) {
      const id = row.idx_nm ? idByName[row.idx_nm] : undefined;
      const value = parseNumberField(row.clsprc_idx);
      const pointChange = parseNumberField(row.cmpr_idx) ?? 0;
      if (!id || value === null) continue;
      const previousClose = row.updown === "down" ? value + pointChange : row.updown === "up" ? value - pointChange : value;
      results[id] = {
        source: "KRX Index Main",
        sourceUrl,
        baseDate,
        lastUpdated: nowIso(),
        value,
        previousClose,
        changePercent: row.updown === "down" ? -Math.abs(Number(row.cmpr_rt ?? 0)) : row.updown === "up" ? Math.abs(Number(row.cmpr_rt ?? 0)) : 0,
        sparkline: [
          { date: "prev", value: Number(previousClose.toFixed(4)) },
          { date: baseDate.slice(5), value: Number(value.toFixed(4)) }
        ]
      };
    }
    return Object.keys(results).length ? results : null;
  } catch {
    return null;
  }
}

async function fetchKrxIndexChart(fetcher: Fetcher, chartId: string): Promise<PriceSeries | null> {
  const sourceUrl = `https://index.krx.co.kr/main/chart.jsp?idx=${encodeURIComponent(chartId)}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        Referer: "https://index.krx.co.kr/main/main.jsp",
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const html = await response.text();
    const jsonMatch = /var\s+jsonData\s*=\s*(\{[\s\S]*?\});/.exec(html);
    if (!jsonMatch) return null;
    const payload = JSON.parse(jsonMatch[1]) as {
      block1?: Array<{ trd_ddtm?: string; prsnt_idx?: string; prevdd_idx?: string }>;
    };
    const rows = payload.block1
      ?.map((row) => ({
        date: row.trd_ddtm ?? "",
        value: parseNumberField(row.prsnt_idx) ?? Number.NaN,
        previous: parseNumberField(row.prevdd_idx)
      }))
      .filter((row) => Number.isFinite(row.value)) ?? [];
    if (rows.length < 2) return null;
    const latest = rows[rows.length - 1];
    const firstPrevious = rows.find((row) => row.previous !== null)?.previous;
    const previousClose = firstPrevious ?? rows[rows.length - 2].value;
    const baseDate = latestWeekdayInTimeZone("Asia/Seoul");
    return {
      source: `KRX Index Intraday Chart (${chartId})`,
      sourceUrl,
      baseDate,
      lastUpdated: nowIso(),
      value: latest.value,
      previousClose,
      changePercent: changePercent(latest.value, previousClose),
      sparkline: rows.slice(-60).map((row) => ({ date: row.date, value: Number(row.value.toFixed(4)) }))
    };
  } catch {
    return null;
  }
}

async function fetchBokKoreaBondYield(fetcher: Fetcher, itemCode: string): Promise<DatedSeries | null> {
  const start = compactDate(daysAgo(12));
  const end = compactDate(new Date().toISOString().slice(0, 10));
  const sourceUrl = `https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/817Y002/D/${start}/${end}/${itemCode}`;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      StatisticSearch?: {
        row?: Array<{ TIME: string; DATA_VALUE: string; ITEM_NAME1?: string }>;
      };
    };
    const label = payload.StatisticSearch?.row?.find((row) => row.ITEM_NAME1)?.ITEM_NAME1 ?? itemCode;
    return makeDatedSeries({
      rows: payload.StatisticSearch?.row?.map((row) => ({ date: dashedDate(row.TIME), value: Number(row.DATA_VALUE) })) ?? [],
      source: `Bank of Korea ECOS Open API sample key (${label})`,
      sourceUrl,
      frequency: "Daily"
    });
  } catch {
    return null;
  }
}

function datedSeriesFromCsvField(input: {
  csv: string;
  sourceUrl: string;
  source: string;
  field: string;
  frequency: string;
  divisor?: number;
}) {
  const rows = input.csv.trim().split(/\r?\n/).map(parseCsvLine);
  const descriptions = rows.find((row) => row[0] === "Series Description");
  if (!descriptions) return null;
  const index = descriptions.findIndex((description) => description.includes(input.field));
  if (index < 0) return null;
  return makeDatedSeries({
    rows: rows
      .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row[0] ?? ""))
      .map((row) => ({ date: row[0], value: Number(row[index]) / (input.divisor ?? 1) })),
    source: input.source,
    sourceUrl: input.sourceUrl,
    frequency: input.frequency
  });
}

async function fetchFedH41(fetcher: Fetcher): Promise<Record<string, DatedSeries> | null> {
  const table1Url = "https://www.federalreserve.gov/datadownload/Output.aspx?rel=H41&series=f52e72511be65e16f71d4f5858951312&lastobs=8&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package";
  const table5Url = "https://www.federalreserve.gov/datadownload/Output.aspx?rel=H41&series=ccfdc0c8cb86be87af324da79a6f8826&lastobs=8&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package";
  try {
    const [table1Response, table5Response] = await Promise.all([
      fetchWithTimeout(fetcher, table1Url, {
        headers: {
          "User-Agent": "Mozilla/5.0 market-regime-monitor"
        }
      }, 10000),
      fetchWithTimeout(fetcher, table5Url, {
        headers: {
          "User-Agent": "Mozilla/5.0 market-regime-monitor"
        }
      }, 10000)
    ]);
    const results: Record<string, DatedSeries> = {};
    if (table1Response.ok) {
      const table1 = await table1Response.text();
      const reserves = datedSeriesFromCsvField({
        csv: table1,
        sourceUrl: table1Url,
        source: "Federal Reserve H.4.1 Table 1",
        field: "Reserve balances with Federal Reserve Banks: Wednesday level",
        frequency: "Weekly",
        divisor: 1_000_000
      });
      const tga = datedSeriesFromCsvField({
        csv: table1,
        sourceUrl: table1Url,
        source: "Federal Reserve H.4.1 Table 1",
        field: "U.S. Treasury, General Account: Wednesday level",
        frequency: "Weekly",
        divisor: 1_000_000
      });
      if (reserves) results["bank-reserves"] = reserves;
      if (tga) results.tga = tga;
    }
    if (table5Response.ok) {
      const table5 = await table5Response.text();
      const fedAssets = datedSeriesFromCsvField({
        csv: table5,
        sourceUrl: table5Url,
        source: "Federal Reserve H.4.1 Table 5",
        field: "Total assets (Less eliminations from consolidation): Wednesday level",
        frequency: "Weekly",
        divisor: 1_000_000
      });
      if (fedAssets) results["fed-assets"] = fedAssets;
    }
    return Object.keys(results).length ? results : null;
  } catch {
    return null;
  }
}

async function fetchBlsCpiRelease(fetcher: Fetcher): Promise<Record<string, DatedSeries> | null> {
  const sourceUrl = "https://www.bls.gov/news.release/cpi.nr0.htm";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const dateMatch = /CONSUMER PRICE INDEX\s*-\s*([A-Z]+)\s+(\d{4})/i.exec(text);
    const month = dateMatch ? monthNumber(dateMatch[1]) : new Date().toISOString().slice(5, 7);
    const year = dateMatch?.[2] ?? new Date().getUTCFullYear().toString();
    const baseDate = `${year}-${month}-01`;
    const headline = /all items index rose\s+(-?\d+(?:\.\d+)?)\s+percent for the 12 months ending [A-Za-z]+,\s+after rising\s+(-?\d+(?:\.\d+)?)\s+percent/i.exec(text);
    const core = /all items less food and energy index rose\s+(-?\d+(?:\.\d+)?)\s+percent over the year,\s+following a\s+(-?\d+(?:\.\d+)?)\s+percent/i.exec(text);
    const makeSeries = (match: RegExpExecArray | null): DatedSeries | null => {
      if (!match) return null;
      const value = Number(match[1]);
      const previousClose = Number(match[2]);
      if (!Number.isFinite(value) || !Number.isFinite(previousClose)) return null;
      return {
        source: "BLS Consumer Price Index Summary",
        sourceUrl,
        frequency: "Monthly",
        baseDate,
        lastUpdated: nowIso(),
        value,
        previousClose,
        changePercent: changePercent(value, previousClose),
        sparkline: [
          { date: "prev", value: previousClose },
          { date: baseDate.slice(5), value }
        ]
      };
    };
    const cpi = makeSeries(headline);
    const coreCpi = makeSeries(core);
    if (!cpi && !coreCpi) return null;
    return {
      ...(cpi ? { cpi } : {}),
      ...(coreCpi ? { "core-cpi": coreCpi } : {})
    };
  } catch {
    return null;
  }
}

async function fetchDolInitialClaims(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = "https://oui.doleta.gov/unemploy/DataDashboard.asp";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const match = /Seasonally Adjusted Initial Claims\s*\((\d{2})\/(\d{2})\/(\d{4})\)\s*([\d,]+)/i.exec(text);
    if (!match) return null;
    const value = Number(match[4].replace(/,/g, "")) / 1_000;
    if (!Number.isFinite(value)) return null;
    const baseDate = `${match[3]}-${match[1]}-${match[2]}`;
    return {
      source: "U.S. Department of Labor ETA UI Data Dashboard",
      sourceUrl,
      frequency: "Weekly",
      baseDate,
      lastUpdated: nowIso(),
      value,
      previousClose: value,
      changePercent: 0,
      sparkline: [{ date: baseDate.slice(5), value }]
    };
  } catch {
    return null;
  }
}

async function fetchCensusRetailSales(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = "https://www.census.gov/retail/sales.html";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 15000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const current = /for\s+([A-Z][a-z]+)\s+(\d{4})[\s\S]{0,500}?were\s+\$?[\d.]+\s+billion,\s+(up|down|virtually unchanged)(?:\s+(-?\d+(?:\.\d+)?)\s+percent)?[\s\S]{0,160}?from the previous month/i.exec(text);
    if (!current) return null;
    const direction = current[3].toLowerCase();
    const magnitude = current[4] ? Number(current[4]) : 0;
    const value = direction === "down" ? -magnitude : magnitude;
    const previous = /percent change was revised from .*? to (up|down|virtually unchanged)(?:\s+(-?\d+(?:\.\d+)?)\s+percent)?/i.exec(text);
    const previousDirection = previous?.[1]?.toLowerCase();
    const previousMagnitude = previous?.[2] ? Number(previous[2]) : 0;
    const previousClose = previousDirection === "down" ? -previousMagnitude : previousMagnitude;
    const baseDate = `${current[2]}-${monthNumber(current[1])}-01`;
    return {
      source: "U.S. Census Bureau Monthly Retail Trade",
      sourceUrl,
      frequency: "Monthly",
      baseDate,
      lastUpdated: nowIso(),
      value,
      previousClose,
      changePercent: changePercent(value, previousClose),
      sparkline: [
        { date: "prev", value: previousClose },
        { date: baseDate.slice(5), value }
      ]
    };
  } catch {
    return null;
  }
}

async function fetchIsmCurrentReport(fetcher: Fetcher, kind: "manufacturing" | "services"): Promise<DatedSeries | null> {
  const indexUrl = "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/";
  try {
    const indexResponse = await fetchWithTimeout(fetcher, indexUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!indexResponse.ok) return null;
    const indexHtml = await indexResponse.text();
    const pathPattern = kind === "manufacturing"
      ? /href="([^"]*\/ism-pmi-reports\/pmi\/[^"]+)"/i
      : /href="([^"]*\/ism-pmi-reports\/services\/[^"]+)"/i;
    const path = pathPattern.exec(indexHtml)?.[1];
    if (!path) return null;
    const sourceUrl = path.startsWith("http") ? path : `https://www.ismworld.org${path}`;
    const reportResponse = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        Referer: indexUrl,
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!reportResponse.ok) return null;
    const text = (await reportResponse.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const dateMatch = new RegExp(`([A-Z][a-z]+)\\s+(\\d{4})\\s+ISM\\S*\\s+${kind === "manufacturing" ? "Manufacturing" : "Services"}\\s+PMI`, "i").exec(text);
    const baseDate = dateMatch ? `${dateMatch[2]}-${monthNumber(dateMatch[1])}-01` : new Date().toISOString().slice(0, 10);
    const label = kind === "manufacturing" ? "Manufacturing PMI" : "Services PMI";
    const tableMatch = new RegExp(`${label}\\S*\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)`, "i").exec(text);
    const sentenceMatch = new RegExp(`${label}\\S*\\s+registered\\s+(-?\\d+(?:\\.\\d+)?)\\s+percent[\\s\\S]{0,180}?(?:figure|reading)\\s+of\\s+(-?\\d+(?:\\.\\d+)?)\\s+percent`, "i").exec(text);
    const match = tableMatch ?? sentenceMatch;
    if (!match) return null;
    const value = Number(match[1]);
    const previousClose = Number(match[2]);
    if (!Number.isFinite(value) || !Number.isFinite(previousClose)) return null;
    return {
      source: `Institute for Supply Management ${label} Report`,
      sourceUrl,
      frequency: "Monthly",
      baseDate,
      lastUpdated: nowIso(),
      value,
      previousClose,
      changePercent: changePercent(value, previousClose),
      sparkline: [
        { date: "prev", value: previousClose },
        { date: baseDate.slice(5), value }
      ]
    };
  } catch {
    return null;
  }
}

function decodeBasicEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;|&#x2013;|&ndash;/g, "-")
    .replace(/&#8722;|&#x2212;|&minus;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

async function fetchAaiiBullBearSpread(fetcher: Fetcher): Promise<DatedSeries | null> {
  const feedUrl = "https://insights.aaii.com/feed";
  try {
    const feedResponse = await fetchWithTimeout(fetcher, feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!feedResponse.ok) return null;
    const feed = await feedResponse.text();
    const items = feed.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    const item = items.find((entry) => {
      const title = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(entry)?.[1] ?? "";
      return /^AAII Sentiment Survey/i.test(decodeBasicEntities(title).trim());
    });
    if (!item) return null;
    const link = decodeBasicEntities(/<link>([\s\S]*?)<\/link>/i.exec(item)?.[1]?.trim() ?? "");
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(item)?.[1]?.trim();
    const match = [item]
      .map((candidate) =>
        decodeBasicEntities(candidate)
          .replace(/<[^>]+>/g, " ")
          .replace(/[\u2013\u2212]/g, "-")
          .replace(/\s+/g, " ")
      )
      .map((text) => /bull-bear spread[^.]*?\s+(increased|decreased)\s+(\d+(?:\.\d+)?)\s+percentage points?\s+to\s+(-?\d+(?:\.\d+)?)%/i.exec(text))
      .find((candidate): candidate is RegExpExecArray => Boolean(candidate));
    if (!match) return null;
    const direction = match[1].toLowerCase();
    const delta = Number(match[2]);
    const value = Number(match[3]);
    if (!Number.isFinite(delta) || !Number.isFinite(value)) return null;
    const previousClose = direction === "increased" ? value - delta : value + delta;
    const parsedDate = pubDate ? new Date(pubDate) : new Date();
    const baseDate = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 10) : parsedDate.toISOString().slice(0, 10);
    return {
      source: "AAII Sentiment Survey public feed",
      sourceUrl: link || feedUrl,
      frequency: "Weekly",
      baseDate,
      lastUpdated: nowIso(),
      value,
      previousClose,
      changePercent: changePercent(value, previousClose),
      sparkline: [
        { date: "prev", value: Number(previousClose.toFixed(2)) },
        { date: baseDate.slice(5), value }
      ]
    };
  } catch {
    return null;
  }
}

async function fetchFinraMarginDebt(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = "https://www.finra.org/rules-guidance/key-topics/margin-accounts/margin-statistics";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const matches = [...text.matchAll(/([A-Z][a-z]{2})-(\d{2})\s+([\d,]+)\s+[\d,]+\s+[\d,]+/g)];
    const rows = matches.map((match) => ({
      date: `20${match[2]}-${monthNumber(match[1])}-01`,
      value: Number(match[3].replace(/,/g, "")) / 1_000
    }));
    return makeDatedSeries({
      rows,
      source: "FINRA Margin Statistics",
      sourceUrl,
      frequency: "Monthly"
    });
  } catch {
    return null;
  }
}

async function fetchBeaInflationPage(fetcher: Fetcher, sourceUrl: string): Promise<DatedSeries | null> {
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const rows = [...text.matchAll(/([A-Z][a-z]+)\s+(\d{4})\s*\+?(-?\d+(?:\.\d+)?)%/g)]
      .map((match) => ({
        date: `${match[2]}-${monthNumber(match[1])}-01`,
        value: Number(match[3])
      }));
    return makeDatedSeries({
      rows,
      source: "U.S. Bureau of Economic Analysis",
      sourceUrl,
      frequency: "Monthly"
    });
  } catch {
    return null;
  }
}

async function fetchClevelandNowcast(fetcher: Fetcher): Promise<DatedSeries | null> {
  const sourceUrl = "https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const section = /Inflation,\s*year-over-year percent change([\s\S]*?)Quarterly annualized percent change/i.exec(text)?.[1] ?? text;
    const match = /([A-Z][a-z]+)\s+(\d{4})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+\d{2}\/\d{2}/.exec(section);
    if (!match) return null;
    const date = `${match[2]}-${monthNumber(match[1])}-01`;
    const value = Number(match[3]);
    if (!Number.isFinite(value)) return null;
    return {
      source: "Federal Reserve Bank of Cleveland Inflation Nowcasting",
      sourceUrl,
      frequency: "Daily",
      baseDate: date,
      lastUpdated: nowIso(),
      value,
      previousClose: value,
      changePercent: 0,
      sparkline: [{ date: date.slice(5), value }]
    };
  } catch {
    return null;
  }
}

function yearOverYearFromFred(series: FredSeries) {
  const values = series.rawValues;
  if (values.length < 13) return null;
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const yearAgo = values[values.length - 13];
  const previousYearAgo = values[values.length - 14] ?? yearAgo;
  const value = ((latest / yearAgo) - 1) * 100;
  const previousClose = ((previous / previousYearAgo) - 1) * 100;
  return {
    ...series,
    value,
    previousClose,
    changePercent: changePercent(value, previousClose),
    sparkline: values.slice(-40).map((item, index, sliced) => {
      const sourceIndex = values.length - sliced.length + index;
      const base = values[sourceIndex - 12];
      const yoy = base ? ((item / base) - 1) * 100 : 0;
      return { date: `${index + 1}`, value: Number(yoy.toFixed(3)) };
    })
  };
}

function monthOverMonthFromFred(series: FredSeries) {
  const values = series.rawValues;
  if (values.length < 2) return null;
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  const beforePrevious = values[values.length - 3] ?? previous;
  const value = ((latest / previous) - 1) * 100;
  const previousClose = ((previous / beforePrevious) - 1) * 100;
  return {
    ...series,
    value,
    previousClose,
    changePercent: changePercent(value, previousClose)
  };
}

function updateIndicator(snapshot: MarketSnapshot, update: Update) {
  const index = snapshot.indicators.findIndex((indicator) => indicator.id === update.id);
  if (index < 0) return;
  const current = snapshot.indicators[index];
  snapshot.indicators[index] = {
    ...current,
    ...update,
    quality: normalizeQuality({
      ...current.quality,
      ...update.quality
    })
  };
}

function yahooUpdate(id: string, data: PriceSeries, unit?: string): Update {
  return {
    id,
    value: data.value,
    previousClose: data.previousClose,
    changePercent: data.changePercent,
    unit,
    tone: toneForChange(data.changePercent, isRiskIndicator(id)),
    sparkline: data.sparkline,
    quality: {
      source: data.source,
      sourceUrl: data.sourceUrl,
      frequency: "Daily",
      baseDate: data.baseDate,
      lastUpdated: data.lastUpdated,
      access: "free",
      stale: false
    }
  };
}

function transformYahooSeries(data: PriceSeries, transform: (value: number) => number): PriceSeries {
  const value = transform(data.value);
  const previousClose = transform(data.previousClose);
  return {
    ...data,
    value,
    previousClose,
    changePercent: changePercent(value, previousClose),
    sparkline: data.sparkline.map((point) => ({
      ...point,
      value: Number(transform(point.value).toFixed(4))
    }))
  };
}

function fredUpdate(id: string, data: FredSeries, unit?: string): Update {
  return {
    id,
    value: data.value,
    previousClose: data.previousClose,
    changePercent: data.changePercent,
    unit,
    tone: toneForChange(data.changePercent, isRiskIndicator(id)),
    sparkline: data.sparkline,
    quality: {
      source: data.source,
      sourceUrl: data.sourceUrl,
      frequency: "Daily/Monthly",
      baseDate: data.baseDate,
      lastUpdated: data.lastUpdated,
      access: "free",
      stale: false
    }
  };
}

function datedSeriesUpdate(id: string, data: DatedSeries, unit?: string, inverse = isRiskIndicator(id)): Update {
  return {
    id,
    value: data.value,
    previousClose: data.previousClose,
    changePercent: data.changePercent,
    unit,
    tone: toneForChange(data.changePercent, inverse),
    sparkline: data.sparkline,
    quality: {
      source: data.source,
      sourceUrl: data.sourceUrl,
      frequency: data.frequency,
      baseDate: data.baseDate,
      lastUpdated: data.lastUpdated,
      access: "free",
      stale: false
    }
  };
}

function calculateSpread(snapshot: MarketSnapshot) {
  const tenYear = snapshot.indicators.find((indicator) => indicator.id === "us-10y");
  const twoYear = snapshot.indicators.find((indicator) => indicator.id === "us-2y");
  if (!tenYear || !twoYear || tenYear.quality.stale || twoYear.quality.stale) return;
  const value = (tenYear.value - twoYear.value) * 100;
  const previousClose = (tenYear.previousClose - twoYear.previousClose) * 100;
  updateIndicator(snapshot, {
    id: "yield-10y-2y",
    value,
    previousClose,
    changePercent: changePercent(value, previousClose),
    tone: value > previousClose ? "positive" : "negative",
    sparkline: tenYear.sparkline.map((point, index) => {
      const twoYearPoint = twoYear.sparkline[index];
      return {
        date: point.date,
        value: twoYearPoint ? Number(((point.value - twoYearPoint.value) * 100).toFixed(2)) : value
      };
    }),
    quality: {
      source: "FRED calculation (DGS10 - DGS2)",
      frequency: "Daily",
      baseDate: tenYear.quality.baseDate,
      lastUpdated: nowIso(),
      access: "free",
      stale: false
    }
  });
}

function calculateNetLiquidity(snapshot: MarketSnapshot) {
  const fedAssets = snapshot.indicators.find((indicator) => indicator.id === "fed-assets");
  const tga = snapshot.indicators.find((indicator) => indicator.id === "tga");
  const rrp = snapshot.indicators.find((indicator) => indicator.id === "rrp");
  if (!fedAssets || !tga || !rrp || fedAssets.quality.stale || tga.quality.stale || rrp.quality.stale) return;
  const value = fedAssets.value - tga.value - rrp.value;
  const previousClose = fedAssets.previousClose - tga.previousClose - rrp.previousClose;
  updateIndicator(snapshot, {
    id: "net-liquidity",
    value,
    previousClose,
    changePercent: changePercent(value, previousClose),
    tone: toneForChange(changePercent(value, previousClose)),
    sparkline: fedAssets.sparkline.map((point, index) => ({
      date: point.date,
      value: Number((point.value - (tga.sparkline[index]?.value ?? tga.value) - (rrp.sparkline[index]?.value ?? rrp.value)).toFixed(4))
    })),
    quality: {
      source: "FRED calculation (WALCL - WTREGEN - RRPONTSYD)",
      frequency: "Daily/Weekly",
      baseDate: fedAssets.quality.baseDate,
      lastUpdated: nowIso(),
      access: "free",
      stale: false
    }
  });
}

async function updateThemes(fetcher: Fetcher, snapshot: MarketSnapshot) {
  const themeUpdates = await Promise.all(
    snapshot.themes.map(async (theme) => {
      const key = `${theme.region}:${theme.name}`;
      const tickers = themeBaskets[key];
      if (!tickers) return theme;
      const series = await Promise.all(tickers.map((ticker) => fetchYahooSeries(fetcher, [ticker], "1mo")));
      const live = series.filter((item): item is PriceSeries => Boolean(item));
      if (!live.length) return theme;
      const oneDay = live.reduce((acc, item) => acc + item.changePercent, 0) / live.length;
      const fiveDayValues = live
        .map((item) => {
          const points = item.sparkline;
          const latest = points[points.length - 1]?.value;
          const fiveAgo = points[Math.max(0, points.length - 6)]?.value;
          return latest && fiveAgo ? changePercent(latest, fiveAgo) : item.changePercent;
        });
      const fiveDay = fiveDayValues.reduce((acc, item) => acc + item, 0) / fiveDayValues.length;
      const volumeRatios = live.map((item) => item.volumeRatio).filter((item): item is number => typeof item === "number");
      const volumeRatio = volumeRatios.length ? volumeRatios.reduce((acc, item) => acc + item, 0) / volumeRatios.length : theme.volumeRatio;
      const score = clampScore(50 + fiveDay * 4 + oneDay * 3 + (volumeRatio - 1) * 12);
      const tone: IndicatorTone = score >= 70 ? "positive" : score >= 45 ? "neutral" : "negative";
      return {
        ...theme,
        score,
        oneDay: Number(oneDay.toFixed(2)),
        fiveDay: Number(fiveDay.toFixed(2)),
        volumeRatio: Number(volumeRatio.toFixed(2)),
        tone,
        quality: normalizeQuality({
          source: `Yahoo Finance basket (${tickers.join(", ")})`,
          frequency: "Daily",
          baseDate: live[0].baseDate,
          lastUpdated: nowIso(),
          access: "free",
          stale: false
        })
      } satisfies ThemeMomentum;
    })
  );

  snapshot.themes = themeUpdates;
}

function scoreTrend(indicators: Indicator[]) {
  const live = indicators.filter((indicator) => !indicator.quality.stale && indicator.group === "price");
  if (!live.length) return 50;
  const scores = live.map((indicator) => {
    const values = indicator.sparkline.map((point) => point.value);
    const ma20 = movingAverage(values, Math.min(20, values.length));
    const aboveMa = ma20 ? indicator.value >= ma20 : indicator.changePercent >= 0;
    return clampScore(50 + indicator.changePercent * 8 + (aboveMa ? 15 : -15));
  });
  return clampScore(scores.reduce((acc, item) => acc + item, 0) / scores.length);
}

function scoreLiquidity(snapshot: MarketSnapshot) {
  const ids = ["net-liquidity", "bank-reserves", "rrp", "customer-deposits"];
  const live = ids
    .map((id) => snapshot.indicators.find((indicator) => indicator.id === id))
    .filter(isLiveIndicator);
  if (!live.length) return 50;
  const scores = live.map((indicator) => clampScore(50 + indicator.changePercent * (indicator.id === "rrp" ? -8 : 8)));
  return clampScore(scores.reduce((acc, item) => acc + item, 0) / scores.length);
}

function scoreRatesCredit(snapshot: MarketSnapshot) {
  const ids = ["us-10y", "real-yield-10y", "hy-oas", "ig-oas", "usd-krw", "dxy"];
  const live = ids
    .map((id) => snapshot.indicators.find((indicator) => indicator.id === id))
    .filter(isLiveIndicator);
  if (!live.length) return 50;
  const scores = live.map((indicator) => clampScore(50 - indicator.changePercent * 8));
  return clampScore(scores.reduce((acc, item) => acc + item, 0) / scores.length);
}

function scoreSentiment(snapshot: MarketSnapshot) {
  const ids = ["vix", "vxn", "vvix", "move", "put-call"];
  const live = ids
    .map((id) => snapshot.indicators.find((indicator) => indicator.id === id))
    .filter(isLiveIndicator);
  if (!live.length) return 50;
  const scores = live.map((indicator) => clampScore(50 - indicator.changePercent * 4));
  return clampScore(scores.reduce((acc, item) => acc + item, 0) / scores.length);
}

function recalculateScores(snapshot: MarketSnapshot) {
  const korea = snapshot.indicators.filter((indicator) => indicator.region === "korea");
  const us = snapshot.indicators.filter((indicator) => indicator.region === "us");
  const macroLiquidity = scoreLiquidity(snapshot);
  const ratesCredit = scoreRatesCredit(snapshot);
  const sentiment = scoreSentiment(snapshot);
  const koreaTrend = scoreTrend(korea);
  const usTrend = scoreTrend(us);
  const globalTrend = scoreTrend([...korea, ...us]);

  snapshot.scores = [
    makeMarketScore("global-risk", "Global Risk Score", "global", { trend: globalTrend, breadth: 50, liquidity: macroLiquidity, ratesCredit, flow: 50, sentimentVolatility: sentiment }, snapshot.generatedAt),
    makeMarketScore("korea-market", "Korea Market Score", "korea", { trend: koreaTrend, breadth: 50, liquidity: macroLiquidity, ratesCredit, flow: 45, sentimentVolatility: sentiment }, snapshot.generatedAt),
    makeMarketScore("us-market", "US Market Score", "us", { trend: usTrend, breadth: 50, liquidity: macroLiquidity, ratesCredit, flow: 55, sentimentVolatility: sentiment }, snapshot.generatedAt),
    makeMarketScore("liquidity", "Liquidity Score", "macro", { trend: 50, breadth: 50, liquidity: macroLiquidity, ratesCredit: 50, flow: 50, sentimentVolatility: 50 }, snapshot.generatedAt),
    makeMarketScore("breadth", "Breadth Score", "global", { trend: 50, breadth: 50, liquidity: 50, ratesCredit: 50, flow: 50, sentimentVolatility: 50 }, snapshot.generatedAt),
    makeMarketScore("volatility", "Volatility Score", "global", { trend: 50, breadth: 50, liquidity: 50, ratesCredit: 50, flow: 50, sentimentVolatility: sentiment }, snapshot.generatedAt)
  ];
}

function addAlert(
  alerts: MarketAlert[],
  id: string,
  title: string,
  detail: string,
  severity: AlertSeverity,
  region: MarketAlert["region"],
  rule: string,
  sourceIndicatorIds: string[]
) {
  alerts.push({
    id,
    title,
    detail,
    severity,
    region,
    rule,
    sourceIndicatorIds,
    triggeredAt: nowIso()
  });
}

function generateAlerts(snapshot: MarketSnapshot) {
  const alerts: MarketAlert[] = [];
  const byId = (id: string) => snapshot.indicators.find((indicator) => indicator.id === id);
  const vix = byId("vix");
  if (vix && !vix.quality.stale && vix.changePercent >= 15) {
    addAlert(alerts, "vix-spike", "VIX 급등", `VIX가 전일 대비 ${vix.changePercent.toFixed(2)}% 상승했습니다.`, "critical", "us", "VIX가 전일 대비 15% 이상 상승", ["vix"]);
  }
  const us10y = byId("us-10y");
  if (us10y && !us10y.quality.stale && us10y.value >= Math.max(...us10y.sparkline.map((point) => point.value))) {
    addAlert(alerts, "us10y-high", "미국 10년물 20일 고점", "미국 10년물 금리가 최근 20거래일 고점을 돌파했습니다.", "warning", "macro", "미국 10년물 금리가 20일 신고가 돌파", ["us-10y"]);
  }
  const usdKrw = byId("usd-krw");
  if (usdKrw && !usdKrw.quality.stale && usdKrw.value >= Math.max(...usdKrw.sparkline.map((point) => point.value))) {
    addAlert(alerts, "usdkrw-high", "USD/KRW 20일 고점", "원/달러 환율이 최근 20거래일 고점을 돌파했습니다.", "warning", "macro", "USD/KRW가 20일 신고가 돌파", ["usd-krw"]);
  }
  const hy = byId("hy-oas");
  if (hy && !hy.quality.stale) {
    const values = hy.sparkline.slice(-6).map((point) => point.value);
    const widening = values.length >= 6 && values.slice(1).every((value, index) => value > values[index]);
    if (widening) {
      addAlert(alerts, "hy-widening", "HY Spread 5일 연속 확대", "미국 HY OAS가 5개 관측치 연속 확대되었습니다.", "warning", "macro", "HY Spread가 5일 연속 확대", ["hy-oas"]);
    }
  }
  const sox = byId("sox");
  if (sox && !sox.quality.stale && sox.description?.includes("52w-high")) {
    addAlert(alerts, "sox-52w-high", "SOX 52주 신고가", "미국 반도체 지수가 52주 신고가권에 진입했습니다.", "info", "us", "SOX 52주 신고가", ["sox"]);
  }
  if (!alerts.length) {
    addAlert(alerts, "no-critical-alerts", "주요 실시간 경고 없음", "무료 데이터로 확인 가능한 주요 경고 조건은 현재 트리거되지 않았습니다.", "info", "global", "실데이터 기반 기본 경고 스캔", []);
  }
  snapshot.alerts = alerts;
}

function sourceLogId(source: string) {
  return source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52) || "source";
}

function sourceMessage(status: DataStatus, staleCount: number, delayedCount: number, freshCount: number) {
  if (status === "Error") return "Fetch failed; the dashboard is keeping the last usable value.";
  if (status === "Stale") return `${staleCount} stale item(s) remain on fallback or last-good data.`;
  if (status === "Delayed") return `${delayedCount} item(s) are current for their official release cadence.`;
  return `${freshCount} item(s) refreshed successfully from this free source.`;
}

function refreshSourceLogs(snapshot: MarketSnapshot) {
  type Accumulator = SourceFetchLog & {
    rank: number;
    staleCount: number;
    delayedCount: number;
    freshCount: number;
  };

  const rank: Record<DataStatus, number> = { Fresh: 0, Delayed: 1, Stale: 2, Error: 3 };
  const groups = new Map<string, Accumulator>();

  const register = (source: string, status: DataStatus, lastAttemptAt: string, affectedId: string) => {
    const current = groups.get(source);
    if (!current) {
      groups.set(source, {
        id: sourceLogId(source),
        source,
        status,
        lastAttemptAt,
        message: "",
        affectedIndicatorIds: [affectedId],
        rank: rank[status],
        staleCount: status === "Stale" ? 1 : 0,
        delayedCount: status === "Delayed" ? 1 : 0,
        freshCount: status === "Fresh" ? 1 : 0
      });
      return;
    }

    current.status = rank[status] > current.rank ? status : current.status;
    current.rank = Math.max(current.rank, rank[status]);
    current.lastAttemptAt = current.lastAttemptAt > lastAttemptAt ? current.lastAttemptAt : lastAttemptAt;
    current.affectedIndicatorIds = Array.from(new Set([...(current.affectedIndicatorIds ?? []), affectedId]));
    current.staleCount += status === "Stale" ? 1 : 0;
    current.delayedCount += status === "Delayed" ? 1 : 0;
    current.freshCount += status === "Fresh" ? 1 : 0;
  };

  for (const indicator of snapshot.indicators) {
    const quality = normalizeQuality(indicator.quality);
    indicator.quality = quality;
    register(quality.source, quality.status ?? "Delayed", quality.lastUpdated, indicator.id);
  }

  for (const theme of snapshot.themes) {
    const quality = normalizeQuality(theme.quality);
    theme.quality = quality;
    register(quality.source, quality.status ?? "Delayed", quality.lastUpdated, `theme:${theme.name}`);
  }

  const liveLogs = Array.from(groups.values()).map((log) => ({
    id: log.id,
    source: log.source,
    status: log.status,
    lastAttemptAt: log.lastAttemptAt,
    latencyMs: log.latencyMs,
    affectedIndicatorIds: log.affectedIndicatorIds,
    message: sourceMessage(log.status, log.staleCount, log.delayedCount, log.freshCount)
  }));
  const existingLogs = (snapshot.sourceLogs ?? []).filter((log) => !groups.has(log.source));

  snapshot.sourceLogs = [...liveLogs, ...existingLogs].sort((a, b) => rank[b.status] - rank[a.status]);
}

export async function getLiveMarketSnapshot(fetcher: Fetcher = fetch): Promise<MarketSnapshot> {
  const snapshot = cloneFallbackSnapshot();
  snapshot.generatedAt = nowIso();

  const yahooEntries = Object.entries(yahooSources);
  const yahooResults = await Promise.all(
    yahooEntries.map(async ([id, symbols]) => {
      const range = id === "sox" ? "1y" : "1mo";
      const result = await fetchYahooSeries(fetcher, symbols, range);
      return [id, result] as const;
    })
  );

  for (const [id, result] of yahooResults) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, {
      ...yahooUpdate(id, result, current?.unit),
      description: result.high52Week ? `${current?.description ?? ""} 52w-high` : current?.description
    });
  }

  const krxIndexMain = await fetchKrxIndexMain(fetcher);
  if (krxIndexMain) {
    for (const [id, result] of Object.entries(krxIndexMain)) {
      const current = snapshot.indicators.find((indicator) => indicator.id === id);
      updateIndicator(snapshot, yahooUpdate(id, result, current?.unit));
    }
  }

  const cboePutCall = await fetchCboePutCall(fetcher);
  if (cboePutCall) {
    updateIndicator(snapshot, {
      ...yahooUpdate("put-call", cboePutCall, ""),
      tone: "neutral",
      description: "Official current CBOE total put/call ratio. The public daily page does not expose a previous-day API value, so intraday change is set to 0 until a historical feed is added."
    });
  }

  const [
    treasuryNominalCurve,
    treasuryRealCurve,
    sofrSeries,
    rrpSeries,
    finraMarginDebt,
    pceSeries,
    corePceSeries,
    clevelandNowcast,
    h41Series,
    dolInitialClaims,
    krThreeYearYield,
    krTenYearYield,
    aaiiBullBear,
    blsLevelResults
  ] = await Promise.all([
    fetchTreasuryCurve(fetcher, "daily_treasury_yield_curve", ["BC_2YEAR", "BC_10YEAR", "BC_30YEAR"]),
    fetchTreasuryCurve(fetcher, "daily_treasury_real_yield_curve", ["TC_10YEAR"]),
    fetchNewYorkFedSofr(fetcher),
    fetchNewYorkFedRrp(fetcher),
    fetchFinraMarginDebt(fetcher),
    fetchBeaInflationPage(fetcher, "https://www.bea.gov/data/personal-consumption-expenditures-price-index"),
    fetchBeaInflationPage(fetcher, "https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy"),
    fetchClevelandNowcast(fetcher),
    fetchFedH41(fetcher),
    fetchDolInitialClaims(fetcher),
    fetchBokKoreaBondYield(fetcher, "010200000"),
    fetchBokKoreaBondYield(fetcher, "010210000"),
    fetchAaiiBullBearSpread(fetcher),
    Promise.all(
      Object.entries(blsLevelSources).map(async ([id, seriesId]) => {
        const result = await fetchBlsLevel(fetcher, seriesId);
        return [id, seriesId, result] as const;
      })
    )
  ]);

  if (treasuryNominalCurve) {
    const treasuryUpdates = [
      ["us-2y", "BC_2YEAR"],
      ["us-10y", "BC_10YEAR"],
      ["us-30y", "BC_30YEAR"]
    ] as const;
    for (const [id, field] of treasuryUpdates) {
      const result = treasuryCurveSeries(treasuryNominalCurve, field, "U.S. Treasury Daily Treasury Par Yield Curve Rates");
      const current = snapshot.indicators.find((indicator) => indicator.id === id);
      if (result) updateIndicator(snapshot, datedSeriesUpdate(id, result, current?.unit, true));
    }
  }

  if (treasuryRealCurve) {
    const result = treasuryCurveSeries(treasuryRealCurve, "TC_10YEAR", "U.S. Treasury Daily Treasury Real Yield Curve Rates");
    const current = snapshot.indicators.find((indicator) => indicator.id === "real-yield-10y");
    if (result) updateIndicator(snapshot, datedSeriesUpdate("real-yield-10y", result, current?.unit, true));
  }

  if (treasuryNominalCurve && treasuryRealCurve) {
    const realByDate = new Map(treasuryRealCurve.rows.map((row) => [row.date, row.values.TC_10YEAR]));
    const result = makeDatedSeries({
      rows: treasuryNominalCurve.rows
        .map((row) => {
          const real = realByDate.get(row.date);
          return typeof real === "number" ? { date: row.date, value: row.values.BC_10YEAR - real } : null;
        })
        .filter((row): row is { date: string; value: number } => Boolean(row)),
      source: "U.S. Treasury calculation (10Y nominal - 10Y real)",
      sourceUrl: treasuryNominalCurve.sourceUrl,
      frequency: "Daily"
    });
    const current = snapshot.indicators.find((indicator) => indicator.id === "bei-10y");
    if (result) updateIndicator(snapshot, datedSeriesUpdate("bei-10y", result, current?.unit, true));
  }

  const officialSeriesUpdates: Array<[string, DatedSeries | null, boolean?]> = [
    ["sofr", sofrSeries, true],
    ["rrp", rrpSeries, true],
    ["finra-margin", finraMarginDebt],
    ["pce", pceSeries, true],
    ["core-pce", corePceSeries, true],
    ["cleveland-nowcast", clevelandNowcast, true],
    ["jobless-claims", dolInitialClaims, true],
    ["kr-3y", krThreeYearYield, true],
    ["kr-10y", krTenYearYield, true],
    ["aaii", aaiiBullBear]
  ];
  for (const [id, result, inverse] of officialSeriesUpdates) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, datedSeriesUpdate(id, result, current?.unit, inverse));
  }

  if (h41Series) {
    for (const [id, result] of Object.entries(h41Series)) {
      const current = snapshot.indicators.find((indicator) => indicator.id === id);
      updateIndicator(snapshot, datedSeriesUpdate(id, result, current?.unit, id === "tga"));
    }
  }

  const blsEntries = Object.entries(blsSources);
  const blsResults = await Promise.all(
    blsEntries.map(async ([id, seriesId]) => {
      const result = await fetchBlsInflation(fetcher, id, seriesId);
      return [id, seriesId, result] as const;
    })
  );
  for (const [id, seriesId, result] of [...blsResults, ...blsLevelResults]) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, {
      ...datedSeriesUpdate(id, result, current?.unit, true),
      quality: {
        source: `BLS Public API (${seriesId})`,
        sourceUrl: result.sourceUrl,
        frequency: result.frequency,
        baseDate: result.baseDate,
        lastUpdated: nowIso(),
        access: "free",
        stale: false
      }
    });
  }

  const cftcEntries = Object.entries(cftcSources);
  const cftcText = await fetchCftcTffText(fetcher);
  const cftcResults = cftcEntries.map(([id, matchers]) => {
    const result = cftcText ? parseCftcTff(cftcText.text, cftcText.sourceUrl, matchers) : null;
    return [id, result] as const;
  });
  for (const [id, result] of cftcResults) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, {
      id,
      value: result.value,
      previousClose: result.previousClose,
      changePercent: result.changePercent,
      unit: current?.unit,
      tone: toneForChange(result.changePercent),
      sparkline: result.sparkline,
      quality: {
        source: result.source,
        sourceUrl: result.sourceUrl,
        frequency: "Weekly",
        baseDate: result.baseDate,
        lastUpdated: result.lastUpdated,
        access: "free",
        stale: false
      }
    });
  }

  const fredEntries = Object.entries(fredSources).filter(([id]) => {
    const indicator = snapshot.indicators.find((item) => item.id === id);
    return !indicator || indicator.quality.stale;
  });
  const fredResults = await Promise.all(
    fredEntries.map(async ([id, config]) => {
      const result = await fetchFredSeries(fetcher, config.series, config.transform);
      return [id, config.series, result] as const;
    })
  );

  for (const [id, series, result] of fredResults) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    let transformed: FredSeries | null = result;
    if (["cpi", "core-cpi", "pce", "core-pce"].includes(id)) transformed = yearOverYearFromFred(result);
    if (id === "retail-sales") transformed = monthOverMonthFromFred(result);
    if (!transformed) continue;
    updateIndicator(snapshot, {
      ...fredUpdate(id, transformed, current?.unit),
      quality: {
        source: `FRED (${series})`,
        sourceUrl: transformed.sourceUrl,
        frequency: ["cpi", "core-cpi", "pce", "core-pce", "ism-mfg", "unemployment", "retail-sales"].includes(id) ? "Monthly" : "Daily/Weekly",
        baseDate: transformed.baseDate,
        lastUpdated: nowIso(),
        access: "free",
        stale: false
      }
    });
  }

  const staleRateFallbacks = Object.entries(yahooRateFallbacks).filter(([id]) => {
    const indicator = snapshot.indicators.find((item) => item.id === id);
    return !indicator || indicator.quality.stale;
  });
  const yahooRateResults = await Promise.all(
    staleRateFallbacks.map(async ([id, config]) => {
      const result = await fetchYahooSeries(fetcher, config.symbols, "1mo");
      return [id, config, result] as const;
    })
  );
  for (const [id, config, result] of yahooRateResults) {
    if (!result) continue;
    const transformed = transformYahooSeries(result, config.transform);
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, {
      ...yahooUpdate(id, transformed, current?.unit),
      quality: {
        source: `${transformed.source} / Treasury yield proxy`,
        sourceUrl: transformed.sourceUrl,
        frequency: "Daily",
        baseDate: transformed.baseDate,
        lastUpdated: nowIso(),
        access: "free",
        stale: false
      }
    });
  }

  calculateSpread(snapshot);
  calculateNetLiquidity(snapshot);
  await updateThemes(fetcher, snapshot);
  recalculateScores(snapshot);
  generateAlerts(snapshot);
  refreshSourceLogs(snapshot);

  return snapshot;
}
