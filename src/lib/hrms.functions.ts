import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Current user's profile, role list, and employee record (if any). */
export const getCurrentContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, rolesRes, employeeRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("employees").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      userId,
      profile: profileRes.data,
      roles: (rolesRes.data ?? []).map((r) => r.role as string),
      employee: employeeRes.data,
    };
  });

/** Dashboard aggregates the signed-in user is allowed to see. */
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [empCountRes, deptCountRes, myEmpRes, holidaysRes, annRes] = await Promise.all([
      supabase.from("employees").select("id", { count: "exact", head: true }),
      supabase.from("departments").select("id", { count: "exact", head: true }),
      supabase.from("employees").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("holidays").select("*").gte("date", today).order("date").limit(5),
      supabase.from("announcements").select("*").order("published_at", { ascending: false }).limit(5),
    ]);

    let todayAttendance = null;
    let leaveCount = 0;
    let pendingApprovals = 0;
    if (myEmpRes.data?.id) {
      const [attRes, leaveRes] = await Promise.all([
        supabase
          .from("attendance")
          .select("*")
          .eq("employee_id", myEmpRes.data.id)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("employee_id", myEmpRes.data.id),
      ]);
      todayAttendance = attRes.data;
      leaveCount = leaveRes.count ?? 0;
    }

    const pendingRes = await supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_manager", "pending_hr"]);
    pendingApprovals = pendingRes.count ?? 0;

    return {
      totalEmployees: empCountRes.count ?? 0,
      totalDepartments: deptCountRes.count ?? 0,
      pendingApprovals,
      leaveCount,
      todayAttendance,
      upcomingHolidays: holidaysRes.data ?? [],
      announcements: annRes.data ?? [],
    };
  });

/** Check in for today. Idempotent — will not overwrite existing check_in. */
export const checkIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const emp = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
    if (!emp.data) throw new Error("No employee record linked to your account.");
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", emp.data.id)
      .eq("date", today)
      .maybeSingle();
    if (existing) {
      if (existing.check_in) return existing;
      const { data, error } = await supabase
        .from("attendance")
        .update({ check_in: now })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from("attendance")
      .insert({ employee_id: emp.data.id, date: today, check_in: now })
      .select()
      .single();
    if (error) throw error;
    return data;
  });

export const checkOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const emp = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
    if (!emp.data) throw new Error("No employee record linked to your account.");
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("employee_id", emp.data.id)
      .eq("date", today)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Please check in first.");
    return data;
  });

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employees")
      .select("*, department:departments(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("departments").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      employee_code: string;
      full_name: string;
      email: string;
      phone?: string;
      designation?: string;
      department_id?: string | null;
      date_of_joining?: string | null;
      employment_type?: string;
    }) => i,
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("employees")
      .insert({
        employee_code: data.employee_code,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ?? null,
        designation: data.designation ?? null,
        department_id: data.department_id ?? null,
        date_of_joining: data.date_of_joining ?? null,
        employment_type: (data.employment_type as never) ?? "full_time",
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const listMyAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const emp = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", emp.data.id)
      .order("date", { ascending: false })
      .limit(60);
    if (error) throw error;
    return data ?? [];
  });

export const listLeaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leave_requests")
      .select("*, employee:employees(full_name, employee_code)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const applyLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      leave_type: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }) => i,
  )
  .handler(async ({ context, data }) => {
    const emp = await context.supabase
      .from("employees")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!emp.data) throw new Error("No employee record linked to your account.");
    const days =
      (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    const { data: row, error } = await context.supabase
      .from("leave_requests")
      .insert({
        employee_id: emp.data.id,
        leave_type: data.leave_type as never,
        start_date: data.start_date,
        end_date: data.end_date,
        days: Math.max(days, 0.5),
        reason: data.reason ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const decideLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; action: "approve" | "reject"; note?: string }) => i)
  .handler(async ({ context, data }) => {
    // Fetch leave to know current status
    const { data: leave, error: readErr } = await context.supabase
      .from("leave_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (readErr) throw readErr;
    const { data: isHr } = await context.supabase.rpc("is_hr_or_admin", {
      _user_id: context.userId,
    });
    let nextStatus: string = leave.status;
    const patch: Record<string, unknown> = {};
    if (data.action === "reject") {
      nextStatus = "rejected";
      patch[isHr ? "hr_note" : "manager_note"] = data.note ?? null;
    } else if (leave.status === "pending_manager") {
      nextStatus = "pending_hr";
      patch.manager_note = data.note ?? null;
    } else if (leave.status === "pending_hr") {
      if (!isHr) throw new Error("Only HR can give final approval.");
      nextStatus = "approved";
      patch.hr_note = data.note ?? null;
    }
    const { data: updated, error } = await context.supabase
      .from("leave_requests")
      .update({ ...patch, status: nextStatus as never })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  });

export const listHolidays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("holidays").select("*").order("date");
    if (error) throw error;
    return data ?? [];
  });

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("announcements")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ─── NOTIFICATIONS ──────────────────────────────
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30);
    return data ?? [];
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("notifications").update({ is_read: true }).eq("user_id", context.userId).eq("is_read", false);
  });

