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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          auth_user_id: string | null
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          barber_staff_id: string | null
          branch_id: string
          created_at: string
          customer_id: string
          end_at: string | null
          id: string
          notes: string | null
          service_id: string
          source: string
          start_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          barber_staff_id?: string | null
          branch_id: string
          created_at?: string
          customer_id: string
          end_at?: string | null
          id?: string
          notes?: string | null
          service_id: string
          source?: string
          start_at: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          barber_staff_id?: string | null
          branch_id?: string
          created_at?: string
          customer_id?: string
          end_at?: string | null
          id?: string
          notes?: string | null
          service_id?: string
          source?: string
          start_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_staff_id_fkey"
            columns: ["barber_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_seats: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          seat_number: number
          staff_profile_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          seat_number: number
          staff_profile_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          seat_number?: number
          staff_profile_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_seats_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_seats_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_seats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          checkin_token: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_hq: boolean
          name: string
          operating_hours: Json
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          checkin_token?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_hq?: boolean
          name: string
          operating_hours?: Json
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          checkin_token?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_hq?: boolean
          name?: string
          operating_hours?: Json
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_schemes: {
        Row: {
          base_salary: number
          created_at: string
          deduction_rules: Json
          id: string
          is_active: boolean
          name: string
          payout_model: string
          per_customer_amount: number
          per_service_amount: number
          percentage_rate: number
          product_commission_rate: number
          target_bonus_rules: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          deduction_rules?: Json
          id?: string
          is_active?: boolean
          name: string
          payout_model: string
          per_customer_amount?: number
          per_service_amount?: number
          percentage_rate?: number
          product_commission_rate?: number
          target_bonus_rules?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          deduction_rules?: Json
          id?: string
          is_active?: boolean
          name?: string
          payout_model?: string
          per_customer_amount?: number
          per_service_amount?: number
          percentage_rate?: number
          product_commission_rate?: number
          target_bonus_rules?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_schemes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          branch_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          loyalty_points: number
          notes: string | null
          phone: string
          preferred_barber_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          loyalty_points?: number
          notes?: string | null
          phone: string
          preferred_barber_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          loyalty_points?: number
          notes?: string | null
          phone?: string
          preferred_barber_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_preferred_barber_id_fkey"
            columns: ["preferred_barber_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string | null
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          status: string
          supplier_id: string | null
          tenant_id: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          expense_date: string
          id?: string
          notes?: string | null
          payment_method: string
          status?: string
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          is_active: boolean
          item_type: string
          name: string
          reorder_level: number
          sell_price: number | null
          sku: string | null
          stock_qty: number
          supplier_id: string | null
          tenant_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_type: string
          name: string
          reorder_level?: number
          sell_price?: number | null
          sku?: string | null
          stock_qty?: number
          supplier_id?: string | null
          tenant_id: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_type?: string
          name?: string
          reorder_level?: number
          sell_price?: number | null
          sku?: string | null
          stock_qty?: number
          supplier_id?: string | null
          tenant_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          movement_type: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          movement_type: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          advances: number
          base_salary: number
          bonuses: number
          created_at: string
          customers_served: number | null
          days_worked: number | null
          deductions: number
          id: string
          net_payout: number
          notes: string | null
          payroll_period_id: string
          product_commission: number
          product_revenue: number | null
          service_commission: number
          service_revenue: number | null
          services_count: number | null
          staff_id: string
          tenant_id: string
          total_working_days: number | null
          updated_at: string
        }
        Insert: {
          advances?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          customers_served?: number | null
          days_worked?: number | null
          deductions?: number
          id?: string
          net_payout?: number
          notes?: string | null
          payroll_period_id: string
          product_commission?: number
          product_revenue?: number | null
          service_commission?: number
          service_revenue?: number | null
          services_count?: number | null
          staff_id: string
          tenant_id: string
          total_working_days?: number | null
          updated_at?: string
        }
        Update: {
          advances?: number
          base_salary?: number
          bonuses?: number
          created_at?: string
          customers_served?: number | null
          days_worked?: number | null
          deductions?: number
          id?: string
          net_payout?: number
          notes?: string | null
          payroll_period_id?: string
          product_commission?: number
          product_revenue?: number | null
          service_commission?: number
          service_revenue?: number | null
          services_count?: number | null
          staff_id?: string
          tenant_id?: string
          total_working_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          payout_due_date: string | null
          period_end: string
          period_start: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payout_due_date?: string | null
          period_end: string
          period_start: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payout_due_date?: string | null
          period_end?: string
          period_start?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_ticket_seats: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          seat_id: string | null
          service_id: string | null
          staff_id: string | null
          started_at: string
          status: string
          tenant_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          seat_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          started_at?: string
          status?: string
          tenant_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          seat_id?: string | null
          service_id?: string | null
          staff_id?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_ticket_seats_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "branch_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_ticket_seats_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_ticket_seats_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_ticket_seats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_ticket_seats_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "queue_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_tickets: {
        Row: {
          assigned_staff_id: string | null
          branch_id: string
          called_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          estimated_wait_min: number | null
          id: string
          member_services: Json
          party_size: number
          preferred_staff_id: string | null
          queue_day: string
          queue_number: string
          seat_id: string | null
          service_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          branch_id: string
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_wait_min?: number | null
          id?: string
          member_services?: Json
          party_size?: number
          preferred_staff_id?: string | null
          queue_day?: string
          queue_number: string
          seat_id?: string | null
          service_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          branch_id?: string
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_wait_min?: number | null
          id?: string
          member_services?: Json
          party_size?: number
          preferred_staff_id?: string | null
          queue_day?: string
          queue_number?: string
          seat_id?: string | null
          service_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_tickets_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_preferred_staff_id_fkey"
            columns: ["preferred_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "branch_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          duration_min: number
          id: string
          is_active: boolean
          name: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          duration_min: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_commission_assignments: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          scheme_id: string
          staff_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          scheme_id: string
          staff_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          scheme_id?: string
          staff_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_commission_assignments_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "commission_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_commission_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_commission_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          id: string
          tenant_id: string
          staff_id: string
          branch_id: string | null
          date: string
          clock_in: string | null
          clock_out: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          staff_id: string
          branch_id?: string | null
          date: string
          clock_in?: string | null
          clock_out?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          staff_id?: string
          branch_id?: string | null
          date?: string
          clock_in?: string | null
          clock_out?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          base_salary: number
          created_at: string
          employee_code: string | null
          employment_type: string
          epf_enabled: boolean
          id: string
          joined_at: string | null
          notes: string | null
          socso_enabled: boolean
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          employee_code?: string | null
          employment_type?: string
          epf_enabled?: boolean
          id?: string
          joined_at?: string | null
          notes?: string | null
          socso_enabled?: boolean
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          employee_code?: string | null
          employment_type?: string
          epf_enabled?: boolean
          id?: string
          joined_at?: string | null
          notes?: string | null
          socso_enabled?: boolean
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          address_line1: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          onboarding_completed: boolean | null
          owner_auth_id: string | null
          phone: string | null
          plan: string | null
          postcode: string | null
          registration_number: string | null
          slug: string
          state: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          onboarding_completed?: boolean | null
          owner_auth_id?: string | null
          phone?: string | null
          plan?: string | null
          postcode?: string | null
          registration_number?: string | null
          slug: string
          state?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          onboarding_completed?: boolean | null
          owner_auth_id?: string | null
          phone?: string | null
          plan?: string | null
          postcode?: string | null
          registration_number?: string | null
          slug?: string
          state?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_type: string
          line_total: number
          name: string
          quantity: number
          service_id: string | null
          staff_id: string | null
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_type: string
          line_total: number
          name: string
          quantity?: number
          service_id?: string | null
          staff_id?: string | null
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_type?: string
          line_total?: number
          name?: string
          quantity?: number
          service_id?: string | null
          staff_id?: string | null
          tenant_id?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          branch_id: string
          cashier_user_id: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          queue_ticket_id: string | null
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          cashier_user_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          queue_ticket_id?: string | null
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          cashier_user_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          queue_ticket_id?: string | null
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cashier_user_id_fkey"
            columns: ["cashier_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_queue_ticket_id_fkey"
            columns: ["queue_ticket_id"]
            isOneToOne: false
            referencedRelation: "queue_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      get_my_owned_tenant_ids: { Args: never; Returns: string[] }
      get_my_tenant_id: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
      link_auth_user_by_email: {
        Args: { p_email: string; p_role?: string; p_tenant_slug?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

