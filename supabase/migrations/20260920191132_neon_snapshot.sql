BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.payment_audit_logs_id_seq;

CREATE TABLE public."events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" character varying(100) NOT NULL,
  "title" character varying(255) NOT NULL,
  "theme" character varying(100),
  "description" text,
  "price" numeric(10,2) DEFAULT 0.00 NOT NULL,
  "currency" character varying(10) DEFAULT 'INR'::character varying NOT NULL,
  "is_team_event" boolean DEFAULT false NOT NULL,
  "min_team_size" integer DEFAULT 1 NOT NULL,
  "max_team_size" integer DEFAULT 1 NOT NULL,
  "registration_open" boolean DEFAULT true NOT NULL,
  "capacity" integer DEFAULT 100,
  "image_url" text,
  "rulebook_url" text,
  "accent_color" character varying(32) DEFAULT '#00ff9c'::character varying,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_pkey" PRIMARY KEY (id),
  CONSTRAINT "events_slug_key" UNIQUE (slug)
);

CREATE TABLE public."registrations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "registration_code" character varying(32) NOT NULL,
  "event_id" uuid NOT NULL,
  "event_slug" character varying(100) NOT NULL,
  "lead_name" character varying(255) NOT NULL,
  "lead_email" character varying(255) NOT NULL,
  "lead_phone" character varying(32) NOT NULL,
  "college" character varying(255) NOT NULL,
  "department" character varying(128) NOT NULL,
  "year_of_study" character varying(64) NOT NULL,
  "team_name" character varying(255),
  "team_size" integer DEFAULT 1 NOT NULL,
  "status" character varying(32) DEFAULT 'pending'::character varying NOT NULL,
  "custom_fields" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT "registrations_pkey" PRIMARY KEY (id),
  CONSTRAINT "registrations_registration_code_key" UNIQUE (registration_code),
  CONSTRAINT "registrations_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'waitlisted'::character varying])::text[])))
);

