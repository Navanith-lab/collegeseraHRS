
CREATE TABLE IF NOT EXISTS public.travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  travel_mode TEXT NOT NULL DEFAULT 'flight',
  accommodation_required BOOLEAN DEFAULT false,
  advance_amount NUMERIC(12,2) DEFAULT 0,
  estimated_budget NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  manager_note TEXT, hr_note TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.travel_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL DEFAULT 'flight',
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  travel_date DATE NOT NULL,
  ticket_number TEXT, carrier_name TEXT,
  seat_class TEXT DEFAULT 'economy',
  amount NUMERIC(12,2) DEFAULT 0,
  booking_reference TEXT, ticket_url TEXT,
  booked_by TEXT DEFAULT 'self',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.travel_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.travel_requests TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.travel_tickets TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.travel_expenses TO authenticated;
GRANT ALL ON public.travel_requests TO service_role;
GRANT ALL ON public.travel_tickets TO service_role;
GRANT ALL ON public.travel_expenses TO service_role;
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_scope" ON public.travel_requests;
CREATE POLICY "tr_scope" ON public.travel_requests FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()) OR public.employee_manager_of(employee_id,auth.uid()))
  WITH CHECK (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()));
DROP POLICY IF EXISTS "tt_scope" ON public.travel_tickets;
CREATE POLICY "tt_scope" ON public.travel_tickets FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()) OR public.employee_manager_of(employee_id,auth.uid()))
  WITH CHECK (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()));
DROP POLICY IF EXISTS "te_scope" ON public.travel_expenses;
CREATE POLICY "te_scope" ON public.travel_expenses FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()) OR public.employee_manager_of(employee_id,auth.uid()))
  WITH CHECK (public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id,auth.uid()));
DROP TRIGGER IF EXISTS trg_tr_upd ON public.travel_requests;
CREATE TRIGGER trg_tr_upd BEFORE UPDATE ON public.travel_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS issued_date DATE;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
