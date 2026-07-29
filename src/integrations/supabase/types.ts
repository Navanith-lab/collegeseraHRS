export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          published_at: string
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          regularization_reason: string | null
          regularization_status: string | null
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          regularization_reason?: string | null
          regularization_status?: string | null
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          regularization_reason?: string | null
          regularization_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_assets: {
        Row: {
          asset_code: string
          assigned_at: string | null
          assigned_to: string | null
          brand: string | null
          category: string
          created_at: string
          id: string
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          asset_code: string
          assigned_at?: string | null
          assigned_to?: string | null
          brand?: string | null
          category: string
          created_at?: string
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          asset_code?: string
          assigned_at?: string | null
          assigned_to?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          body: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          owner_id: string | null
          phone: string | null
          size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          amount: number
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          currency: string
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          owner_id: string | null
          position: number
          probability: number
          source: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          owner_id?: string | null
          position?: number
          probability?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company_name: string | null
          converted_at: string | null
          converted_deal_id: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          rating: number
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          converted_at?: string | null
          converted_deal_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          converted_at?: string | null
          converted_deal_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_converted_deal_id_fkey"
            columns: ["converted_deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          category: string
          created_at: string
          employee_id: string
          expiry_date: string | null
          file_url: string
          id: string
          issued_date: string | null
          name: string
          rejection_reason: string | null
          uploaded_by: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          file_url: string
          id?: string
          issued_date?: string | null
          name: string
          rejection_reason?: string | null
          uploaded_by?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          issued_date?: string | null
          name?: string
          rejection_reason?: string | null
          uploaded_by?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salaries: {
        Row: {
          basic: number
          created_at: string
          ctc: number
          da: number
          effective_date: string
          employee_id: string
          gross: number | null
          hra: number
          id: string
          net: number | null
          other_deductions: number
          professional_tax: number
          special_allowance: number
          ta: number
          updated_at: string
        }
        Insert: {
          basic?: number
          created_at?: string
          ctc: number
          da?: number
          effective_date: string
          employee_id: string
          gross?: number | null
          hra?: number
          id?: string
          net?: number | null
          other_deductions?: number
          professional_tax?: number
          special_allowance?: number
          ta?: number
          updated_at?: string
        }
        Update: {
          basic?: number
          created_at?: string
          ctc?: number
          da?: number
          effective_date?: string
          employee_id?: string
          gross?: number | null
          hra?: number
          id?: string
          net?: number | null
          other_deductions?: number
          professional_tax?: number
          special_allowance?: number
          ta?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          created_at: string
          effective_from: string
          employee_id: string
          id: string
          shift_id: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          employee_id: string
          id?: string
          shift_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          employee_id?: string
          id?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhaar: string | null
          avatar_url: string | null
          bank_account: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string
          date_of_joining: string | null
          department_id: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_code: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id: string
          pan: string | null
          phone: string | null
          reporting_manager_id: string | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aadhaar?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id?: string
          pan?: string | null
          phone?: string | null
          reporting_manager_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aadhaar?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name?: string
          id?: string
          pan?: string | null
          phone?: string | null
          reporting_manager_id?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_requests: {
        Row: {
          created_at: string
          employee_id: string
          hr_note: string | null
          id: string
          last_working_date: string | null
          reason: string | null
          resignation_date: string
          status: Database["public"]["Enums"]["exit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          hr_note?: string | null
          id?: string
          last_working_date?: string | null
          reason?: string | null
          resignation_date: string
          status?: Database["public"]["Enums"]["exit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          hr_note?: string | null
          id?: string
          last_working_date?: string | null
          reason?: string | null
          resignation_date?: string
          status?: Database["public"]["Enums"]["exit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          employee_id: string
          id: string
          manager_note: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_at: string | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          employee_id: string
          id?: string
          manager_note?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          title: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          employee_id?: string
          id?: string
          manager_note?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          amount: number
          category: string
          claim_id: string
          created_at: string
          date: string
          description: string
          id: string
        }
        Insert: {
          amount: number
          category: string
          claim_id: string
          created_at?: string
          date: string
          description: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          claim_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string
          id: string
          interview_date: string | null
          interview_notes: string | null
          job_id: string
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          job_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          job_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          closing_date: string | null
          created_at: string
          department_id: string | null
          description: string | null
          designation: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          posted_by: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          vacancies: number
        }
        Insert: {
          closing_date?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          designation?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          posted_by?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          vacancies?: number
        }
        Update: {
          closing_date?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          designation?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          posted_by?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          vacancies?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          casual_total: number
          casual_used: number
          comp_off_total: number
          comp_off_used: number
          created_at: string
          employee_id: string
          id: string
          privilege_total: number
          privilege_used: number
          sick_total: number
          sick_used: number
          updated_at: string
          wfh_total: number
          wfh_used: number
          year: number
        }
        Insert: {
          casual_total?: number
          casual_used?: number
          comp_off_total?: number
          comp_off_used?: number
          created_at?: string
          employee_id: string
          id?: string
          privilege_total?: number
          privilege_used?: number
          sick_total?: number
          sick_used?: number
          updated_at?: string
          wfh_total?: number
          wfh_used?: number
          year?: number
        }
        Update: {
          casual_total?: number
          casual_used?: number
          comp_off_total?: number
          comp_off_used?: number
          created_at?: string
          employee_id?: string
          id?: string
          privilege_total?: number
          privilege_used?: number
          sick_total?: number
          sick_used?: number
          updated_at?: string
          wfh_total?: number
          wfh_used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          days: number
          employee_id: string
          end_date: string
          hr_note: string | null
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_note: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          days?: number
          employee_id: string
          end_date: string
          hr_note?: string | null
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          manager_note?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          hr_note?: string | null
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          manager_note?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pay_slips: {
        Row: {
          basic: number
          created_at: string
          da: number
          employee_id: string
          gross: number
          hra: number
          id: string
          lop_days: number
          month: number
          net: number
          other_deductions: number
          paid_days: number
          payroll_run_id: string
          professional_tax: number
          special_allowance: number
          ta: number
          working_days: number
          year: number
        }
        Insert: {
          basic?: number
          created_at?: string
          da?: number
          employee_id: string
          gross?: number
          hra?: number
          id?: string
          lop_days?: number
          month: number
          net?: number
          other_deductions?: number
          paid_days?: number
          payroll_run_id: string
          professional_tax?: number
          special_allowance?: number
          ta?: number
          working_days?: number
          year: number
        }
        Update: {
          basic?: number
          created_at?: string
          da?: number
          employee_id?: string
          gross?: number
          hra?: number
          id?: string
          lop_days?: number
          month?: number
          net?: number
          other_deductions?: number
          paid_days?: number
          payroll_run_id?: string
          professional_tax?: number
          special_allowance?: number
          ta?: number
          working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "pay_slips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_slips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          id: string
          month: number
          processed_at: string | null
          processed_by: string | null
          status: string
          total_employees: number
          total_gross: number
          total_net: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_employees?: number
          total_gross?: number
          total_net?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_employees?: number
          total_gross?: number
          total_net?: number
          year?: number
        }
        Relationships: []
      }
      performance_cycles: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      performance_goals: {
        Row: {
          created_at: string
          cycle_id: string
          description: string | null
          employee_id: string
          id: string
          manager_comments: string | null
          manager_rating: number | null
          self_comments: string | null
          self_rating: number | null
          status: string
          title: string
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          cycle_id: string
          description?: string | null
          employee_id: string
          id?: string
          manager_comments?: string | null
          manager_rating?: number | null
          self_comments?: string | null
          self_rating?: number | null
          status?: string
          title: string
          updated_at?: string
          weightage?: number
        }
        Update: {
          created_at?: string
          cycle_id?: string
          description?: string | null
          employee_id?: string
          id?: string
          manager_comments?: string | null
          manager_rating?: number | null
          self_comments?: string | null
          self_rating?: number | null
          status?: string
          title?: string
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string
          grace_minutes: number
          id: string
          name: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          grace_minutes?: number
          id?: string
          name: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          grace_minutes?: number
          id?: string
          name?: string
          start_time?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          max_seats: number | null
          mode: string
          scheduled_at: string | null
          title: string
          trainer: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          max_seats?: number | null
          mode?: string
          scheduled_at?: string | null
          title: string
          trainer?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          max_seats?: number | null
          mode?: string
          scheduled_at?: string | null
          title?: string
          trainer?: string | null
        }
        Relationships: []
      }
      training_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          employee_id: string
          id: string
          score: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          score?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_expenses: {
        Row: {
          amount: number
          approved_amount: number | null
          category: string
          created_at: string
          description: string
          employee_id: string
          expense_date: string
          id: string
          receipt_url: string | null
          status: string
          travel_request_id: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          category: string
          created_at?: string
          description: string
          employee_id: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          status?: string
          travel_request_id: string
        }
        Update: {
          amount?: number
          approved_amount?: number | null
          category?: string
          created_at?: string
          description?: string
          employee_id?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          status?: string
          travel_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_expenses_travel_request_id_fkey"
            columns: ["travel_request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_requests: {
        Row: {
          accommodation_required: boolean | null
          advance_amount: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          departure_date: string
          destination: string
          employee_id: string
          estimated_budget: number | null
          hr_note: string | null
          id: string
          manager_note: string | null
          purpose: string
          return_date: string
          status: string
          travel_mode: string
          updated_at: string
        }
        Insert: {
          accommodation_required?: boolean | null
          advance_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          departure_date: string
          destination: string
          employee_id: string
          estimated_budget?: number | null
          hr_note?: string | null
          id?: string
          manager_note?: string | null
          purpose: string
          return_date: string
          status?: string
          travel_mode?: string
          updated_at?: string
        }
        Update: {
          accommodation_required?: boolean | null
          advance_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          departure_date?: string
          destination?: string
          employee_id?: string
          estimated_budget?: number | null
          hr_note?: string | null
          id?: string
          manager_note?: string | null
          purpose?: string
          return_date?: string
          status?: string
          travel_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_tickets: {
        Row: {
          amount: number | null
          booked_by: string | null
          booking_reference: string | null
          carrier_name: string | null
          created_at: string
          employee_id: string
          from_location: string
          id: string
          seat_class: string | null
          status: string
          ticket_number: string | null
          ticket_type: string
          ticket_url: string | null
          to_location: string
          travel_date: string
          travel_request_id: string
        }
        Insert: {
          amount?: number | null
          booked_by?: string | null
          booking_reference?: string | null
          carrier_name?: string | null
          created_at?: string
          employee_id: string
          from_location: string
          id?: string
          seat_class?: string | null
          status?: string
          ticket_number?: string | null
          ticket_type?: string
          ticket_url?: string | null
          to_location: string
          travel_date: string
          travel_request_id: string
        }
        Update: {
          amount?: number | null
          booked_by?: string | null
          booking_reference?: string | null
          carrier_name?: string | null
          created_at?: string
          employee_id?: string
          from_location?: string
          id?: string
          seat_class?: string | null
          status?: string
          ticket_number?: string | null
          ticket_type?: string
          ticket_url?: string | null
          to_location?: string
          travel_date?: string
          travel_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_tickets_travel_request_id_fkey"
            columns: ["travel_request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      employee_belongs_to: {
        Args: { _employee_id: string; _user_id: string }
        Returns: boolean
      }
      employee_manager_of: {
        Args: { _employee_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "call"
        | "meeting"
        | "email"
        | "task"
        | "note"
        | "demo"
        | "follow_up"
      app_role: "super_admin" | "hr_admin" | "manager" | "employee"
      application_status:
        | "applied"
        | "shortlisted"
        | "interview_scheduled"
        | "selected"
        | "rejected"
        | "on_hold"
      asset_status: "available" | "assigned" | "under_maintenance" | "retired"
      contact_type: "prospect" | "customer" | "partner" | "vendor" | "other"
      deal_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      employee_status: "active" | "inactive" | "on_leave" | "terminated"
      employment_type: "full_time" | "part_time" | "contract" | "intern"
      exit_status:
        | "pending"
        | "accepted"
        | "clearance_in_progress"
        | "completed"
        | "revoked"
      expense_status: "draft" | "submitted" | "approved" | "rejected" | "paid"
      job_status: "draft" | "open" | "closed" | "on_hold"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
        | "proposal_sent"
        | "negotiation"
        | "won"
        | "lost"
      leave_status:
        | "pending_manager"
        | "pending_hr"
        | "approved"
        | "rejected"
        | "cancelled"
      leave_type:
        | "casual"
        | "sick"
        | "privilege"
        | "wfh"
        | "on_duty"
        | "half_day"
        | "comp_off"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "call",
        "meeting",
        "email",
        "task",
        "note",
        "demo",
        "follow_up",
      ],
      app_role: ["super_admin", "hr_admin", "manager", "employee"],
      application_status: [
        "applied",
        "shortlisted",
        "interview_scheduled",
        "selected",
        "rejected",
        "on_hold",
      ],
      asset_status: ["available", "assigned", "under_maintenance", "retired"],
      contact_type: ["prospect", "customer", "partner", "vendor", "other"],
      deal_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      employee_status: ["active", "inactive", "on_leave", "terminated"],
      employment_type: ["full_time", "part_time", "contract", "intern"],
      exit_status: [
        "pending",
        "accepted",
        "clearance_in_progress",
        "completed",
        "revoked",
      ],
      expense_status: ["draft", "submitted", "approved", "rejected", "paid"],
      job_status: ["draft", "open", "closed", "on_hold"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
        "proposal_sent",
        "negotiation",
        "won",
        "lost",
      ],
      leave_status: [
        "pending_manager",
        "pending_hr",
        "approved",
        "rejected",
        "cancelled",
      ],
      leave_type: [
        "casual",
        "sick",
        "privilege",
        "wfh",
        "on_duty",
        "half_day",
        "comp_off",
      ],
    },
  },
} as const