CREATE TABLE public."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "registration_id" uuid NOT NULL,
  "event_id" uuid,
  "event_slug" character varying(100) NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "currency" character varying(10) DEFAULT 'INR'::character varying NOT NULL,
  "status" character varying(32) DEFAULT 'created'::character varying NOT NULL,
  "razorpay_order_id" character varying(128) NOT NULL,
  "razorpay_payment_id" character varying(128),
  "razorpay_signature" text,
  "payment_method" character varying(64),
  "upi_vpa" character varying(128),
  "card_network" character varying(64),
  "card_last4" character varying(8),
  "bank_name" character varying(128),
  "wallet_name" character varying(128),
  "failure_code" character varying(128),
  "failure_reason" text,
  "paid_at" timestamp with time zone,
  "refunded_at" timestamp with time zone,
  "raw_payload" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payments_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY (id),
  CONSTRAINT "payments_razorpay_order_id_key" UNIQUE (razorpay_order_id),
  CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  CONSTRAINT "payments_status_check" CHECK (((status)::text = ANY ((ARRAY['created'::character varying, 'pending'::character varying, 'paid'::character varying, 'captured'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[])))
);

CREATE TABLE public."payment_audit_logs" (
  "id" bigint DEFAULT nextval('payment_audit_logs_id_seq'::regclass) NOT NULL,
  "payment_id" uuid,
  "razorpay_order_id" character varying(128),
  "event_type" character varying(64) NOT NULL,
  "from_status" character varying(32),
  "to_status" character varying(32),
  "payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "payment_audit_logs_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."registrations_bgmi" (
  "registration_id" uuid NOT NULL,
  "team_name" character varying(255) NOT NULL,
  "captain_name" character varying(255) NOT NULL,
  "captain_ign" character varying(100) NOT NULL,
  "captain_uid" character varying(64) NOT NULL,
  "player2_name" character varying(255) NOT NULL,
  "player2_ign" character varying(100) NOT NULL,
  "player2_uid" character varying(64) NOT NULL,
  "player3_name" character varying(255) NOT NULL,
  "player3_ign" character varying(100) NOT NULL,
  "player3_uid" character varying(64) NOT NULL,
  "player4_name" character varying(255) NOT NULL,
  "player4_ign" character varying(100) NOT NULL,
  "player4_uid" character varying(64) NOT NULL,
  "substitute_name" character varying(255),
  "substitute_ign" character varying(100),
  "substitute_uid" character varying(64),
  "discord_id" character varying(100),
  "device_model" character varying(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_bgmi_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registrations_bgmi_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE public."registrations_infinity_trials" (
  "registration_id" uuid NOT NULL,
  "team_name" character varying(255) NOT NULL,
  "domain_focus" character varying(100),
  "team_members" jsonb DEFAULT '[]'::jsonb,
  "github_org_or_repo" text,
  "project_pitch" text,
  "tech_stack" text[],
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_infinity_trials_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registrations_infinity_trials_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE public."registrations_research_x" (
  "registration_id" uuid NOT NULL,
  "paper_title" character varying(500) NOT NULL,
  "track_domain" character varying(100) NOT NULL,
  "abstract" text NOT NULL,
  "faculty_mentor_name" character varying(255),
  "faculty_mentor_email" character varying(255),
  "paper_link" text,
  "presentation_link" text,
  "co_authors" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_research_x_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registrations_research_x_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE public."registrations_storyverse" (
  "registration_id" uuid NOT NULL,
  "story_genre" character varying(100) NOT NULL,
  "ai_tools_planned" text[],
  "engine_framework" character varying(100),
  "partner_name" character varying(255),
  "partner_email" character varying(255),
  "portfolio_link" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_storyverse_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registrations_storyverse_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE public."registrations_tech_roulette" (
  "registration_id" uuid NOT NULL,
  "track_preference" character varying(100) NOT NULL,
  "experience_level" character varying(64) DEFAULT 'Intermediate'::character varying,
  "partner_name" character varying(255),
  "partner_email" character varying(255),
  "partner_phone" character varying(32),
  "tools_proficient" text[],
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "registrations_tech_roulette_pkey" PRIMARY KEY (registration_id),
  CONSTRAINT "registrations_tech_roulette_registration_id_fkey" FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order ON public.payment_audit_logs USING btree (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments USING btree (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments USING btree (razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON public.payments USING btree (registration_id);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);

CREATE INDEX IF NOT EXISTS idx_registrations_code ON public.registrations USING btree (registration_code);

CREATE INDEX IF NOT EXISTS idx_registrations_email_event ON public.registrations USING btree (lead_email, event_slug);

CREATE INDEX IF NOT EXISTS idx_registrations_event_slug ON public.registrations USING btree (event_slug);

CREATE INDEX IF NOT EXISTS idx_registrations_lead_email ON public.registrations USING btree (lead_email);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations USING btree (status);

CREATE VIEW public."v_all_registrations_overview" WITH (security_invoker=true) AS  SELECT r.id AS registration_id,
    r.registration_code,
    e.title AS event_title,
    r.event_slug,
    r.lead_name,
    r.lead_email,
    r.lead_phone,
    r.college,
    r.department,
    r.year_of_study,
    r.team_name,
    r.team_size,
    r.status AS registration_status,
    p.status AS payment_status,
    p.amount AS payment_amount,
    p.payment_method,
    p.razorpay_order_id,
    p.razorpay_payment_id,
    p.paid_at,
    r.created_at AS registered_at
   FROM registrations r
     JOIN events e ON r.event_id = e.id
     LEFT JOIN payments p ON r.id = p.registration_id;;

CREATE VIEW public."v_bgmi_roster" WITH (security_invoker=true) AS  SELECT r.registration_code,
    b.team_name,
    r.lead_name AS contact_person,
    r.lead_phone AS contact_phone,
    r.lead_email AS contact_email,
    b.captain_name,
    b.captain_ign,
    b.captain_uid,
    b.player2_name,
    b.player2_ign,
    b.player2_uid,
    b.player3_name,
    b.player3_ign,
    b.player3_uid,
    b.player4_name,
    b.player4_ign,
    b.player4_uid,
    b.substitute_name,
    b.substitute_ign,
    b.substitute_uid,
    b.discord_id,
    b.device_model,
    r.status AS registration_status,
    COALESCE(p.status, 'unpaid'::character varying) AS payment_status,
    p.amount AS fee_paid,
    p.razorpay_payment_id,
    r.created_at
   FROM registrations r
     JOIN registrations_bgmi b ON r.id = b.registration_id
     LEFT JOIN payments p ON r.id = p.registration_id;;

CREATE VIEW public."v_infinity_trials_squads" WITH (security_invoker=true) AS  SELECT r.registration_code,
    inf.team_name,
    r.lead_name AS team_lead,
    r.lead_email,
    r.lead_phone,
    r.college,
    inf.domain_focus,
    inf.team_members,
    inf.github_org_or_repo,
    inf.project_pitch,
    inf.tech_stack,
    r.status AS registration_status,
    COALESCE(p.status, 'unpaid'::character varying) AS payment_status,
    p.amount AS fee_paid,
    p.razorpay_payment_id,
    r.created_at
   FROM registrations r
     JOIN registrations_infinity_trials inf ON r.id = inf.registration_id
     LEFT JOIN payments p ON r.id = p.registration_id;;

CREATE VIEW public."v_research_x_submissions" WITH (security_invoker=true) AS  SELECT r.registration_code,
    r.lead_name AS primary_author,
    r.lead_email AS author_email,
    r.lead_phone AS author_phone,
    r.college,
    rx.paper_title,
    rx.track_domain,
    rx.abstract,
    rx.faculty_mentor_name,
    rx.faculty_mentor_email,
    rx.paper_link,
    rx.presentation_link,
    rx.co_authors,
    r.status AS registration_status,
    COALESCE(p.status, 'unpaid'::character varying) AS payment_status,
    p.amount AS fee_paid,
    p.razorpay_payment_id,
    r.created_at
   FROM registrations r
     JOIN registrations_research_x rx ON r.id = rx.registration_id
     LEFT JOIN payments p ON r.id = p.registration_id;;

CREATE VIEW public."v_storyverse_entries" WITH (security_invoker=true) AS  SELECT r.registration_code,
    r.lead_name AS creator_name,
    r.lead_email,
    r.lead_phone,
    r.college,
    sv.story_genre,
    sv.ai_tools_planned,
    sv.engine_framework,
    sv.partner_name,
    sv.portfolio_link,
    r.status AS registration_status,
    COALESCE(p.status, 'unpaid'::character varying) AS payment_status,
    p.amount AS fee_paid,
    p.razorpay_payment_id,
    r.created_at
   FROM registrations r
     JOIN registrations_storyverse sv ON r.id = sv.registration_id
     LEFT JOIN payments p ON r.id = p.registration_id;;

CREATE VIEW public."v_tech_roulette_entries" WITH (security_invoker=true) AS  SELECT r.registration_code,
    r.lead_name AS participant_name,
    r.lead_email,
    r.lead_phone,
    r.college,
    tr.track_preference,
    tr.experience_level,
    tr.partner_name,
    tr.partner_email,
    tr.tools_proficient AS tools_skills,
    r.status AS registration_status,
    COALESCE(p.status, 'unpaid'::character varying) AS payment_status,
    p.amount AS fee_paid,
    p.razorpay_payment_id,
    r.created_at
   FROM registrations r
     JOIN registrations_tech_roulette tr ON r.id = tr.registration_id
     LEFT JOIN payments p ON r.id = p.registration_id;;

ALTER TABLE public."events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."payment_audit_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations_bgmi" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations_infinity_trials" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations_research_x" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations_storyverse" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."registrations_tech_roulette" ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_read ON public.events FOR SELECT TO anon, authenticated USING (true);

COMMIT;
