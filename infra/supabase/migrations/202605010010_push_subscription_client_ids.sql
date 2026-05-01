alter table public.push_subscriptions
  add column client_id text;

alter table public.push_subscriptions
  add constraint push_subscriptions_client_id_length check (
    client_id is null or char_length(client_id) <= 128
  );

create unique index push_subscriptions_hoomin_client_id_idx
  on public.push_subscriptions (hoomin_id, client_id)
  where client_id is not null;