// ─── LEAVE BALANCES ─────────────────────────────
export const getMyLeaveBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const year = new Date().getFullYear();
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return null;
    const { data } = await context.supabase.from("leave_balances").select("*").eq("employee_id", emp.data.id).eq("year", year).maybeSingle();
    return data;
  });

export const listLeaveBalances = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const year = new Date().getFullYear();
    const { data, error } = await context.supabase.from("leave_balances").select("*, employee:employees(full_name, employee_code, department:departments(name))").eq("year", year).order("created_at");
    if (error) throw error;
    return data ?? [];
  });

export const upsertLeaveBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { employee_id: string; year: number; casual_total?: number; sick_total?: number; privilege_total?: number; wfh_total?: number; comp_off_total?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("leave_balances").upsert(data, { onConflict: "employee_id,year" }).select().single();
    if (error) throw error;
    return row;
  });

// ─── SHIFTS ─────────────────────────────────────
export const listShifts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("shifts").select("*").order("start_time");
    if (error) throw error;
    return data ?? [];
  });

export const createShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { name: string; start_time: string; end_time: string; grace_minutes?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("shifts").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const listEmployeeShifts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("employee_shifts").select("*, employee:employees(full_name, employee_code), shift:shifts(name, start_time, end_time)").order("effective_from", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const assignShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { employee_id: string; shift_id: string; effective_from: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("employee_shifts").upsert(data, { onConflict: "employee_id,effective_from" }).select().single();
    if (error) throw error;
    return row;
  });

// ─── PAYROLL ─────────────────────────────────────
export const listEmployeeSalaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("employee_salaries").select("*, employee:employees(full_name, employee_code, department:departments(name))").order("effective_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getMyLatestSalary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return null;
    const { data } = await context.supabase.from("employee_salaries").select("*").eq("employee_id", emp.data.id).order("effective_date", { ascending: false }).limit(1).maybeSingle();
    return data;
  });

export const upsertEmployeeSalary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { employee_id: string; effective_date: string; ctc: number; basic: number; hra: number; da: number; ta: number; special_allowance: number; professional_tax: number; other_deductions?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("employee_salaries").upsert(data, { onConflict: "employee_id,effective_date" }).select().single();
    if (error) throw error;
    return row;
  });

export const listPayrollRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("payroll_runs").select("*").order("year", { ascending: false }).order("month", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const runPayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { month: number; year: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: employees } = await context.supabase.from("employees").select("id").eq("status", "active");
    if (!employees || employees.length === 0) throw new Error("No active employees found.");
    const { data: run, error: runError } = await context.supabase.from("payroll_runs").insert({ month: data.month, year: data.year, status: "processing", total_employees: employees.length }).select().single();
    if (runError) throw runError;
    let totalGross = 0, totalNet = 0;
    const payslips: Record<string, unknown>[] = [];
    for (const emp of employees) {
      const { data: sal } = await context.supabase.from("employee_salaries").select("*").eq("employee_id", emp.id).order("effective_date", { ascending: false }).limit(1).maybeSingle();
      if (sal) {
        payslips.push({ payroll_run_id: run.id, employee_id: emp.id, month: data.month, year: data.year, basic: sal.basic, hra: sal.hra, da: sal.da, ta: sal.ta, special_allowance: sal.special_allowance, gross: sal.gross, professional_tax: sal.professional_tax, other_deductions: sal.other_deductions, net: sal.net, working_days: 26, paid_days: 26, lop_days: 0 });
        totalGross += Number(sal.gross);
        totalNet += Number(sal.net);
      }
    }
    if (payslips.length > 0) await context.supabase.from("pay_slips").insert(payslips as never);
    const { data: updated, error } = await context.supabase.from("payroll_runs").update({ status: "completed", total_gross: totalGross, total_net: totalNet, processed_by: context.userId, processed_at: new Date().toISOString() }).eq("id", run.id).select().single();
    if (error) throw error;
    return updated;
  });

