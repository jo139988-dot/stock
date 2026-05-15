import { marketSnapshot } from "./market-data";
import type {
  AlertSeverity,
  Indicator,
  IndicatorTone,
  MarketAlert,
  MarketSnapshot,
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

const cftcSources: Record<string, string[]> = {
  "cftc-spx": ["E-MINI S&P 500", "S&P 500 Consolidated", "S&P 500 STOCK INDEX"],
  "cftc-nq": ["NASDAQ-100", "NASDAQ 100"],
  "cftc-10y": ["10-YEAR U.S. TREASURY", "10-YEAR TREASURY"],
  "cftc-dollar": ["U.S. DOLLAR INDEX", "US DOLLAR INDEX"]
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

function dateLabel(timestampSeconds: number) {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

function cloneFallbackSnapshot(): MarketSnapshot {
  const cloned = structuredClone(marketSnapshot) as MarketSnapshot;
  const now = nowIso();
  cloned.generatedAt = now;
  cloned.indicators = cloned.indicators.map((indicator) => ({
    ...indicator,
    quality: {
      ...indicator.quality,
      lastUpdated: now,
      stale: true,
      source: `${indicator.quality.source} / fallback sample`
    }
  }));
  cloned.themes = cloned.themes.map((theme) => ({
    ...theme,
    quality: {
      ...theme.quality,
      lastUpdated: now,
      stale: true,
      source: `${theme.quality.source} / fallback sample`
    }
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

async function fetchCftcTff(fetcher: Fetcher, id: string, matchers: string[]): Promise<CftcSeries | null> {
  const sourceUrl = "https://www.cftc.gov/dea/newcot/FinComWk.txt";
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      }
    }, 8000);
    if (!response.ok) return null;
    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 20);
    const line = lines.find((item) => {
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
  } catch {
    return null;
  }
}

async function fetchBlsInflation(fetcher: Fetcher, id: string, seriesId: string): Promise<BlsSeries | null> {
  const sourceUrl = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
  const endYear = new Date().getUTCFullYear();
  const startYear = endYear - 2;
  try {
    const response = await fetchWithTimeout(fetcher, sourceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 market-regime-monitor"
      },
      body: JSON.stringify({
        seriesid: [seriesId],
        startyear: String(startYear),
        endyear: String(endYear)
      })
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
      sourceUrl: `https://www.bls.gov/cpi/data.htm`,
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
    quality: {
      ...current.quality,
      ...update.quality
    }
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
        quality: {
          source: `Yahoo Finance basket (${tickers.join(", ")})`,
          frequency: "Daily",
          baseDate: live[0].baseDate,
          lastUpdated: nowIso(),
          access: "free",
          stale: false
        }
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

  const cboePutCall = await fetchCboePutCall(fetcher);
  if (cboePutCall) {
    updateIndicator(snapshot, {
      ...yahooUpdate("put-call", cboePutCall, ""),
      tone: "neutral",
      description: "Official current CBOE total put/call ratio. The public daily page does not expose a previous-day API value, so intraday change is set to 0 until a historical feed is added."
    });
  }

  const fredEntries = Object.entries(fredSources);
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

  const blsEntries = Object.entries(blsSources);
  const blsResults = await Promise.all(
    blsEntries.map(async ([id, seriesId]) => {
      const result = await fetchBlsInflation(fetcher, id, seriesId);
      return [id, seriesId, result] as const;
    })
  );
  for (const [id, seriesId, result] of blsResults) {
    if (!result) continue;
    const current = snapshot.indicators.find((indicator) => indicator.id === id);
    updateIndicator(snapshot, {
      id,
      value: result.value,
      previousClose: result.previousClose,
      changePercent: result.changePercent,
      unit: current?.unit,
      tone: toneForChange(result.changePercent, true),
      sparkline: result.sparkline,
      quality: {
        source: `BLS Public API (${seriesId})`,
        sourceUrl: result.sourceUrl,
        frequency: "Monthly",
        baseDate: result.baseDate,
        lastUpdated: nowIso(),
        access: "free",
        stale: false
      }
    });
  }

  const cftcEntries = Object.entries(cftcSources);
  const cftcResults = await Promise.all(
    cftcEntries.map(async ([id, matchers]) => {
      const result = await fetchCftcTff(fetcher, id, matchers);
      return [id, result] as const;
    })
  );
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

  return snapshot;
}
