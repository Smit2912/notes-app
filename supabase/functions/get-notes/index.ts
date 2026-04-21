import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // 🔑 Admin client (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Get owned notes
    const { data: ownedNotes, error: ownedError } = await supabaseAdmin
      .from('notes')
      .select(
        `
          id,
          title,
          content,
          owner_id,
          note_collaborators (
            user_id,
            role
          )
        `
      )
      .eq('owner_id', user.id);

    // 2. Get collaborated notes
    const { data: sharedNotes, error: sharedError } = await supabaseAdmin
      .from('note_collaborators')
      .select(
        `
          role,
          notes (
            id,
            title,
            content,
            owner_id,
            note_collaborators (
              user_id,
              role
            )
          )
        `
      )
      .eq('user_id', user.id);

    if (ownedError || sharedError) {
      return new Response(
        JSON.stringify({ error: ownedError?.message || sharedError?.message }),
        { status: 400 }
      );
    }

    const sharedMapped = sharedNotes.map((c: any) => ({
      ...c.notes,
    }));

    // Remove duplicates (important)
    const allNotesMap = new Map();

    [...(ownedNotes || []), ...sharedMapped].forEach((note) => {
      allNotesMap.set(note.id, note);
    });

    const allNotes = Array.from(allNotesMap.values());

    const notesWithRole = allNotes.map((note) => {
      const isOwner = note.owner_id === user.id;

      const collaborator = note.note_collaborators?.find(
        (c: any) => c.user_id === user.id
      );

      let role = 'viewer';

      if (isOwner) {
        role = 'owner';
      } else if (collaborator) {
        role = collaborator.role;
      }

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        owner_id: note.owner_id,
        role,
      };
    });

    return new Response(JSON.stringify({ data: notesWithRole }), {
      status: 200,
    });
  } catch (error) {
    console.log('ERROR:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
