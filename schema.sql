-- Create the registrants table
CREATE TABLE IF NOT EXISTS registrants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_surname TEXT NOT NULL,
  birth_date TEXT NOT NULL,          -- Stored as string to handle different formats or simple date text
  tc_no VARCHAR(11) NOT NULL UNIQUE, -- 11 digit TC ID, must be unique to prevent double signups
  profession TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so users can register from the frontend)
CREATE POLICY "Allow public insert access" ON registrants
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow select/read access only to authenticated users (admin role or via admin panel authentication)
-- Since we are building a simple password-protected route, we can read via service role client,
-- or we can create a policy. Let's create a policy that allows reading if using service_role,
-- or just allow select to anon if they provide a specific header or keep it read-protected.
-- Note: Service role automatically bypasses RLS.
-- If the admin panel uses client-side Supabase client with anon key, we can allow select only with a secret header or password.
-- To keep things simple and highly secure:
-- 1. All inserts are allowed by anyone (anon).
-- 2. Selects are NOT allowed by default for anon. The admin panel will call a Next.js Server Action / Route Handler
--    which uses the admin password validation on the server side and fetches data using a service role client or direct query,
--    ensuring participant data is NEVER exposed to the public internet!

-- NOTE: the `registrants.role` column and the `sponsors` table were added after this
-- file was first written. Incremental schema changes live in ./migrations/*.sql — see
-- 2026-06-19_sponsor_badge_flag.sql for the badge (lanyard) sponsor flag.
