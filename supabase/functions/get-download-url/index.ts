import { serve } from "https://deno.fresh.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { downloadId } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
        .createSignedUrl(`${downloadId}/${download.filename}`, 60); // URL expires in 60 seconds

    if (signedUrlError) throw signedUrlError;

    return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
