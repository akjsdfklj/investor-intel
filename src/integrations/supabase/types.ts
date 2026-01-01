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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dd_reports: {
        Row: {
          created_at: string
          deal_id: string
          follow_up_questions: string[] | null
          id: string
          market_reason: string | null
          market_score: number | null
          moat_reason: string | null
          moat_score: number | null
          product_reason: string | null
          product_score: number | null
          scraped_content: string | null
          summary: string | null
          team_reason: string | null
          team_score: number | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          follow_up_questions?: string[] | null
          id?: string
          market_reason?: string | null
          market_score?: number | null
          moat_reason?: string | null
          moat_score?: number | null
          product_reason?: string | null
          product_score?: number | null
          scraped_content?: string | null
          summary?: string | null
          team_reason?: string | null
          team_score?: number | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          follow_up_questions?: string[] | null
          id?: string
          market_reason?: string | null
          market_score?: number | null
          moat_reason?: string | null
          moat_score?: number | null
          product_reason?: string | null
          product_score?: number | null
          scraped_content?: string | null
          summary?: string | null
          team_reason?: string | null
          team_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dd_reports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_sources: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          source_type: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          source_type: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          source_type?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      founder_inquiries: {
        Row: {
          additional_info: string | null
          deal_id: string
          founder_bio: string
          founder_email: string
          founder_name: string
          id: string
          linkedin_url: string | null
          submitted_at: string
        }
        Insert: {
          additional_info?: string | null
          deal_id: string
          founder_bio: string
          founder_email: string
          founder_name: string
          id?: string
          linkedin_url?: string | null
          submitted_at?: string
        }
        Update: {
          additional_info?: string | null
          deal_id?: string
          founder_bio?: string
          founder_email?: string
          founder_name?: string
          id?: string
          linkedin_url?: string | null
          submitted_at?: string
        }
        Relationships: []
      }
      founder_portal_access: {
        Row: {
          access_token: string | null
          company_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token?: string | null
          company_id: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string | null
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_portal_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_transactions: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_reviews: {
        Row: {
          comments: string | null
          created_at: string
          deal_id: string
          id: string
          reviewer_name: string
          vote: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          deal_id: string
          id?: string
          reviewer_name: string
          vote: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          reviewer_name?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "ic_reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_deals: {
        Row: {
          ask_amount: number | null
          assigned_to: string | null
          created_at: string
          dd_report_id: string | null
          description: string | null
          founder_email: string | null
          founder_name: string | null
          id: string
          name: string
          pitch_deck_content: string | null
          pitch_deck_url: string | null
          priority: number | null
          sector: string | null
          source_id: string | null
          source_type: string | null
          stage: string
          stage_entered_at: string | null
          updated_at: string
          valuation: number | null
          website_url: string | null
        }
        Insert: {
          ask_amount?: number | null
          assigned_to?: string | null
          created_at?: string
          dd_report_id?: string | null
          description?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          name: string
          pitch_deck_content?: string | null
          pitch_deck_url?: string | null
          priority?: number | null
          sector?: string | null
          source_id?: string | null
          source_type?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string
          valuation?: number | null
          website_url?: string | null
        }
        Update: {
          ask_amount?: number | null
          assigned_to?: string | null
          created_at?: string
          dd_report_id?: string | null
          description?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          name?: string
          pitch_deck_content?: string | null
          pitch_deck_url?: string | null
          priority?: number | null
          sector?: string | null
          source_id?: string | null
          source_type?: string | null
          stage?: string
          stage_entered_at?: string | null
          updated_at?: string
          valuation?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      portfolio_companies: {
        Row: {
          created_at: string
          current_valuation: number | null
          deal_id: string | null
          founder_email: string | null
          founder_name: string | null
          id: string
          investment_amount: number
          investment_date: string
          name: string
          notes: string | null
          ownership_percentage: number | null
          sector: string | null
          status: string | null
          updated_at: string
          valuation_at_investment: number | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          current_valuation?: number | null
          deal_id?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          investment_amount: number
          investment_date: string
          name: string
          notes?: string | null
          ownership_percentage?: number | null
          sector?: string | null
          status?: string | null
          updated_at?: string
          valuation_at_investment?: number | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          current_valuation?: number | null
          deal_id?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          investment_amount?: number
          investment_date?: string
          name?: string
          notes?: string | null
          ownership_percentage?: number | null
          sector?: string | null
          status?: string | null
          updated_at?: string
          valuation_at_investment?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_companies_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_kpis: {
        Row: {
          arr: number | null
          burn_rate: number | null
          churn_rate: number | null
          company_id: string
          created_at: string
          customers: number | null
          headcount: number | null
          id: string
          mrr: number | null
          notes: string | null
          nps_score: number | null
          period_date: string
          period_type: string
          revenue: number | null
          runway_months: number | null
          submitted_by: string | null
        }
        Insert: {
          arr?: number | null
          burn_rate?: number | null
          churn_rate?: number | null
          company_id: string
          created_at?: string
          customers?: number | null
          headcount?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          nps_score?: number | null
          period_date: string
          period_type: string
          revenue?: number | null
          runway_months?: number | null
          submitted_by?: string | null
        }
        Update: {
          arr?: number | null
          burn_rate?: number | null
          churn_rate?: number | null
          company_id?: string
          created_at?: string
          customers?: number | null
          headcount?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          nps_score?: number | null
          period_date?: string
          period_type?: string
          revenue?: number | null
          runway_months?: number | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_notes: {
        Row: {
          created_at: string
          deal_id: string
          decision: string | null
          id: string
          market_score: number | null
          notes: string | null
          product_score: number | null
          team_score: number | null
          timing_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          decision?: string | null
          id?: string
          market_score?: number | null
          notes?: string | null
          product_score?: number | null
          team_score?: number | null
          timing_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          decision?: string | null
          id?: string
          market_score?: number | null
          notes?: string | null
          product_score?: number | null
          team_score?: number | null
          timing_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      term_sheets: {
        Row: {
          created_at: string
          deal_id: string
          discount_rate: number | null
          google_doc_id: string | null
          google_doc_url: string | null
          id: string
          investment_amount: number | null
          opened_at: string | null
          pro_rata_rights: boolean | null
          recipient_email: string | null
          sent_at: string | null
          signed_at: string | null
          status: string | null
          template_type: string | null
          updated_at: string
          valuation_cap: number | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          discount_rate?: number | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          investment_amount?: number | null
          opened_at?: string | null
          pro_rata_rights?: boolean | null
          recipient_email?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string | null
          template_type?: string | null
          updated_at?: string
          valuation_cap?: number | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          discount_rate?: number | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          investment_amount?: number | null
          opened_at?: string | null
          pro_rata_rights?: boolean | null
          recipient_email?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string | null
          template_type?: string | null
          updated_at?: string
          valuation_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "term_sheets_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "pipeline_deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
