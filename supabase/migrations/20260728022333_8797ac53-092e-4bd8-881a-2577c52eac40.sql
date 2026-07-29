DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','unqualified','converted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  company_name text,
  title text,
  source text,
  status public.lead_status NOT NULL DEFAULT 'new',
  rating integer NOT NULL DEFAULT 3,
  notes text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_read" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_leads_write" ON public.crm_leads FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER trg_crm_leads_updated BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_crm_leads_status ON public.crm_leads(status);