export const listMyPaySlips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("pay_slips").select("*, payroll_run:payroll_runs(month, year, status)").eq("employee_id", emp.data.id).order("year", { ascending: false }).order("month", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllPaySlips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("pay_slips").select("*, employee:employees(full_name, employee_code, designation, department:departments(name)), payroll_run:payroll_runs(month, year, status)").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data ?? [];
  });

// ─── RECRUITMENT ─────────────────────────────────
export const listJobOpenings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("job_openings").select("*, department:departments(name)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createJobOpening = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { title: string; department_id?: string | null; designation?: string; vacancies?: number; description?: string; requirements?: string; employment_type?: string; closing_date?: string | null }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("job_openings").insert({ ...data, posted_by: context.userId } as never).select().single();
    if (error) throw error;
    return row;
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("job_openings").update({ status: data.status as never }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("job_applications").select("*, job:job_openings(title, department:departments(name))").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { job_id: string; applicant_name: string; applicant_email: string; applicant_phone?: string; cover_letter?: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("job_applications").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string; interview_date?: string | null; notes?: string }) => i)
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase.from("job_applications").update(patch as never).eq("id", id).select().single();
    if (error) throw error;
    return row;
  });

// ─── PERFORMANCE ─────────────────────────────────
export const listPerformanceCycles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("performance_cycles").select("*").order("start_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createPerformanceCycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { name: string; start_date: string; end_date: string; is_active?: boolean }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("performance_cycles").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const listMyGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("performance_goals").select("*, cycle:performance_cycles(name, start_date, end_date)").eq("employee_id", emp.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("performance_goals").select("*, employee:employees(full_name, employee_code, department:departments(name)), cycle:performance_cycles(name)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cycle_id: string; employee_id: string; title: string; description?: string; weightage?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("performance_goals").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const rateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; self_rating?: number; self_comments?: string; manager_rating?: number; manager_comments?: string; status?: string }) => i)
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase.from("performance_goals").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return row;
  });

// ─── TRAINING ────────────────────────────────────
export const listTrainingCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("training_courses").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createTrainingCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { title: string; description?: string; trainer?: string; category?: string; mode?: string; duration_hours?: number; scheduled_at?: string; max_seats?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("training_courses").insert({ ...data, created_by: context.userId } as never).select().single();
    if (error) throw error;
    return row;
  });

export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("training_enrollments").select("*, course:training_courses(*)").eq("employee_id", emp.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const enrollInCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { course_id: string; employee_id?: string }) => i)
  .handler(async ({ context, data }) => {
    let empId = data.employee_id;
    if (!empId) {
      const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
      if (!emp.data) throw new Error("No employee record found.");
      empId = emp.data.id;
    }
    const { data: row, error } = await context.supabase.from("training_enrollments").insert({ course_id: data.course_id, employee_id: empId }).select().single();
    if (error) throw error;
    return row;
  });

