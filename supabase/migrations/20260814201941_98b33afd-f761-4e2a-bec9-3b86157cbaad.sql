update public.event_invoices set deal_id = '458b59f7-bf38-4a6a-83de-8319719899e4' where id = '2fa92200-11b6-4e30-b887-470eaca4c609';
update public.signed_agreements set deal_id = '458b59f7-bf38-4a6a-83de-8319719899e4' where id = '4e0778ed-ff7c-43c2-bcfb-3e0836ac780b';
update public.deals set deal_value = coalesce(deal_value, 1500) where id = '458b59f7-bf38-4a6a-83de-8319719899e4';
update public.event_invoices ei set deal_id = d.id from public.deals d
  where ei.deal_id is null and ei.client_email is not null and ei.client_email <> ''
    and lower(d.contact_email) = lower(ei.client_email);
update public.signed_agreements sa set deal_id = ei.deal_id from public.event_invoices ei
  where sa.deal_id is null and ei.agreement_id = sa.id and ei.deal_id is not null;