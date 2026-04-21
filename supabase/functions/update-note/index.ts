import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
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

    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
      });
    }

    const { id, title, content } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
      });
    }

    if (!title?.trim() || !content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing title or content' }),
        {
          status: 400,
        }
      );
    }

    console.log('User:', user.id, 'Updating note:', id);

    const { data, error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', id)
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Note not found' }), {
        status: 404,
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