// ─── EXPENSES ────────────────────────────────────
export const listMyExpenseClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("expense_claims").select("*, items:expense_items(*)").eq("employee_id", emp.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllExpenseClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("expense_claims").select("*, employee:employees(full_name, employee_code), items:expense_items(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { title: string; category?: string; items: Array<{ date: string; description: string; category: string; amount: number }> }) => i)
  .handler(async ({ context, data }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) throw new Error("No employee record.");
    const total = data.items.reduce((s, i) => s + Number(i.amount), 0);
    const { data: claim, error } = await context.supabase.from("expense_claims").insert({ employee_id: emp.data.id, title: data.title, category: data.category ?? "General", total_amount: total, submitted_at: new Date().toISOString(), status: "submitted" }).select().single();
    if (error) throw error;
    if (data.items.length > 0) await context.supabase.from("expense_items").insert(data.items.map((i) => ({ ...i, claim_id: claim.id })));
    return claim;
  });

export const decideExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; action: "approve" | "reject"; manager_note?: string }) => i)
  .handler(async ({ context, data }) => {
    const status = data.action === "approve" ? "approved" : "rejected";
    const { data: row, error } = await context.supabase.from("expense_claims").update({ status: status as never, approved_by: context.userId, approved_at: new Date().toISOString(), manager_note: data.manager_note ?? null }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

// ─── ASSETS ──────────────────────────────────────
export const listAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("company_assets").select("*, assigned_employee:employees(full_name, employee_code)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { asset_code: string; name: string; category: string; brand?: string; model?: string; serial_number?: string; purchase_date?: string; purchase_value?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("company_assets").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const assignAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; employee_id: string | null }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("company_assets").update({ assigned_to: data.employee_id, assigned_at: data.employee_id ? new Date().toISOString().slice(0, 10) : null, status: (data.employee_id ? "assigned" : "available") as never }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

// ─── DOCUMENTS ───────────────────────────────────
export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("employee_documents").select("*").eq("employee_id", emp.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("employee_documents").select("*, employee:employees(full_name, employee_code)").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ─── EXIT MANAGEMENT ─────────────────────────────
export const listExitRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("exit_requests").select("*, employee:employees(full_name, employee_code, designation, department:departments(name))").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const submitResignation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { resignation_date: string; last_working_date?: string; reason?: string }) => i)
  .handler(async ({ context, data }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) throw new Error("No employee record.");
    const { data: row, error } = await context.supabase.from("exit_requests").insert({ employee_id: emp.data.id, ...data }).select().single();
    if (error) throw error;
    return row;
  });

export const updateExitStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string; hr_note?: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("exit_requests").update({ status: data.status as never, hr_note: data.hr_note ?? null }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

// ─── ANALYTICS / REPORTS ─────────────────────────
export const getAnalyticsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const [empRes, deptRes, leaveRes, jobRes, payrollRes] = await Promise.all([
      supabase.from("employees").select("id, status, department_id, employment_type, date_of_joining"),
      supabase.from("departments").select("id, name"),
      supabase.from("leave_requests").select("status, leave_type, days").gte("start_date", thisMonthStart),
      supabase.from("job_openings").select("id, status"),
      supabase.from("payroll_runs").select("id, month, year, total_gross, total_net, status").order("year", { ascending: false }).order("month", { ascending: false }).limit(6),
    ]);
    const employees = empRes.data ?? [];
    const departments = deptRes.data ?? [];
    const leaves = leaveRes.data ?? [];
    const deptCounts = departments.map((d) => ({ name: d.name, count: employees.filter((e) => e.department_id === d.id).length }));
    const empByType = [
      { type: "Full Time", count: employees.filter((e) => e.employment_type === "full_time").length },
      { type: "Part Time", count: employees.filter((e) => e.employment_type === "part_time").length },
      { type: "Contract", count: employees.filter((e) => e.employment_type === "contract").length },
      { type: "Intern", count: employees.filter((e) => e.employment_type === "intern").length },
    ];
    const leaveByType = ["casual", "sick", "privilege", "wfh", "on_duty", "half_day", "comp_off"].map((t) => ({
      type: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
      count: leaves.filter((l) => l.leave_type === t).length,
      days: leaves.filter((l) => l.leave_type === t).reduce((s, l) => s + Number(l.days), 0),
    })).filter((x) => x.count > 0);
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "active").length,
      totalDepartments: departments.length,
      openJobs: (jobRes.data ?? []).filter((j) => j.status === "open").length,
      pendingLeaves: leaves.filter((l) => l.status === "pending_manager" || l.status === "pending_hr").length,
      deptCounts,
      empByType,
      leaveByType,
      payrollTrend: (payrollRes.data ?? []).reverse().map((r) => ({ label: `${String(r.month).padStart(2,"0")}/${r.year}`, gross: Number(r.total_gross), net: Number(r.total_net) })),
    };
  });

