create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict do nothing;

  return new;
end;
$$ language plpgsql;

alter function handle_new_user owner to postgres;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();