-- ============ LEAVE BALANCES ============
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  casual_total NUMERIC(4,1) NOT NULL DEFAULT 12,
  casual_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  sick_total NUMERIC(4,1) NOT NULL DEFAULT 12,
  sick_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  privilege_total NUMERIC(4,1) NOT NULL DEFAULT 18,
  privilege_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  wfh_total NUMERIC(4,1) NOT NULL DEFAULT 24,
  wfh_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  comp_off_total NUMERIC(4,1) NOT NULL DEFAULT 0,
  comp_off_used NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year)
);
GRANT SELECT, INSERT, UPDATE ON public.leave_balances TO authenticated;
GRANT ALL ON public.leave_balances TO service_role;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_read_scope" ON public.leave_balances FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "lb_hr_manage" ON public.leave_balances FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE POLICY "lb_insert_hr" ON public.leave_balances FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE TRIGGER trg_leave_balances_updated BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SHIFTS ============
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_minutes INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_read_all" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "shifts_hr_manage" ON public.shifts FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
INSERT INTO public.shifts (name, start_time, end_time) VALUES ('Morning','08:00','16:00'),('General','09:00','17:00'),('Evening','14:00','22:00');

CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, effective_from)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_shifts TO authenticated;
GRANT ALL ON public.employee_shifts TO service_role;
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "es_read_scope" ON public.employee_shifts FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "es_hr_manage" ON public.employee_shifts FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ SALARY / PAYROLL ============
CREATE TABLE public.employee_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  ctc NUMERIC(12,2) NOT NULL,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  da NUMERIC(12,2) NOT NULL DEFAULT 0,
  ta NUMERIC(12,2) NOT NULL DEFAULT 0,
  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 200,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross NUMERIC(12,2) GENERATED ALWAYS AS (basic + hra + da + ta + special_allowance) STORED,
  net NUMERIC(12,2) GENERATED ALWAYS AS (basic + hra + da + ta + special_allowance - professional_tax - other_deductions) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, effective_date)
);
GRANT SELECT, INSERT, UPDATE ON public.employee_salaries TO authenticated;
GRANT ALL ON public.employee_salaries TO service_role;
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sal_read_scope" ON public.employee_salaries FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "sal_hr_manage" ON public.employee_salaries FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE TRIGGER trg_employee_salaries_updated BEFORE UPDATE ON public.employee_salaries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','paid')),
  total_employees INT NOT NULL DEFAULT 0,
  total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_net NUMERIC(14,2) NOT NULL DEFAULT 0,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (month, year)
);
GRANT SELECT, INSERT, UPDATE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_read_hr" ON public.payroll_runs FOR SELECT TO authenticated USING (public.is_hr_or_admin(auth.uid()));
CREATE POLICY "pr_hr_manage" ON public.payroll_runs FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

CREATE TABLE public.pay_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  da NUMERIC(12,2) NOT NULL DEFAULT 0,
  ta NUMERIC(12,2) NOT NULL DEFAULT 0,
  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross NUMERIC(12,2) NOT NULL DEFAULT 0,
  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net NUMERIC(12,2) NOT NULL DEFAULT 0,
  working_days INT NOT NULL DEFAULT 26,
  paid_days INT NOT NULL DEFAULT 26,
  lop_days NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);
GRANT SELECT, INSERT ON public.pay_slips TO authenticated;
GRANT ALL ON public.pay_slips TO service_role;
ALTER TABLE public.pay_slips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_read_scope" ON public.pay_slips FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "ps_hr_insert" ON public.pay_slips FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ RECRUITMENT ============
CREATE TYPE public.job_status AS ENUM ('draft','open','closed','on_hold');
CREATE TYPE public.application_status AS ENUM ('applied','shortlisted','interview_scheduled','selected','rejected','on_hold');

CREATE TABLE public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT,
  vacancies INT NOT NULL DEFAULT 1,
  description TEXT,
  requirements TEXT,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  status public.job_status NOT NULL DEFAULT 'open',
  posted_by UUID REFERENCES auth.users(id),
  closing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_openings TO authenticated;
GRANT ALL ON public.job_openings TO service_role;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jo_read_all" ON public.job_openings FOR SELECT TO authenticated USING (true);
CREATE POLICY "jo_hr_manage" ON public.job_openings FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE TRIGGER trg_job_openings_updated BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  cover_letter TEXT,
  status public.application_status NOT NULL DEFAULT 'applied',
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ja_read_hr" ON public.job_applications FOR SELECT TO authenticated USING (public.is_hr_or_admin(auth.uid()));
CREATE POLICY "ja_hr_manage" ON public.job_applications FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE TRIGGER trg_job_applications_updated BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PERFORMANCE ============
CREATE TABLE public.performance_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.performance_cycles TO authenticated;
GRANT ALL ON public.performance_cycles TO service_role;
ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_read_all" ON public.performance_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "pc_hr_manage" ON public.performance_cycles FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

CREATE TABLE public.performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.performance_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weightage NUMERIC(5,2) NOT NULL DEFAULT 100,
  self_rating INT CHECK (self_rating BETWEEN 1 AND 5),
  manager_rating INT CHECK (manager_rating BETWEEN 1 AND 5),
  self_comments TEXT,
  manager_comments TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','reviewed','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.performance_goals TO authenticated;
