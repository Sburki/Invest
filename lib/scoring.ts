type RawAsset = {
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

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreAsset(asset: RawAsset) {
  const quality = clampScore(((asset.grossMargin ?? 0) * 1.2) - ((asset.debtToEquity ?? 0) * 8) + 40);
  const momentum = clampScore(((asset.momentum6m ?? 0) * 2) + 50);
  const valuation = clampScore(100 - ((asset.pe ?? 25) * 2));
  const stability = clampScore(100 - ((asset.volatility ?? 20) * 2));
  const growth = clampScore(((asset.revenueGrowth ?? 0) * 2) + 50);

  const total = clampScore(
    quality * 0.28 +
      momentum * 0.2 +
      valuation * 0.15 +
      stability * 0.17 +
      growth * 0.2,
  );

  const risk = stability >= 70 ? 'low' : stability >= 45 ? 'medium' : 'high';

  return {
    symbol: asset.symbol,
    name: asset.name,
    sector: asset.sector,
    price: asset.price ?? null,
    day_change: asset.dayChange ?? null,
    quality_score: quality,
    momentum_score: momentum,
    valuation_score: valuation,
    stability_score: stability,
    growth_score: growth,
    total_score: total,
    risk_level: risk,
    thesis: `${asset.name} zeigt eine Kombination aus Qualität, Wachstum und Marktdynamik.`,
  };
}
