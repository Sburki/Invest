export type RawAsset = {
  symbol: string;
  name: string;
  sector: string;
  pe?: number | null;
  revenueGrowth?: number | null;
  grossMargin?: number | null;
  debtToEquity?: number | null;
  momentum6m?: number | null;
  volatility?: number | null;
  price?: number | null;
  dayChange?: number | null;
};

const FALLBACK_UNIVERSE: RawAsset[] = [
  {
    symbol: 'MSFT',
    name: 'Microsoft',
    sector: 'AI / Cloud',
    pe: 34,
    revenueGrowth: 15,
    grossMargin: 69,
    debtToEquity: 0.4,
    momentum6m: 18,
    volatility: 24,
    price: 428,
    dayChange: 1.9,
  },
  {
    symbol: 'ASML',
    name: 'ASML Holding',
    sector: 'Semiconductors',
    pe: 31,
    revenueGrowth: 21,
    grossMargin: 51,
    debtToEquity: 0.3,
    momentum6m: 12,
    volatility: 28,
    price: 910,
    dayChange: 1.2,
  },
  {
    symbol: 'NESN',
    name: 'Nestlé',
    sector: 'Defensive',
    pe: 22,
    revenueGrowth: 5,
    grossMargin: 48,
    debtToEquity: 0.8,
    momentum6m: 4,
    volatility: 13,
    price: 93,
    dayChange: 0.3,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA',
    sector: 'AI / Chips',
    pe: 56,
    revenueGrowth: 42,
    grossMargin: 76,
    debtToEquity: 0.2,
    momentum6m: 24,
    volatility: 39,
    price: 932,
    dayChange: 2.8,
  },
  {
    symbol: 'VWCE',
    name: 'Vanguard FTSE All-World UCITS ETF',
    sector: 'ETF',
    pe: null,
    revenueGrowth: 8,
    grossMargin: 35,
    debtToEquity: 0,
    momentum6m: 9,
    volatility: 14,
    price: 124,
    dayChange: 0.4,
  },
];

const ALPHA_VANTAGE_OVERRIDES: Record<string, Partial<RawAsset>> = {
  MSFT: { name: 'Microsoft', sector: 'AI / Cloud', pe: 34, revenueGrowth: 15, grossMargin: 69, debtToEquity: 0.4, volatility: 24 },
  ASML: { name: 'ASML Holding', sector: 'Semiconductors', pe: 31, revenueGrowth: 21, grossMargin: 51, debtToEquity: 0.3, volatility: 28 },
  NESN: { name: 'Nestlé', sector: 'Defensive', pe: 22, revenueGrowth: 5, grossMargin: 48, debtToEquity: 0.8, volatility: 13 },
  NVDA: { name: 'NVIDIA', sector: 'AI / Chips', pe: 56, revenueGrowth: 42, grossMargin: 76, debtToEquity: 0.2, volatility: 39 },
  VWCE: { name: 'Vanguard FTSE All-World UCITS ETF', sector: 'ETF', pe: null, revenueGrowth: 8, grossMargin: 35, debtToEquity: 0, volatility: 14 },
};

function getRequestedSymbols() {
  const raw = process.env.MARKET_SYMBOLS?.trim();
  if (!raw) return FALLBACK_UNIVERSE.map((item) => item.symbol);
  return raw.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
}

async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<RawAsset | null> {
  const quoteUrl = new URL('https://www.alphavantage.co/query');
  quoteUrl.searchParams.set('function', 'GLOBAL_QUOTE');
  quoteUrl.searchParams.set('symbol', symbol);
  quoteUrl.searchParams.set('apikey', apiKey);

  const response = await fetch(quoteUrl.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage quote request failed for ${symbol}: ${response.status}`);
  }

  const payload = await response.json();
  const quote = payload['Global Quote'];
  if (!quote || !quote['05. price']) {
    return null;
  }

  const price = Number(quote['05. price']);
  const dayChangePercentRaw = String(quote['10. change percent'] ?? '0').replace('%', '');
  const dayChange = Number(dayChangePercentRaw);
  const previousClose = Number(quote['08. previous close'] ?? price);
  const momentum6m = previousClose > 0 ? ((price - previousClose) / previousClose) * 20 : 0;

  return {
    symbol,
    name: ALPHA_VANTAGE_OVERRIDES[symbol]?.name ?? symbol,
    sector: ALPHA_VANTAGE_OVERRIDES[symbol]?.sector ?? 'Unknown',
    pe: ALPHA_VANTAGE_OVERRIDES[symbol]?.pe ?? null,
    revenueGrowth: ALPHA_VANTAGE_OVERRIDES[symbol]?.revenueGrowth ?? null,
    grossMargin: ALPHA_VANTAGE_OVERRIDES[symbol]?.grossMargin ?? null,
    debtToEquity: ALPHA_VANTAGE_OVERRIDES[symbol]?.debtToEquity ?? null,
    volatility: ALPHA_VANTAGE_OVERRIDES[symbol]?.volatility ?? null,
    momentum6m,
    price,
    dayChange,
  };
}

async function getAlphaVantageUniverse() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is missing');
  }

  const symbols = getRequestedSymbols();
  const results = await Promise.allSettled(symbols.map((symbol) => fetchAlphaVantageQuote(symbol, apiKey)));

  return results
    .flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
}

export async function getMarketUniverse() {
  const provider = (process.env.MARKET_DATA_PROVIDER ?? 'mock').toLowerCase();

  if (provider === 'alphavantage') {
    try {
      const live = await getAlphaVantageUniverse();
      if (live.length > 0) return live;
    } catch (error) {
      console.error('Live market data failed, falling back to mock universe.', error);
    }
  }

  return FALLBACK_UNIVERSE;
}