GRANT ALL ON public.performance_goals TO service_role;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pg_read_scope" ON public.performance_goals FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid()) OR public.employee_manager_of(employee_id, auth.uid())
);
CREATE POLICY "pg_insert_scope" ON public.performance_goals FOR INSERT TO authenticated WITH CHECK (
  public.employee_belongs_to(employee_id, auth.uid()) OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "pg_update_scope" ON public.performance_goals FOR UPDATE TO authenticated USING (
  public.employee_belongs_to(employee_id, auth.uid()) OR public.employee_manager_of(employee_id, auth.uid()) OR public.is_hr_or_admin(auth.uid())
);
CREATE TRIGGER trg_performance_goals_updated BEFORE UPDATE ON public.performance_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ TRAINING ============
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  trainer TEXT,
  category TEXT DEFAULT 'General',
  mode TEXT NOT NULL DEFAULT 'offline' CHECK (mode IN ('online','offline','hybrid')),
  duration_hours INT,
  scheduled_at TIMESTAMPTZ,
  max_seats INT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_courses TO authenticated;
GRANT ALL ON public.training_courses TO service_role;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_read_all" ON public.training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "tc_hr_manage" ON public.training_courses FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

CREATE TABLE public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','completed','cancelled','no_show')),
  completed_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE ON public.training_enrollments TO authenticated;
GRANT ALL ON public.training_enrollments TO service_role;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "te_read_scope" ON public.training_enrollments FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "te_insert_scope" ON public.training_enrollments FOR INSERT TO authenticated WITH CHECK (
  public.employee_belongs_to(employee_id, auth.uid()) OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "te_update_hr" ON public.training_enrollments FOR UPDATE TO authenticated USING (public.is_hr_or_admin(auth.uid()));

-- ============ EXPENSES ============
CREATE TYPE public.expense_status AS ENUM ('draft','submitted','approved','rejected','paid');
CREATE TABLE public.expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.expense_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  manager_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.expense_claims TO authenticated;
GRANT ALL ON public.expense_claims TO service_role;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ecl_read_scope" ON public.expense_claims FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid()) OR public.employee_manager_of(employee_id, auth.uid())
);
CREATE POLICY "ecl_insert_self" ON public.expense_claims FOR INSERT TO authenticated WITH CHECK (public.employee_belongs_to(employee_id, auth.uid()));
CREATE POLICY "ecl_update_scope" ON public.expense_claims FOR UPDATE TO authenticated USING (
  public.employee_belongs_to(employee_id, auth.uid()) OR public.employee_manager_of(employee_id, auth.uid()) OR public.is_hr_or_admin(auth.uid())
);
CREATE TRIGGER trg_expense_claims_updated BEFORE UPDATE ON public.expense_claims FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.expense_claims(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.expense_items TO authenticated;
GRANT ALL ON public.expense_items TO service_role;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ei_read_scope" ON public.expense_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.expense_claims c WHERE c.id = claim_id AND (
    public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(c.employee_id, auth.uid())
  ))
);
CREATE POLICY "ei_insert_scope" ON public.expense_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.expense_claims c WHERE c.id = claim_id AND public.employee_belongs_to(c.employee_id, auth.uid()))
);

-- ============ ASSETS ============
CREATE TYPE public.asset_status AS ENUM ('available','assigned','under_maintenance','retired');
CREATE TABLE public.company_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_value NUMERIC(12,2),
  status public.asset_status NOT NULL DEFAULT 'available',
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_assets TO authenticated;
GRANT ALL ON public.company_assets TO service_role;
ALTER TABLE public.company_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ca_read_scope" ON public.company_assets FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR (assigned_to IS NOT NULL AND public.employee_belongs_to(assigned_to, auth.uid()))
);
CREATE POLICY "ca_hr_manage" ON public.company_assets FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE TRIGGER trg_company_assets_updated BEFORE UPDATE ON public.company_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ DOCUMENTS ============
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.employee_documents TO authenticated;
GRANT ALL ON public.employee_documents TO service_role;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edoc_read_scope" ON public.employee_documents FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "edoc_hr_manage" ON public.employee_documents FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ EXIT MANAGEMENT ============
CREATE TYPE public.exit_status AS ENUM ('pending','accepted','clearance_in_progress','completed','revoked');
CREATE TABLE public.exit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  resignation_date DATE NOT NULL,
  last_working_date DATE,
  reason TEXT,
  status public.exit_status NOT NULL DEFAULT 'pending',
  hr_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.exit_requests TO authenticated;
GRANT ALL ON public.exit_requests TO service_role;
ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ex_read_scope" ON public.exit_requests FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "ex_insert_self" ON public.exit_requests FOR INSERT TO authenticated WITH CHECK (public.employee_belongs_to(employee_id, auth.uid()));
CREATE POLICY "ex_update_scope" ON public.exit_requests FOR UPDATE TO authenticated USING (
  public.is_hr_or_admin(auth.uid()) OR public.employee_belongs_to(employee_id, auth.uid())
);
CREATE TRIGGER trg_exit_requests_updated BEFORE UPDATE ON public.exit_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_any" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);