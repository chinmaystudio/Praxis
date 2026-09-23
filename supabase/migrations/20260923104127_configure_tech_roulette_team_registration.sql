BEGIN;

UPDATE public.events
SET price = 49.00,
    is_team_event = true,
    min_team_size = 2,
    max_team_size = 3,
    updated_at = now()
WHERE slug = 'tech-roulette';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'registrations_tech_roulette_team_size_check'
      AND conrelid = 'public.registrations'::regclass
  ) THEN
    ALTER TABLE public.registrations
      ADD CONSTRAINT registrations_tech_roulette_team_size_check
      CHECK (event_slug <> 'tech-roulette' OR team_size BETWEEN 2 AND 3)
      NOT VALID;
  END IF;
END
$$;

COMMIT;