// ─── DEPARTMENTS CRUD ─────────────────────────────
export const createDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { name: string; description?: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("departments").insert(data).select().single();
    if (error) throw error;
    return row;
  });

export const updateDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; name: string; description?: string }) => i)
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase.from("departments").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return row;
  });

export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("departments").delete().eq("id", data.id);
    if (error) throw error;
  });

// ─── EMPLOYEE PROFILE UPDATE ──────────────────────
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { full_name?: string; phone?: string; emergency_contact_name?: string; emergency_contact_phone?: string; bank_name?: string; bank_account?: string; bank_ifsc?: string; pan?: string; aadhaar?: string }) => i)
  .handler(async ({ context, data }) => {
    const { full_name, phone, ...empFields } = data;
    if (full_name || phone) {
      await context.supabase.from("profiles").update({ full_name, phone }).eq("id", context.userId);
    }
    const hasEmpFields = Object.keys(empFields).length > 0;
    if (hasEmpFields) {
      await context.supabase.from("employees").update(empFields).eq("user_id", context.userId);
    }
  });

export const getEmployeeById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ context, data }) => {
    const { data: emp, error } = await context.supabase.from("employees").select("*, department:departments(name), manager:employees!reporting_manager_id(full_name, designation)").eq("id", data.id).single();
    if (error) throw error;
    return emp;
  });

// ─── TRAVEL MANAGEMENT ──────────────────────────
export const listMyTravelRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) return [];
    const { data, error } = await context.supabase.from("travel_requests").select("*").eq("employee_id", emp.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllTravelRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("travel_requests").select("*, employee:employees(full_name, employee_code, department:departments(name))").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createTravelRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { purpose: string; destination: string; departure_date: string; return_date: string; travel_mode: string; accommodation_required?: boolean; estimated_budget?: number }) => i)
  .handler(async ({ context, data }) => {
    const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
    if (!emp.data) throw new Error("No employee record.");
    const { data: row, error } = await context.supabase.from("travel_requests").insert({ employee_id: emp.data.id, ...data }).select().single();
    if (error) throw error;
    return row;
  });

export const updateTravelRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string; note?: string }) => i)
  .handler(async ({ context, data }) => {
    const patch: Record<string, unknown> = { status: data.status, hr_note: data.note ?? null };
    if (data.status === "approved" || data.status === "rejected") { patch.approved_by = context.userId; patch.approved_at = new Date().toISOString(); }
    const { data: row, error } = await context.supabase.from("travel_requests").update(patch as never).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

export const listTravelTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { travel_request_id?: string }) => i)
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("travel_tickets").select("*, employee:employees(full_name, employee_code)").order("travel_date", { ascending: false });
    if (data.travel_request_id) q = q.eq("travel_request_id", data.travel_request_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const addTravelTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { travel_request_id: string; ticket_type: string; from_location: string; to_location: string; travel_date: string; carrier_name?: string; ticket_number?: string; seat_class?: string; amount?: number; ticket_url?: string }) => i)
  .handler(async ({ context, data }) => {
    const tr = await context.supabase.from("travel_requests").select("employee_id").eq("id", data.travel_request_id).single();
    if (tr.error) throw tr.error;
    const { data: row, error } = await context.supabase.from("travel_tickets").insert({ ...data, employee_id: tr.data.employee_id }).select().single();
    if (error) throw error;
    return row;
  });

export const listTravelExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { travel_request_id?: string }) => i)
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("travel_expenses").select("*, employee:employees(full_name, employee_code)").order("expense_date", { ascending: false });
    if (data.travel_request_id) q = q.eq("travel_request_id", data.travel_request_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const addTravelExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { travel_request_id: string; category: string; description: string; amount: number; expense_date: string; receipt_url?: string }) => i)
  .handler(async ({ context, data }) => {
    const tr = await context.supabase.from("travel_requests").select("employee_id").eq("id", data.travel_request_id).single();
    if (tr.error) throw tr.error;
    const { data: row, error } = await context.supabase.from("travel_expenses").insert({ ...data, employee_id: tr.data.employee_id }).select().single();
    if (error) throw error;
    return row;
  });

