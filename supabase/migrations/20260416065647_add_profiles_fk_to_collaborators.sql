alter table note_collaborators
add constraint fk_collab_profile
foreign key (user_id)
references public.profiles(id)
on delete cascade;