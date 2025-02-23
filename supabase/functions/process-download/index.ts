
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, format } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a new download record
    const { data: download, error: insertError } = await supabase
      .from('downloads')
      .insert({
        url,
        format,
        status: 'processing'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting download:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create download record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Here we would typically process the video
    // For now, we'll simulate processing by updating the status after a delay
    setTimeout(async () => {
      const { error: updateError } = await supabase
        .from('downloads')
        .update({ 
          status: 'completed',
          file_path: `downloads/${download.id}.${format}`
        })
        .eq('id', download.id)

      if (updateError) {
        console.error('Error updating download status:', updateError)
      }
    }, 2000)

    return new Response(
      JSON.stringify({ 
        message: 'Download started',
        id: download.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
