-- Prices are the external-member unit charge (or external-team charge for
-- Infinity Trials). Eligibility and final amounts are calculated server-side
-- from verified participant email domains.
UPDATE public.events
SET price = 200.00, is_team_event = true, min_team_size = 4, max_team_size = 4, updated_at = now()
WHERE slug = 'infinity-trials';

UPDATE public.events
SET price = 50.00, is_team_event = true, min_team_size = 2, max_team_size = 4, updated_at = now()
WHERE slug IN ('bgmi-elite-showdown', 'research-x');
