-- Contact messages submitted from the public "İletişim" form on the homepage.
-- The admin panel (/admin/contact) lists, marks-as-read and deletes these.
-- Reads/writes go through the server (service_role), which bypasses RLS — so we
-- enable RLS with no public policies to keep visitor messages private.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name  text NOT NULL,
  phone      text NOT NULL,
  subject    text NOT NULL DEFAULT 'Genel Bilgi ve Diğer',
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Newest-first listing in the admin panel.
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
