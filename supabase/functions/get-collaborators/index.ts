import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  try {
    // 🔐 User client (for auth)
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

    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
      });
    }

    const { note_id } = body;

    if (!note_id) {
      return new Response(JSON.stringify({ error: 'Missing note_id' }), {
        status: 400,
      });
    }

    // 🔍 Validate ownership OR collaboration
    const { data: note } = await supabaseAdmin
      .from('notes')
      .select('owner_id')
      .eq('id', note_id)
      .single();

    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
      });
    }

    const isOwner = note.owner_id === user.id;

    let isCollaborator = false;

    if (!isOwner) {
      const { data: collab } = await supabaseAdmin
        .from('note_collaborators')
        .select('id')
        .eq('note_id', note_id)
        .eq('user_id', user.id)
        .maybeSingle();

      isCollaborator = !!collab;
    }

    if (!isOwner && !isCollaborator) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to view collaborators' }),
        { status: 403 }
      );
    }

    // ✅ Fetch collaborators
    const { data, error } = await supabaseAdmin
      .from('note_collaborators')
      .select(
        `
          id,
          role,
          user_id,
          profiles (
            email
          )
        `
      )
      .eq('note_id', note_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    // Fetch owner profile
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', note.owner_id)
      .single();

    const owner = {
      id: 'owner',
      role: 'owner',
      user_id: note.owner_id,
      profiles: {
        email: ownerProfile?.email || 'Owner',
      },
    };

    return new Response(JSON.stringify([owner, ...(data || [])]), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
