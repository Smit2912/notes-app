import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: ownedNotes, error: ownedError } = await supabaseAdmin
      .from('notes')
      .select('id, title, content, owner_id, note_collaborators(user_id, role)')
      .eq('owner_id', user.id);

    const { data: sharedNotes, error: sharedError } = await supabaseAdmin
      .from('note_collaborators')
      .select(
        'role, notes(id, title, content, owner_id, note_collaborators(user_id, role))'
      )
      .eq('user_id', user.id);

    if (ownedError || sharedError) {
      return new Response(
        JSON.stringify({ error: ownedError?.message || sharedError?.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sharedMapped = sharedNotes.map((c: any) => ({ ...c.notes }));
    const allNotesMap = new Map();
    [...(ownedNotes || []), ...sharedMapped].forEach((note) =>
      allNotesMap.set(note.id, note)
    );

    const notesWithRole = Array.from(allNotesMap.values()).map((note) => {
      const isOwner = note.owner_id === user.id;
      const collaborator = note.note_collaborators?.find(
        (c: any) => c.user_id === user.id
      );
      const role = isOwner ? 'owner' : collaborator?.role ?? 'viewer';
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
