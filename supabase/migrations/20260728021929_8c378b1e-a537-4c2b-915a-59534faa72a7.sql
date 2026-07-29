
CREATE TYPE public.deal_stage AS ENUM ('prospecting','qualification','proposal','negotiation','closed_won','closed_lost');
CREATE TYPE public.activity_type AS ENUM ('call','meeting','email','task','note');

CREATE TABLE public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  phone text,
  address text,
  size text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies TO authenticated;
GRANT ALL ON public.crm_companies TO service_role;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_companies_read" ON public.crm_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_companies_write" ON public.crm_companies FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON public.crm_companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  title text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_contacts_read" ON public.crm_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_contacts_write" ON public.crm_contacts FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  stage public.deal_stage NOT NULL DEFAULT 'prospecting',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  probability integer NOT NULL DEFAULT 10,
  expected_close_date date,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text,
  description text,
  position integer NOT NULL DEFAULT 0,
  closed_at timestamptz,
  lost_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_deals TO authenticated;
GRANT ALL ON public.crm_deals TO service_role;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_deals_read" ON public.crm_deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_deals_write" ON public.crm_deals FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_crm_deals_updated BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage, position);

CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.activity_type NOT NULL,
  subject text NOT NULL,
  body text,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  due_date timestamptz,
  completed_at timestamptz,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_activities_read" ON public.crm_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_activities_write" ON public.crm_activities FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.is_hr_or_admin(auth.uid()) OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_crm_activities_updated BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
