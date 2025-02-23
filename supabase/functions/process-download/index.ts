import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { url, format } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}.${format}`;
    const filePath = `${format}/${filename}`; // Simplified path structure

    // Create a new download record
    const { data: download, error: insertError } = await supabase
      .from("downloads")
      .insert({
        url,
        format,
        status: "processing",
        file_path: filePath,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting download:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create download record" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Simulate processing and upload a dummy file
    setTimeout(async () => {
      try {
        // Create a dummy file content (in real app, this would be the processed video/audio)
        const dummyContent = new Uint8Array([1, 2, 3, 4, 5]);

        // Upload the file to storage
        const { error: uploadError } = await supabase.storage
          .from("downloads")
          .upload(filePath, dummyContent, {
            contentType: format.startsWith("mp4") ? "video/mp4" : "audio/mpeg",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Update status to completed
        const { error: updateError } = await supabase
          .from("downloads")
          .update({ status: "completed" })
          .eq("id", download.id);

        if (updateError) {
          throw updateError;
        }
      } catch (error) {
        console.error("Error in processing:", error);
        await supabase
          .from("downloads")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("id", download.id);
      }
    }, 2000);

    return new Response(JSON.stringify({ id: download.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
