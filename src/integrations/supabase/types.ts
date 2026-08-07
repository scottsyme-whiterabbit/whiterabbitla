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
      action_log: {
        Row: {
          action_type: string
          actor: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          deal_id: string | null
          draft_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          subject: string | null
          summary: string | null
        }
        Insert: {
          action_type: string
          actor?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_id?: string | null
          draft_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          subject?: string | null
          summary?: string | null
        }
        Update: {
          action_type?: string
          actor?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deal_id?: string | null
          draft_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          subject?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      apollo_batch_log: {
        Row: {
          apollo_fetched: number | null
          bad_domain_rejected: number | null
          batch_id: string | null
          bracket_rejected: number | null
          category: string | null
          created_at: string | null
          free_email_flagged: number | null
          http_status: number | null
          id: string
          inserted: number | null
          mx_rejected: number | null
          page_pulled: number | null
          posted: number | null
          role_based_dropped: number | null
          run_date: string | null
          skipped_invalid_category: number | null
          skipped_missing_email: number | null
          syntax_rejected: number | null
          updated: number | null
        }
        Insert: {
          apollo_fetched?: number | null
          bad_domain_rejected?: number | null
          batch_id?: string | null
          bracket_rejected?: number | null
          category?: string | null
          created_at?: string | null
          free_email_flagged?: number | null
          http_status?: number | null
          id?: string
          inserted?: number | null
          mx_rejected?: number | null
          page_pulled?: number | null
          posted?: number | null
          role_based_dropped?: number | null
          run_date?: string | null
          skipped_invalid_category?: number | null
          skipped_missing_email?: number | null
          syntax_rejected?: number | null
          updated?: number | null
        }
        Update: {
          apollo_fetched?: number | null
          bad_domain_rejected?: number | null
          batch_id?: string | null
          bracket_rejected?: number | null
          category?: string | null
          created_at?: string | null
          free_email_flagged?: number | null
          http_status?: number | null
          id?: string
          inserted?: number | null
          mx_rejected?: number | null
          page_pulled?: number | null
          posted?: number | null
          role_based_dropped?: number | null
          run_date?: string | null
          skipped_invalid_category?: number | null
          skipped_missing_email?: number | null
          syntax_rejected?: number | null
          updated?: number | null
        }
        Relationships: []
      }
      apollo_search_cursor: {
        Row: {
          next_page: number
          updated_at: string
          vertical: string
        }
        Insert: {
          next_page?: number
          updated_at?: string
          vertical: string
        }
        Update: {
          next_page?: number
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      auto_unsubscribe_log: {
        Row: {
          email: string
          id: string
          matched_pattern: string
          notified_at: string | null
          processed_at: string
          reply_from_email: string | null
          source_message_id: string | null
          source_thread_id: string | null
        }
        Insert: {
          email: string
          id?: string
          matched_pattern: string
          notified_at?: string | null
          processed_at?: string
          reply_from_email?: string | null
          source_message_id?: string | null
          source_thread_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          matched_pattern?: string
          notified_at?: string | null
          processed_at?: string
          reply_from_email?: string | null
          source_message_id?: string | null
          source_thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_unsubscribe_log_source_thread_id_fkey"
            columns: ["source_thread_id"]
            isOneToOne: false
            referencedRelation: "deal_email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      bounce_daily_log: {
        Row: {
          bounces_30d: number | null
          complaints: number | null
          created_at: string | null
          direction: string | null
          hard: number | null
          rate_pct: number | null
          run_date: string
          soft: number | null
          total_bounces: number | null
          total_sends: number | null
          worst_category: string | null
          worst_category_rate: number | null
        }
        Insert: {
          bounces_30d?: number | null
          complaints?: number | null
          created_at?: string | null
          direction?: string | null
          hard?: number | null
          rate_pct?: number | null
          run_date: string
          soft?: number | null
          total_bounces?: number | null
          total_sends?: number | null
          worst_category?: string | null
          worst_category_rate?: number | null
        }
        Update: {
          bounces_30d?: number | null
          complaints?: number | null
          created_at?: string | null
          direction?: string | null
          hard?: number | null
          rate_pct?: number | null
          run_date?: string
          soft?: number | null
          total_bounces?: number | null
          total_sends?: number | null
          worst_category?: string | null
          worst_category_rate?: number | null
        }
        Relationships: []
      }
      castle_invite_log: {
        Row: {
          accepted: number
          created_at: string
          declined: number
          id: string
          log_date: string
          replies_received: number
          sent: number
          tier: string
          updated_at: string
        }
        Insert: {
          accepted?: number
          created_at?: string
          declined?: number
          id?: string
          log_date?: string
          replies_received?: number
          sent?: number
          tier: string
          updated_at?: string
        }
        Update: {
          accepted?: number
          created_at?: string
          declined?: number
          id?: string
          log_date?: string
          replies_received?: number
          sent?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      cold_email_campaigns: {
        Row: {
          apollo_id: string | null
          campaign_category: string
          campaign_track: string
          castle_invite_status: string | null
          castle_invited_at: string | null
          castle_night_date: string | null
          castle_tier: string | null
          city: string | null
          company: string | null
          created_at: string
          current_step: number
          domain: string | null
          email: string
          email_status: string | null
          engagement_clicks: number | null
          engagement_opens: number | null
          first_name: string | null
          hot_tag: boolean | null
          id: string
          last_email_sent_at: string | null
          last_name: string | null
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
          website: string | null
        }
        Insert: {
          apollo_id?: string | null
          campaign_category: string
          campaign_track?: string
          castle_invite_status?: string | null
          castle_invited_at?: string | null
          castle_night_date?: string | null
          castle_tier?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_step?: number
          domain?: string | null
          email: string
          email_status?: string | null
          engagement_clicks?: number | null
          engagement_opens?: number | null
          first_name?: string | null
          hot_tag?: boolean | null
          id?: string
          last_email_sent_at?: string | null
          last_name?: string | null
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
          website?: string | null
        }
        Update: {
          apollo_id?: string | null
          campaign_category?: string
          campaign_track?: string
          castle_invite_status?: string | null
          castle_invited_at?: string | null
          castle_night_date?: string | null
          castle_tier?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_step?: number
          domain?: string | null
          email?: string
          email_status?: string | null
          engagement_clicks?: number | null
          engagement_opens?: number | null
          first_name?: string | null
          hot_tag?: boolean | null
          id?: string
          last_email_sent_at?: string | null
          last_name?: string | null
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
          website?: string | null
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
          nurture_started_at: string | null
          nurture_step: number
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
          nurture_started_at?: string | null
          nurture_step?: number
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
          nurture_started_at?: string | null
          nurture_step?: number
          phone?: string | null
          recommendation?: string | null
          source?: string
        }
        Relationships: []
      }
      deal_activity: {
        Row: {
          body: string | null
          created_at: string
          deal_id: string
          id: string
          metadata: Json | null
          occurred_at: string
          title: string | null
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deal_id: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          title?: string | null
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      deal_email_messages: {
        Row: {
          body_text: string | null
          created_at: string
          deal_id: string
          direction: string
          from_email: string | null
          gmail_message_id: string
          id: string
          sent_at: string
          snippet: string | null
          subject: string | null
          thread_id: string
          to_email: string | null
        }
        Insert: {
          body_text?: string | null
          created_at?: string
          deal_id: string
          direction: string
          from_email?: string | null
          gmail_message_id: string
          id?: string
          sent_at: string
          snippet?: string | null
          subject?: string | null
          thread_id: string
          to_email?: string | null
        }
        Update: {
          body_text?: string | null
          created_at?: string
          deal_id?: string
          direction?: string
          from_email?: string | null
          gmail_message_id?: string
          id?: string
          sent_at?: string
          snippet?: string | null
          subject?: string | null
          thread_id?: string
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "deal_email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_email_threads: {
        Row: {
          created_at: string
          deal_id: string
          gmail_thread_id: string
          id: string
          last_inbound_at: string | null
          last_message_at: string | null
          last_outbound_at: string | null
          message_count: number
          snippet: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          gmail_thread_id: string
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          message_count?: number
          snippet?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          gmail_thread_id?: string
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          message_count?: number
          snippet?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          calendar_event_id: string | null
          company: string | null
          contact_email: string
          contact_name: string | null
          created_at: string
          deal_value: number | null
          event_date: string | null
          event_time: string | null
          event_type: string | null
          gmail_thread_id: string | null
          guest_count: string | null
          hot_reason: string | null
          hot_signal: boolean
          id: string
          last_calendar_sync_at: string | null
          last_gmail_sync_at: string | null
          last_inbound_at: string | null
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
          calendar_event_id?: string | null
          company?: string | null
          contact_email: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          gmail_thread_id?: string | null
          guest_count?: string | null
          hot_reason?: string | null
          hot_signal?: boolean
          id?: string
          last_calendar_sync_at?: string | null
          last_gmail_sync_at?: string | null
          last_inbound_at?: string | null
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
          calendar_event_id?: string | null
          company?: string | null
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string | null
          gmail_thread_id?: string | null
          guest_count?: string | null
          hot_reason?: string | null
          hot_signal?: boolean
          id?: string
          last_calendar_sync_at?: string | null
          last_gmail_sync_at?: string | null
          last_inbound_at?: string | null
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
      drive_gallery_picks: {
        Row: {
          created_at: string
          file_id: string
          file_name: string | null
          folder_id: string
          id: string
          mime_type: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          file_id: string
          file_name?: string | null
          folder_id: string
          id?: string
          mime_type?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          file_id?: string
          file_name?: string | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      drive_photo_folders: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          is_gallery: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          is_gallery?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          is_gallery?: boolean
          label?: string
          sort_order?: number
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
      email_drafts: {
        Row: {
          ai_meta: Json | null
          angle: string | null
          body: string
          company: string | null
          contact_email: string
          contact_name: string | null
          created_at: string
          deal_id: string | null
          dismissed_at: string | null
          generation_id: string | null
          gmail_thread_id: string | null
          id: string
          in_reply_to: string | null
          sent_at: string | null
          sent_message_id: string | null
          source: string | null
          status: string
          subject: string
          updated_at: string
          user_hint: string | null
          variant_index: number
          vertical: string | null
        }
        Insert: {
          ai_meta?: Json | null
          angle?: string | null
          body: string
          company?: string | null
          contact_email: string
          contact_name?: string | null
          created_at?: string
          deal_id?: string | null
          dismissed_at?: string | null
          generation_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          in_reply_to?: string | null
          sent_at?: string | null
          sent_message_id?: string | null
          source?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_hint?: string | null
          variant_index?: number
          vertical?: string | null
        }
        Update: {
          ai_meta?: Json | null
          angle?: string | null
          body?: string
          company?: string | null
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          deal_id?: string | null
          dismissed_at?: string | null
          generation_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          in_reply_to?: string | null
          sent_at?: string | null
          sent_message_id?: string | null
          source?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_hint?: string | null
          variant_index?: number
          vertical?: string | null
        }
        Relationships: []
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
      event_invoices: {
        Row: {
          agreement_id: string | null
          amount_paid_cents: number
          anticipation_sent: number
          balance_reminders_sent: number
          client_email: string | null
          client_name: string | null
          created_at: string
          deal_id: string | null
          deposit_paid_at: string | null
          deposit_percent: number
          environment: string
          event_date: string | null
          event_type: string | null
          id: string
          initial_reminders_sent: number
          last_anticipation_at: string | null
          last_balance_reminder_at: string | null
          last_payment_failed_at: string | null
          last_reminder_at: string | null
          paid_in_full_at: string | null
          pay_token: string
          pending_alert_sent_at: string | null
          pending_session_id: string | null
          pending_since: string | null
          sent_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tier_name: string | null
          total_cents: number
          updated_at: string
          venue: string | null
        }
        Insert: {
          agreement_id?: string | null
          amount_paid_cents?: number
          anticipation_sent?: number
          balance_reminders_sent?: number
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          deal_id?: string | null
          deposit_paid_at?: string | null
          deposit_percent?: number
          environment?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          initial_reminders_sent?: number
          last_anticipation_at?: string | null
          last_balance_reminder_at?: string | null
          last_payment_failed_at?: string | null
          last_reminder_at?: string | null
          paid_in_full_at?: string | null
          pay_token: string
          pending_alert_sent_at?: string | null
          pending_session_id?: string | null
          pending_since?: string | null
          sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tier_name?: string | null
          total_cents: number
          updated_at?: string
          venue?: string | null
        }
        Update: {
          agreement_id?: string | null
          amount_paid_cents?: number
          anticipation_sent?: number
          balance_reminders_sent?: number
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          deal_id?: string | null
          deposit_paid_at?: string | null
          deposit_percent?: number
          environment?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          initial_reminders_sent?: number
          last_anticipation_at?: string | null
          last_balance_reminder_at?: string | null
          last_payment_failed_at?: string | null
          last_reminder_at?: string | null
          paid_in_full_at?: string | null
          pay_token?: string
          pending_alert_sent_at?: string | null
          pending_session_id?: string | null
          pending_since?: string | null
          sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tier_name?: string | null
          total_cents?: number
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invoices_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "signed_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_order: {
        Row: {
          ref: string
          sort_order: number
          source: string
          updated_at: string
        }
        Insert: {
          ref: string
          sort_order?: number
          source: string
          updated_at?: string
        }
        Update: {
          ref?: string
          sort_order?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_uploads: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
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
          ab_variant: string | null
          campaign_id: string | null
          contact_id: string
          contact_source: string
          drip_step: number
          id: string
          opened_at: string
          user_agent: string | null
        }
        Insert: {
          ab_variant?: string | null
          campaign_id?: string | null
          contact_id: string
          contact_source?: string
          drip_step?: number
          id?: string
          opened_at?: string
          user_agent?: string | null
        }
        Update: {
          ab_variant?: string | null
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
      proposal_views: {
        Row: {
          id: string
          proposal_id: string | null
          referrer: string | null
          user_agent: string | null
          venue_pitch_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          proposal_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          venue_pitch_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          venue_pitch_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_views_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          closing_attribution: string | null
          closing_quote: string | null
          created_at: string
          deal_id: string | null
          event_date: string
          event_type: string
          faqs: Json
          first_name: string
          gallery_photos: Json
          hero_image: string
          id: string
          intro_paragraph: string
          last_name: string
          letter_intro: string
          recipient_email: string | null
          sent_at: string | null
          slug: string
          square_invoice_url: string | null
          tiers: Json
          timeline: Json
          updated_at: string
          venue: string | null
        }
        Insert: {
          closing_attribution?: string | null
          closing_quote?: string | null
          created_at?: string
          deal_id?: string | null
          event_date?: string
          event_type?: string
          faqs?: Json
          first_name?: string
          gallery_photos?: Json
          hero_image?: string
          id?: string
          intro_paragraph?: string
          last_name?: string
          letter_intro?: string
          recipient_email?: string | null
          sent_at?: string | null
          slug: string
          square_invoice_url?: string | null
          tiers?: Json
          timeline?: Json
          updated_at?: string
          venue?: string | null
        }
        Update: {
          closing_attribution?: string | null
          closing_quote?: string | null
          created_at?: string
          deal_id?: string | null
          event_date?: string
          event_type?: string
          faqs?: Json
          first_name?: string
          gallery_photos?: Json
          hero_image?: string
          id?: string
          intro_paragraph?: string
          last_name?: string
          letter_intro?: string
          recipient_email?: string | null
          sent_at?: string | null
          slug?: string
          square_invoice_url?: string | null
          tiers?: Json
          timeline?: Json
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
      seasonal_campaign_copy: {
        Row: {
          active: boolean
          campaign_key: string
          category: string
          created_at: string
          id: string
          paragraphs: Json
          subject: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          campaign_key: string
          category: string
          created_at?: string
          id?: string
          paragraphs: Json
          subject: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          campaign_key?: string
          category?: string
          created_at?: string
          id?: string
          paragraphs?: Json
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      seasonal_campaign_sends: {
        Row: {
          campaign_key: string
          contact_id: string
          id: string
          sent_at: string
          status: string
        }
        Insert: {
          campaign_key: string
          contact_id: string
          id?: string
          sent_at?: string
          status?: string
        }
        Update: {
          campaign_key?: string
          contact_id?: string
          id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_campaign_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_agreements: {
        Row: {
          agreement_text: string
          client_email: string | null
          client_name: string
          created_at: string
          deal_id: string | null
          event_date: string | null
          event_type: string | null
          id: string
          invoice_sent_at: string | null
          proposal_id: string | null
          proposal_slug: string | null
          signed_at: string
          signer_ip: string | null
          tier_name: string
          tier_price: string | null
          user_agent: string | null
          venue: string | null
        }
        Insert: {
          agreement_text: string
          client_email?: string | null
          client_name: string
          created_at?: string
          deal_id?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          invoice_sent_at?: string | null
          proposal_id?: string | null
          proposal_slug?: string | null
          signed_at?: string
          signer_ip?: string | null
          tier_name: string
          tier_price?: string | null
          user_agent?: string | null
          venue?: string | null
        }
        Update: {
          agreement_text?: string
          client_email?: string | null
          client_name?: string
          created_at?: string
          deal_id?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          invoice_sent_at?: string | null
          proposal_id?: string | null
          proposal_slug?: string | null
          signed_at?: string
          signer_ip?: string | null
          tier_name?: string
          tier_price?: string | null
          user_agent?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signed_agreements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_agreements_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
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
      venue_pitches: {
        Row: {
          case_study_attribution: string | null
          case_study_quote: string | null
          case_study_result: string | null
          closing_private_line: string
          created_at: string
          fee_dollars: number | null
          first_name: string | null
          gm_email: string | null
          gm_name: string
          hero_image: string
          hero_subhead: string
          id: string
          intro_paragraphs: Json
          night_of_week: string | null
          nights_per_week: number
          pilot_weeks: number
          press_line: string | null
          room_detail: string | null
          scheduling_url: string | null
          sent_at: string | null
          session_hours: number
          slug: string
          submarket: string | null
          testimonials: Json
          updated_at: string
          venue_name: string
          video_url: string | null
        }
        Insert: {
          case_study_attribution?: string | null
          case_study_quote?: string | null
          case_study_result?: string | null
          closing_private_line?: string
          created_at?: string
          fee_dollars?: number | null
          first_name?: string | null
          gm_email?: string | null
          gm_name?: string
          hero_image?: string
          hero_subhead?: string
          id?: string
          intro_paragraphs?: Json
          night_of_week?: string | null
          nights_per_week?: number
          pilot_weeks?: number
          press_line?: string | null
          room_detail?: string | null
          scheduling_url?: string | null
          sent_at?: string | null
          session_hours?: number
          slug: string
          submarket?: string | null
          testimonials?: Json
          updated_at?: string
          venue_name?: string
          video_url?: string | null
        }
        Update: {
          case_study_attribution?: string | null
          case_study_quote?: string | null
          case_study_result?: string | null
          closing_private_line?: string
          created_at?: string
          fee_dollars?: number | null
          first_name?: string | null
          gm_email?: string | null
          gm_name?: string
          hero_image?: string
          hero_subhead?: string
          id?: string
          intro_paragraphs?: Json
          night_of_week?: string | null
          nights_per_week?: number
          pilot_weeks?: number
          press_line?: string | null
          room_detail?: string | null
          scheduling_url?: string | null
          sent_at?: string | null
          session_hours?: number
          slug?: string
          submarket?: string | null
          testimonials?: Json
          updated_at?: string
          venue_name?: string
          video_url?: string | null
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
