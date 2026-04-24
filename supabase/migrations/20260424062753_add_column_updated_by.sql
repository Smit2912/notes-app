alter table notes
add column updated_by uuid references auth.users(id);

update notes
set updated_by = owner_id
where updated_by is null;