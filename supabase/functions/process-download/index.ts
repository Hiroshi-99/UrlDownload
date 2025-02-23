import { serve, createClient, type SupabaseClient } from "./deps.ts";
import { downloadVideo, downloadAudio } from "./video.ts";

interface CorsHeaders {
  [key: string]: string;
}

interface RequestBody {
  url: string;
  format: string;
}

const corsHeaders: CorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Create a dummy MP4 file content (minimal valid MP4 header)
const createDummyMP4 = () => {
  // MP4 file structure (simplified)
  const header = new Uint8Array([
    0x00,
    0x00,
    0x00,
    0x20, // size
    0x66,
    0x74,
    0x79,
    0x70, // ftyp
    0x69,
    0x73,
    0x6f,
    0x6d, // isom
    0x00,
    0x00,
    0x02,
    0x00, // minor version
    0x69,
    0x73,
    0x6f,
    0x6d, // isom
    0x69,
    0x73,
    0x6f,
    0x32, // iso2
    0x61,
    0x76,
    0x63,
    0x31, // avc1
    0x6d,
    0x70,
    0x34,
    0x31, // mp41
  ]);

  const moov = new Uint8Array([
    0x00,
    0x00,
    0x00,
    0x08, // size
    0x6d,
    0x6f,
    0x6f,
    0x76, // moov
  ]);

  // Combine the chunks
  const file = new Uint8Array(header.length + moov.length);
  file.set(header);
  file.set(moov, header.length);
  return file;
};

// Create a dummy MP3 file content (minimal valid MP3 header)
const createDummyMP3 = () => {
  // MP3 file structure (simplified)
  const header = new Uint8Array([
    0xff,
    0xfb,
    0x90,
    0x64, // MPEG-1 Layer 3
    0x00,
    0x00,
    0x00,
    0x00, // Some audio data
    0x54,
    0x41,
    0x47,
    0x00, // ID3 tag
  ]);
  return header;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, format } = (await req.json()) as RequestBody;

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    ) as SupabaseClient;

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}.${format}`;
    const filePath = `${format}/${filename}`;

    // Create a new download record
    const { data: download, error: insertError } = await supabase
      .from("downloads")
      .insert({
        url,
        format,
        status: "processing",
        file_path: filePath,
        progress: 0,
        stage: "downloading",
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

    // Process video in background
    setTimeout(async () => {
      try {
        // Download and process based on format
        const data = format.includes("mp3")
          ? await downloadAudio(url, async (progress) => {
              await supabase
                .from("downloads")
                .update({ progress, stage: "downloading" })
                .eq("id", download.id);
            })
          : await downloadVideo(url, format, async (progress) => {
              await supabase
                .from("downloads")
                .update({ progress, stage: "downloading" })
                .eq("id", download.id);
            });

        // Update stage to processing
        await supabase
          .from("downloads")
          .update({ stage: "processing", progress: 0 })
          .eq("id", download.id);

        // Simulate processing time (remove this in production)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update stage to uploading
        await supabase
          .from("downloads")
          .update({ stage: "uploading", progress: 0 })
          .eq("id", download.id);

        // Upload the processed file
        const { error: uploadError } = await supabase.storage
          .from("downloads")
          .upload(filePath, data, {
            contentType: format.includes("mp3") ? "audio/mpeg" : "video/mp4",
            upsert: true,
            onUploadProgress: async (progress) => {
              const percent = Math.round(
                (progress.loaded / progress.total) * 100
              );
              await supabase
                .from("downloads")
                .update({ progress: percent })
                .eq("id", download.id);
            },
          });

        if (uploadError) throw uploadError;

        // Update status to completed
        const { error: updateError } = await supabase
          .from("downloads")
          .update({
            status: "completed",
            stage: "completed",
            progress: 100,
          })
          .eq("id", download.id);

        if (updateError) throw updateError;
      } catch (error) {
        console.error("Error in processing:", error);
        await supabase
          .from("downloads")
          .update({
            status: "failed",
            error_message: error.message,
            progress: 0,
          })
          .eq("id", download.id);
      }
    }, 0);

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
