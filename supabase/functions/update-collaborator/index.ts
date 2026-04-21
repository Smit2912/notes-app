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

    const { note_id, user_id, role } = body;

    if (!note_id || !user_id || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing note_id, user_id, or role' }),
        {
          status: 400,
        }
      );
    }

    if (!['viewer', 'editor'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
      });
    }

    // 🚫 Prevent owner from updating themselves
    if (user.id === user_id) {
      return new Response(
        JSON.stringify({ error: 'Owner role cannot be modified' }),
        { status: 400 }
      );
    }

    // 🔍 Validate note ownership
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('id, owner_id')
      .eq('id', note_id)
      .single();

    if (noteError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
      });
    }

    if (note.owner_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: 'Only the owner can update collaborator roles',
        }),
        { status: 403 }
      );
    }

    // 🔍 Check collaborator exists
    const { data: existing } = await supabaseAdmin
      .from('note_collaborators')
      .select('id, role')
      .eq('note_id', note_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Collaborator not found' }), {
        status: 404,
      });
    }

    // 🚫 Prevent unnecessary updates
    if (existing.role === role) {
      return new Response(
        JSON.stringify({ error: 'Role is already set to this value' }),
        { status: 400 }
      );
    }

    // ✅ Update collaborator role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('note_collaborators')
      .update({ role })
      .eq('note_id', note_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
