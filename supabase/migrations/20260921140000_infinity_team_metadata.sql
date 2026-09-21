UPDATE public.events SET is_team_event = true, min_team_size = 4, max_team_size = 4,
  updated_at = now() WHERE slug = 'infinity-trials';
