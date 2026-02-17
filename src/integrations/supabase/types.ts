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
      contact_inquiries: {
        Row: {
          budget: string | null
          client_type: string | null
          created_at: string
          date: string | null
          email: string
          event_type: string | null
          guest_count: string | null
          id: string
          location: string | null
          message: string | null
          name: string
          phone: string | null
          recommendation: string | null
          source: string
        }
        Insert: {
          budget?: string | null
          client_type?: string | null
          created_at?: string
          date?: string | null
          email: string
          event_type?: string | null
          guest_count?: string | null
          id?: string
          location?: string | null
          message?: string | null
          name: string
          phone?: string | null
          recommendation?: string | null
          source?: string
        }
        Update: {
          budget?: string | null
          client_type?: string | null
          created_at?: string
          date?: string | null
          email?: string
          event_type?: string | null
          guest_count?: string | null
          id?: string
          location?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          recommendation?: string | null
          source?: string
        }
        Relationships: []
      }
      discovery_quiz_leads: {
        Row: {
          biggest_concern: string | null
          client_type: string | null
          created_at: string
          email: string | null
          event_type: string | null
          experience_priority: string | null
          guest_count: string | null
          id: string
          name: string | null
          quiz_answers: Json
          recommendation: string
        }
        Insert: {
          biggest_concern?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          event_type?: string | null
          experience_priority?: string | null
          guest_count?: string | null
          id?: string
          name?: string | null
          quiz_answers?: Json
          recommendation: string
        }
        Update: {
          biggest_concern?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          event_type?: string | null
          experience_priority?: string | null
          guest_count?: string | null
          id?: string
          name?: string | null
          quiz_answers?: Json
          recommendation?: string
        }
        Relationships: []
      }
      lead_magnet_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source_page: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source_page?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source_page?: string | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          body_html: string
          body_preview: string | null
          campaign_type: string
          created_at: string
          drip_step: number | null
          id: string
          sent_count: number | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_preview?: string | null
          campaign_type?: string
          created_at?: string
          drip_step?: number | null
          id?: string
          sent_count?: number | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_preview?: string | null
          campaign_type?: string
          created_at?: string
          drip_step?: number | null
          id?: string
          sent_count?: number | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_clicks: {
        Row: {
          clicked_at: string
          contact_id: string
          drip_step: number
          id: string
          link_slug: string
        }
        Insert: {
          clicked_at?: string
          contact_id: string
          drip_step: number
          id?: string
          link_slug: string
        }
        Update: {
          clicked_at?: string
          contact_id?: string
          drip_step?: number
          id?: string
          link_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_clicks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "newsletter_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_contacts: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          drip_campaign: string
          drip_started_at: string | null
          drip_step: number
          email: string
          engagement_status: string
          id: string
          last_emailed_at: string | null
          name: string | null
          reply_detected: boolean
          source: string | null
          subscribed: boolean
          updated_at: string
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          drip_campaign?: string
          drip_started_at?: string | null
          drip_step?: number
          email: string
          engagement_status?: string
          id?: string
          last_emailed_at?: string | null
          name?: string | null
          reply_detected?: boolean
          source?: string | null
          subscribed?: boolean
          updated_at?: string
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          drip_campaign?: string
          drip_started_at?: string | null
          drip_step?: number
          email?: string
          engagement_status?: string
          id?: string
          last_emailed_at?: string | null
          name?: string | null
          reply_detected?: boolean
          source?: string | null
          subscribed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_opens: {
        Row: {
          campaign_id: string | null
          contact_id: string
          drip_step: number
          id: string
          opened_at: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          contact_id: string
          drip_step?: number
          id?: string
          opened_at?: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string
          drip_step?: number
          id?: string
          opened_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_opens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "newsletter_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_send_log: {
        Row: {
          campaign_id: string
          contact_id: string
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_send_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_send_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "newsletter_contacts"
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