export const updateTravelExpenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: string; approved_amount?: number }) => i)
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("travel_expenses").update({ status: data.status, approved_amount: data.approved_amount ?? null }).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

// ─── DOCUMENT VERIFICATION ──────────────────────
export const uploadEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { employee_id?: string; category: string; name: string; file_url: string; issued_date?: string; expiry_date?: string }) => i)
  .handler(async ({ context, data }) => {
    let empId = data.employee_id;
    if (!empId) {
      const emp = await context.supabase.from("employees").select("id").eq("user_id", context.userId).maybeSingle();
      if (!emp.data) throw new Error("No employee record.");
      empId = emp.data.id;
    }
    const { data: row, error } = await context.supabase.from("employee_documents").insert({ employee_id: empId, category: data.category, name: data.name, file_url: data.file_url, uploaded_by: context.userId, ...(data.issued_date ? { issued_date: data.issued_date } : {}), ...(data.expiry_date ? { expiry_date: data.expiry_date } : {}) } as never).select().single();
    if (error) throw error;
    return row;
  });

export const verifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; status: "verified" | "rejected"; rejection_reason?: string }) => i)
  .handler(async ({ context, data }) => {
    const patch = { verification_status: data.status, verified_by: context.userId, verified_at: new Date().toISOString(), rejection_reason: data.rejection_reason ?? null } as never;
    const { data: row, error } = await context.supabase.from("employee_documents").update(patch).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

// ─── AI HR ASSISTANT ────────────────────────────
export const getChatbotContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();
    const { supabase, userId } = context;
    const emp = await supabase.from("employees").select("*, department:departments(name)").eq("user_id", userId).maybeSingle();
    if (!emp.data) return { hasEmployee: false };
    const empId = emp.data.id;
    const [mgr, tl, bal, slips, att, hol, ann, upcoming, pending] = await Promise.all([
      emp.data.reporting_manager_id ? supabase.from("employees").select("full_name").eq("id", emp.data.reporting_manager_id).maybeSingle() : Promise.resolve({ data: null }),
      Promise.resolve({ data: null }),
      supabase.from("leave_balances").select("*").eq("employee_id", empId).eq("year", year).maybeSingle(),
      supabase.from("pay_slips").select("month, year, net, gross").eq("employee_id", empId).order("year", { ascending: false }).order("month", { ascending: false }).limit(3),
      supabase.from("attendance").select("check_in, check_out").eq("employee_id", empId).eq("date", today).maybeSingle(),
      supabase.from("holidays").select("name, date").gte("date", today).order("date").limit(3),
      supabase.from("announcements").select("title, published_at").order("published_at", { ascending: false }).limit(2),
      supabase.from("leave_requests").select("leave_type, start_date, end_date").eq("employee_id", empId).eq("status", "approved").gte("start_date", today).limit(3),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("employee_id", empId).in("status", ["pending_manager", "pending_hr"]),
    ]);
    return {
      hasEmployee: true,
      employee: { name: (emp.data as { full_name: string }).full_name, code: (emp.data as { employee_code: string }).employee_code, dept: (emp.data as { department?: { name: string } }).department?.name ?? "—", designation: (emp.data as { designation?: string }).designation, joined: (emp.data as { date_of_joining?: string }).date_of_joining, manager: (mgr.data as { full_name?: string } | null)?.full_name ?? "—", tl: "—" },
      balance: bal.data,
      payslips: slips.data ?? [],
      todayAttendance: att.data,
      holidays: hol.data ?? [],
      announcements: ann.data ?? [],
      upcomingLeaves: upcoming.data ?? [],
      pendingCount: pending.count ?? 0,
    };
  });

export const chatWithHRAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { messages: Array<{ role: "user" | "assistant"; content: string }>; systemPrompt: string }) => i)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI not configured.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "system", content: data.systemPrompt }, ...data.messages],
        max_tokens: 600,
      }),
    });
    if (res.status === 429) throw new Error("Too many requests — please slow down.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
    if (!res.ok) throw new Error(`AI error (${res.status})`);
    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });
