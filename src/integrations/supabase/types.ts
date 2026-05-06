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
      cold_email_campaigns: {
        Row: {
          apollo_id: string | null
          campaign_category: string
          city: string | null
          company: string | null
          created_at: string
          current_step: number
          email: string
          engagement_clicks: number | null
          engagement_opens: number | null
          hot_tag: boolean | null
          id: string
          last_email_sent_at: string | null
          linkedin_url: string | null
          name: string | null
          notes: string | null
          nurture_last_sent_at: string | null
          nurture_started_at: string | null
          nurture_status: string
          nurture_step: number
          phone: string | null
          started_at: string | null
          state: string | null
          status: string
          title: string | null
          tournament_course: string | null
          tournament_date: string | null
          tournament_name: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          apollo_id?: string | null
          campaign_category: string
          city?: string | null
          company?: string | null
          created_at?: string
          current_step?: number
          email: string
          engagement_clicks?: number | null
          engagement_opens?: number | null
          hot_tag?: boolean | null
          id?: string
          last_email_sent_at?: string | null
          linkedin_url?: string | null
          name?: string | null
          notes?: string | null
          nurture_last_sent_at?: string | null
          nurture_started_at?: string | null
          nurture_status?: string
          nurture_step?: number
          phone?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          title?: string | null
          tournament_course?: string | null
          tournament_date?: string | null
          tournament_name?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          apollo_id?: string | null
          campaign_category?: string
          city?: string | null
          company?: string | null
          created_at?: string
          current_step?: number
          email?: string
          engagement_clicks?: number | null
          engagement_opens?: number | null
          hot_tag?: boolean | null
          id?: string
          last_email_sent_at?: string | null
          linkedin_url?: string | null
          name?: string | null
          notes?: string | null
          nurture_last_sent_at?: string | null
          nurture_started_at?: string | null
          nurture_status?: string
          nurture_step?: number
          phone?: string | null
          started_at?: string | null
          state?: string | null
          status?: string
          title?: string | null
          tournament_course?: string | null
          tournament_date?: string | null
          tournament_name?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consultation_leads: {
        Row: {
          created_at: string
          description: string | null
          email: string
          event_date: string | null
          event_type: string | null
          id: string
          name: string
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          name: string
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          name?: string
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      contact_cleanup_log: {
        Row: {
          cleaned_at: string
          contact_id: string | null
          id: string
          original_email: string
          reason: string
          source_table: string
        }
        Insert: {
          cleaned_at?: string
          contact_id?: string | null
          id?: string
          original_email: string
          reason: string
          source_table?: string
        }
        Update: {
          cleaned_at?: string
          contact_id?: string | null
          id?: string
          original_email?: string
          reason?: string
          source_table?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          budget: string | null
          client_type: string | null
          created_at: string
          date: string | null
          email: string
          event_type: string | null
          followup_started_at: string | null
          followup_step: number
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
          followup_started_at?: string | null
          followup_step?: number
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
          followup_started_at?: string | null
          followup_step?: number
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
      deals: {
        Row: {
          company: string | null
          contact_email: string
          contact_name: string | null
          created_at: string
          deal_value: number | null
          event_date: string | null
          event_time: string | null
          event_type: string | null
          guest_count: string | null
          id: string
          last_outreach_date: string | null
          location: string | null
          lost_reason: string | null
          next_follow_up: string | null
          notes: string | null
          outreach_notes: string | null
          outreach_status: string | null
          phone: string | null
          post_show_started_at: string | null
          post_show_step: number
          priority_score: number | null
          review_completed_at: string | null
          source: string | null
          source_id: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          contact_email: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: string | null
          id?: string
          last_outreach_date?: string | null
          location?: string | null
          lost_reason?: string | null
          next_follow_up?: string | null
          notes?: string | null
          outreach_notes?: string | null
          outreach_status?: string | null
          phone?: string | null
          post_show_started_at?: string | null
          post_show_step?: number
          priority_score?: number | null
          review_completed_at?: string | null
          source?: string | null
          source_id?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: string | null
          id?: string
          last_outreach_date?: string | null
          location?: string | null
          lost_reason?: string | null
          next_follow_up?: string | null
          notes?: string | null
          outreach_notes?: string | null
          outreach_status?: string | null
          phone?: string | null
          post_show_started_at?: string | null
          post_show_step?: number
          priority_score?: number | null
          review_completed_at?: string | null
          source?: string | null
          source_id?: string | null
          stage?: string
          updated_at?: string
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
      edge_function_requests: {
        Row: {
          auth_result: string
          created_at: string | null
          duration_ms: number | null
          function_name: string
          id: string
          ip_hash: string | null
          path: string | null
          query_summary: string | null
          status_code: number
        }
        Insert: {
          auth_result: string
          created_at?: string | null
          duration_ms?: number | null
          function_name: string
          id?: string
          ip_hash?: string | null
          path?: string | null
          query_summary?: string | null
          status_code: number
        }
        Update: {
          auth_result?: string
          created_at?: string | null
          duration_ms?: number | null
          function_name?: string
          id?: string
          ip_hash?: string | null
          path?: string | null
          query_summary?: string | null
          status_code?: number
        }
        Relationships: []
      }
      email_bounces: {
        Row: {
          bounce_type: string
          contact_id: string | null
          created_at: string
          email: string
          id: string
          raw_payload: Json | null
          reason: string | null
        }
        Insert: {
          bounce_type: string
          contact_id?: string | null
          created_at?: string
          email: string
          id?: string
          raw_payload?: Json | null
          reason?: string | null
        }
        Update: {
          bounce_type?: string
          contact_id?: string | null
          created_at?: string
          email?: string
          id?: string
          raw_payload?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_bounces_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "newsletter_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppression_list: {
        Row: {
          email: string
          id: string
          notes: string | null
          reason: string
          source_campaign_category: string | null
          suppressed_at: string
        }
        Insert: {
          email: string
          id?: string
          notes?: string | null
          reason: string
          source_campaign_category?: string | null
          suppressed_at?: string
        }
        Update: {
          email?: string
          id?: string
          notes?: string | null
          reason?: string
          source_campaign_category?: string | null
          suppressed_at?: string
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          email: string
          id: string
          ip_hash: string | null
          source: string
          unsubscribed_at: string
          user_agent: string | null
        }
        Insert: {
          email: string
          id?: string
          ip_hash?: string | null
          source?: string
          unsubscribed_at?: string
          user_agent?: string | null
        }
        Update: {
          email?: string
          id?: string
          ip_hash?: string | null
          source?: string
          unsubscribed_at?: string
          user_agent?: string | null
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
      manual_outreach_log: {
        Row: {
          castle_preview_booked: boolean | null
          category: string
          concept_call_booked: boolean | null
          created_at: string | null
          email: string
          event_booked: boolean | null
          id: string
          notes: string | null
          replied: boolean | null
          revenue_dollars: number | null
          sent_date: string
        }
        Insert: {
          castle_preview_booked?: boolean | null
          category: string
          concept_call_booked?: boolean | null
          created_at?: string | null
          email: string
          event_booked?: boolean | null
          id?: string
          notes?: string | null
          replied?: boolean | null
          revenue_dollars?: number | null
          sent_date?: string
        }
        Update: {
          castle_preview_booked?: boolean | null
          category?: string
          concept_call_booked?: boolean | null
          created_at?: string | null
          email?: string
          event_booked?: boolean | null
          id?: string
          notes?: string | null
          replied?: boolean | null
          revenue_dollars?: number | null
          sent_date?: string
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
          contact_source: string
          drip_step: number
          id: string
          link_slug: string
        }
        Insert: {
          clicked_at?: string
          contact_id: string
          contact_source?: string
          drip_step: number
          id?: string
          link_slug: string
        }
        Update: {
          clicked_at?: string
          contact_id?: string
          contact_source?: string
          drip_step?: number
          id?: string
          link_slug?: string
        }
        Relationships: []
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
          optimal_send_hour: number | null
          phone: string | null
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
          optimal_send_hour?: number | null
          phone?: string | null
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
          optimal_send_hour?: number | null
          phone?: string | null
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
          contact_source: string
          drip_step: number
          id: string
          opened_at: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          contact_id: string
          contact_source?: string
          drip_step?: number
          id?: string
          opened_at?: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string
          contact_source?: string
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
        ]
      }
      newsletter_send_log: {
        Row: {
          ab_variant: string | null
          campaign_id: string
          contact_id: string
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          ab_variant?: string | null
          campaign_id: string
          contact_id: string
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          ab_variant?: string | null
          campaign_id?: string
          contact_id?: string
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      outreach_log: {
        Row: {
          action_type: string
          contact_email: string
          contact_name: string | null
          created_at: string
          id: string
          notes: string | null
          outcome: string | null
        }
        Insert: {
          action_type?: string
          contact_email: string
          contact_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
        }
        Update: {
          action_type?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          closing_attribution: string | null
          closing_quote: string | null
          created_at: string
          event_date: string
          event_type: string
          faqs: Json
          first_name: string
          hero_image: string
          id: string
          intro_paragraph: string
          last_name: string
          recipient_email: string | null
          sent_at: string | null
          slug: string
          tiers: Json
          timeline: Json
          updated_at: string
          venue: string | null
        }
        Insert: {
          closing_attribution?: string | null
          closing_quote?: string | null
          created_at?: string
          event_date?: string
          event_type?: string
          faqs?: Json
          first_name?: string
          hero_image?: string
          id?: string
          intro_paragraph?: string
          last_name?: string
          recipient_email?: string | null
          sent_at?: string | null
          slug: string
          tiers?: Json
          timeline?: Json
          updated_at?: string
          venue?: string | null
        }
        Update: {
          closing_attribution?: string | null
          closing_quote?: string | null
          created_at?: string
          event_date?: string
          event_type?: string
          faqs?: Json
          first_name?: string
          hero_image?: string
          id?: string
          intro_paragraph?: string
          last_name?: string
          recipient_email?: string | null
          sent_at?: string | null
          slug?: string
          tiers?: Json
          timeline?: Json
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          referred_email: string | null
          referred_event_details: string | null
          referred_name: string
          referrer_company: string | null
          referrer_email: string
          referrer_name: string
          reward_redeemed: boolean
          status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          referred_email?: string | null
          referred_event_details?: string | null
          referred_name: string
          referrer_company?: string | null
          referrer_email: string
          referrer_name: string
          reward_redeemed?: boolean
          status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          referred_email?: string | null
          referred_event_details?: string | null
          referred_name?: string
          referrer_company?: string | null
          referrer_email?: string
          referrer_name?: string
          reward_redeemed?: boolean
          status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      stats_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      unpause_audit_log: {
        Row: {
          action: string
          bounce_rate: number | null
          campaign_category: string
          contacts_affected: number | null
          created_at: string
          details: Json | null
          hard_bounce_rate: number | null
          id: string
          send_volume: number | null
          threshold_fired: string | null
        }
        Insert: {
          action: string
          bounce_rate?: number | null
          campaign_category: string
          contacts_affected?: number | null
          created_at?: string
          details?: Json | null
          hard_bounce_rate?: number | null
          id?: string
          send_volume?: number | null
          threshold_fired?: string | null
        }
        Update: {
          action?: string
          bounce_rate?: number | null
          campaign_category?: string
          contacts_affected?: number | null
          created_at?: string
          details?: Json | null
          hard_bounce_rate?: number | null
          id?: string
          send_volume?: number | null
          threshold_fired?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_resident_opens_stats: { Args: never; Returns: Json }
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
