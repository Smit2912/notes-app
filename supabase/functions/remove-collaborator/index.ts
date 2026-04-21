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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
      });
    }

    const { note_id, user_id } = body;

    if (!note_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing note_id or user_id' }),
        {
          status: 400,
        }
      );
    }

    // 🔍 Fetch note to check ownership
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('owner_id')
      .eq('id', note_id)
      .single();

    if (noteError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
      });
    }

    const isOwner = note.owner_id === user.id;
    const isSelf = user.id === user_id;

    // 🚫 Authorization check
    if (!isOwner && !isSelf) {
      return new Response(
        JSON.stringify({ error: 'Not allowed to remove this collaborator' }),
        { status: 403 }
      );
    }

    // 🚫 Prevent owner from removing themselves (optional but recommended)
    if (isOwner && isSelf) {
      return new Response(
        JSON.stringify({ error: 'Owner cannot remove themselves' }),
        { status: 400 }
      );
    }

    // 🔍 Check if collaborator exists
    const { data: existing } = await supabaseAdmin
      .from('note_collaborators')
      .select('id')
      .eq('note_id', note_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Collaborator not found' }), {
        status: 404,
      });
    }

    // ✅ Delete collaborator
    const { error } = await supabaseAdmin
      .from('note_collaborators')
      .delete()
      .eq('note_id', note_id)
      .eq('user_id', user_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({ message: 'Collaborator removed successfully' }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
