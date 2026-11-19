ALTER TABLE public.personal_replies DROP CONSTRAINT IF EXISTS personal_replies_reply_type_check;
ALTER TABLE public.personal_replies ADD CONSTRAINT personal_replies_reply_type_check
  CHECK (reply_type IN ('voicemail','schedule_call','date_open','booked','proposal_followup','quiet_reengage','proposal_checkin','date_still_open','castle_invite','smart_draft'));