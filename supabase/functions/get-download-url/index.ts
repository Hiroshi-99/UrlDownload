import { serve } from "https://deno.fresh.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { downloadId } = await req.json();

    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Use service role key instead of anon key
    );

    // Get the download record
    const { data: download, error: downloadError } = await supabaseClient
      .from("downloads")
      .select("*")
      .eq("id", downloadId)
      .single();

    if (downloadError) throw downloadError;
    if (!download) throw new Error("Download not found");

    // Generate a signed URL for the file
    const { data: signedUrl, error: signedUrlError } =
      await supabaseClient.storage
        .from("downloads")
        .createSignedUrl(`${download.file_path}`, 60); // Use file_path from the database

    if (signedUrlError) throw signedUrlError;

    return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
