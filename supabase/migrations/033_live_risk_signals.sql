-- Migration 033: two more Live signals (monthly, text-based indices).
INSERT INTO live_signals (id, meta_index, name, description, source_org, source_url, frequency, scoring, weight, display_order) VALUES
  ('geopolitical_risk', 'social', 'Geopolitical risk momentum',
   '3-month change in the 3-month average of the country-specific Geopolitical Risk index (share of newspaper articles about geopolitical tensions), scaled by the country''s own historical volatility since 2000.',
   'Caldara & Iacoviello (Federal Reserve Board)', 'https://www.matteoiacoviello.com/gpr.htm', 'monthly', 'momentum_z', 0.75, 60),
  ('policy_uncertainty', 'economic', 'Policy uncertainty momentum',
   '3-month change in the 3-month average of the country Economic Policy Uncertainty index (newspaper coverage of policy uncertainty), scaled by the country''s own historical volatility since 2000.',
   'Baker, Bloom & Davis — policyuncertainty.com', 'https://www.policyuncertainty.com/', 'monthly', 'momentum_z', 0.75, 70)
ON CONFLICT (id) DO UPDATE SET
  meta_index = EXCLUDED.meta_index, name = EXCLUDED.name, description = EXCLUDED.description,
  source_org = EXCLUDED.source_org, source_url = EXCLUDED.source_url, frequency = EXCLUDED.frequency,
  scoring = EXCLUDED.scoring, weight = EXCLUDED.weight, display_order = EXCLUDED.display_order;
