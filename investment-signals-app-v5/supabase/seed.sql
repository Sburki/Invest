insert into opportunities (
  symbol, name, sector, price, day_change,
  quality_score, momentum_score, valuation_score, stability_score, growth_score,
  total_score, risk_level, thesis, updated_at
) values
('MSFT', 'Microsoft', 'AI / Cloud', 428, 1.9, 90, 82, 48, 72, 86, 79, 'medium', 'Robuste Cashflows und AI-Plattform.', now()),
('ASML', 'ASML Holding', 'Semiconductors', 910, 1.2, 87, 74, 50, 68, 85, 77, 'medium', 'Starke Marktstellung in Lithographie.', now()),
('VWCE', 'Vanguard FTSE All-World UCITS ETF', 'ETF', 124, 0.4, 72, 63, 70, 86, 65, 73, 'low', 'Breite Diversifikation als Basisinvestment.', now());


-- Optional: Beispiel-Profil wird nach dem ersten Login automatisch angelegt.
