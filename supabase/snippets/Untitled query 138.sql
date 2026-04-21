set local role authenticated;
set local "request.jwt.claims" = '{"sub": "a5f9834f-e71b-401e-879f-da9d98e49fc6"}';

insert into notes (title, content, owner_id) 
values ('Secret Note', 'This is for User A eyes only', 'a5f9834f-e71b-401e-879f-da9d98e49fc6')
returning *;