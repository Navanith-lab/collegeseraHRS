
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','hr_admin','manager','employee');
CREATE TYPE public.leave_type AS ENUM ('casual','sick','privilege','wfh','on_duty','half_day','comp_off');
CREATE TYPE public.leave_status AS ENUM ('pending_manager','pending_hr','approved','rejected','cancelled');
CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','intern');
CREATE TYPE public.employee_status AS ENUM ('active','inactive','on_leave','terminated');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','hr_admin'));
$$;

-- Allow HR/admin to see all roles too
CREATE POLICY "user_roles_select_hr" ON public.user_roles FOR SELECT TO authenticated USING (public.is_hr_or_admin(auth.uid()));

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DEPARTMENTS ============
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept_read_all" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "dept_hr_manage" ON public.departments FOR ALL TO authenticated USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT,
  reporting_manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  date_of_joining DATE,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  pan TEXT,
  aadhaar TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  status public.employee_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emp_read_all" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "emp_hr_manage" ON public.employees FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid()))
  WITH CHECK (public.is_hr_or_admin(auth.uid()));
CREATE POLICY "emp_update_self" ON public.employees FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX ON public.employees(department_id);
CREATE INDEX ON public.employees(reporting_manager_id);
CREATE INDEX ON public.employees(user_id);

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT,
  regularization_reason TEXT,
  regularization_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.employee_belongs_to(_employee_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.employees WHERE id = _employee_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.employee_manager_of(_employee_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.employees mgr ON mgr.id = e.reporting_manager_id
    WHERE e.id = _employee_id AND mgr.user_id = _user_id
  );
$$;

CREATE POLICY "att_read_scope" ON public.attendance FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid())
  OR public.employee_belongs_to(employee_id, auth.uid())
  OR public.employee_manager_of(employee_id, auth.uid())
);
CREATE POLICY "att_insert_self" ON public.attendance FOR INSERT TO authenticated WITH CHECK (
  public.employee_belongs_to(employee_id, auth.uid()) OR public.is_hr_or_admin(auth.uid())
);
CREATE POLICY "att_update_scope" ON public.attendance FOR UPDATE TO authenticated USING (
  public.employee_belongs_to(employee_id, auth.uid())
  OR public.employee_manager_of(employee_id, auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);

-- ============ LEAVES ============
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4,1) NOT NULL DEFAULT 1,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending_manager',
  manager_note TEXT,
  hr_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_read_scope" ON public.leave_requests FOR SELECT TO authenticated USING (
  public.is_hr_or_admin(auth.uid())
  OR public.employee_belongs_to(employee_id, auth.uid())
  OR public.employee_manager_of(employee_id, auth.uid())
);
CREATE POLICY "leave_insert_self" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (
  public.employee_belongs_to(employee_id, auth.uid())
);
CREATE POLICY "leave_update_scope" ON public.leave_requests FOR UPDATE TO authenticated USING (
  public.employee_belongs_to(employee_id, auth.uid())
  OR public.employee_manager_of(employee_id, auth.uid())
  OR public.is_hr_or_admin(auth.uid())
);

-- ============ HOLIDAYS ============
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holidays_read_all" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "holidays_hr_manage" ON public.holidays FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read_all" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_hr_manage" ON public.announcements FOR ALL TO authenticated
  USING (public.is_hr_or_admin(auth.uid())) WITH CHECK (public.is_hr_or_admin(auth.uid()));

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_leaves_updated BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED ============
INSERT INTO public.departments (name, description) VALUES
  ('Academics','Faculty and teaching staff'),
  ('Administration','Admin and operations'),
  ('Human Resources','HR team'),
  ('Finance','Accounts and finance'),
  ('IT','Technology and support');

INSERT INTO public.holidays (name, date, description) VALUES
  ('Republic Day','2026-01-26','National holiday'),
  ('Holi','2026-03-04','Festival of colors'),
  ('Independence Day','2026-08-15','National holiday'),
  ('Gandhi Jayanti','2026-10-02','National holiday'),
  ('Diwali','2026-11-08','Festival of lights');
