import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  try {
    const { id, content } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Note id required' }), {
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    /**
     * Fetch note + permission + version
     */
    const { data: note, error: noteError } = await admin
      .from('notes')
      .select(`
        id,
        owner_id,
        version,
        note_collaborators (
          user_id,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (noteError || !note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
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
      });
    }

    const nextVersion = (note.version || 1) + 1;

    /**
     * Update note
     */
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
      });
    }

    /**
     * Snapshot only if changed
     */
    const { data: latestVersion } = await admin
      .from('note_versions')
      .select('content')
      .eq('note_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion?.content !== content) {
      await admin.from('note_versions').insert({
        note_id: id,
        content,
        created_by: user.id,
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Updated',
        version: nextVersion,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500 }
    );
  }
});