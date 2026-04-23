import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { id, content, version } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Note id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: note, error: noteError } = await admin
      .from('notes')
      .select('id, content, owner_id, version, note_collaborators(user_id, role)')
      .eq('id', id)
      .single();

    if (noteError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isOwner = note.owner_id === user.id;
    const collaborator = note.note_collaborators?.find(
      (c: any) => c.user_id === user.id
    );
    const canEdit = isOwner || collaborator?.role === 'editor';

    if (!canEdit) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Version Check for Conflict Detection
    if (version !== undefined && version !== note.version) {
      return new Response(
        JSON.stringify({
          error: 'Conflict',
          message: 'Stale version detected. Someone else might have updated this note.',
          remoteContent: note.content,
          remoteVersion: note.version,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const nextVersion = (note.version || 1) + 1;

    const { error: updateError } = await admin
      .from('notes')
      .update({
        content,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: latestVersion } = await admin
      .from('note_versions')
      .select('content')
      .eq('note_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion?.content !== content) {
      await admin
        .from('note_versions')
        .insert({ note_id: id, content, created_by: user.id });
    }

    return new Response(
      JSON.stringify({ message: 'Updated', version: nextVersion }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
