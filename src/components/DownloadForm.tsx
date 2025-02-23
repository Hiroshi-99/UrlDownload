import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FormatSelector } from "./download/FormatSelector";
import { DownloadProgress } from "./download/DownloadProgress";
import { DownloadItem } from "./download/types";
import { videoPatterns } from "./download/constants";

interface ProgressState {
  percent: number;
  stage: "downloading" | "processing" | "uploading" | "completed";
}

export const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>({
    percent: 0,
    stage: "downloading",
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const validateURL = (url: string) => {
    return videoPatterns.some((pattern) => pattern.test(url));
  };

  const handleDownload = async (downloadId: string) => {
    try {
      // Get the download record
      const { data: download, error: downloadError } = await supabase
        .from("downloads")
        .select("file_path, format")
        .eq("id", downloadId)
        .single();

      if (downloadError) throw downloadError;
      if (!download?.file_path) throw new Error("File path not found");

      // Get a signed URL directly from storage
      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from("downloads")
        .createSignedUrl(download.file_path, 60);

      if (signedUrlError) throw signedUrlError;
      if (!signedUrl?.signedUrl)
        throw new Error("Failed to generate download URL");

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = signedUrl.signedUrl;
      link.setAttribute("download", `download.${download.format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateURL(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube, Vimeo, or Dailymotion URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setProgressState({ percent: 0, stage: "downloading" });
      setDownloadUrl(null);

      const { data, error } = await supabase.functions.invoke(
        "process-download",
        {
          body: { url, format },
        }
      );

      if (error) throw error;

      // Set up progress monitoring
      const checkProgress = setInterval(async () => {
        const { data: downloadData, error: downloadError } = await supabase
          .from("downloads")
          .select("id, status, error_message, file_path, progress, stage")
          .eq("id", data.id)
          .single();

        if (downloadError) {
          clearInterval(checkProgress);
          setLoading(false);
          console.error("Download error:", downloadError);
          toast({
            title: "Error",
            description: "Failed to check download status",
            variant: "destructive",
          });
          return;
        }

        const download = downloadData as DownloadItem;

        if (download) {
          setProgressState({
            percent: download.progress || 0,
            stage: download.stage || "downloading",
          });

          if (download.status === "completed") {
            setProgressState({ percent: 100, stage: "completed" });
            clearInterval(checkProgress);
            setLoading(false);
            setDownloadUrl(download.id);
            toast({
              title: "Success!",
              description: "Your download is ready",
            });
            await handleDownload(download.id);
          } else if (download.status === "failed") {
            clearInterval(checkProgress);
            setLoading(false);
            toast({
              title: "Error",
              description: download.error_message || "Download failed",
              variant: "destructive",
            });
          }
        }
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      setProgressState({ percent: 0, stage: "downloading" });
    }
  };

  // Helper function to get progress message
  const getProgressMessage = (state: ProgressState) => {
    switch (state.stage) {
      case "downloading":
        return `Downloading video... ${state.percent}%`;
      case "processing":
        return `Processing your download... ${state.percent}%`;
      case "uploading":
        return `Preparing download... ${state.percent}%`;
      case "completed":
        return "Download ready!";
      default:
        return `Processing... ${state.percent}%`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Paste your video URL here (YouTube, Vimeo, Dailymotion)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 glass-effect border-none"
          disabled={loading}
        />
      </div>

      <div className="flex gap-4">
        <FormatSelector
          value={format}
          onValueChange={setFormat}
          disabled={loading}
        />

        {downloadUrl ? (
          <Button
            type="button"
            className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            onClick={() => handleDownload(downloadUrl)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Again
          </Button>
        ) : (
          <Button
            type="submit"
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Processing..." : "Download"}
          </Button>
        )}
      </div>

      {loading && (
        <DownloadProgress
          progress={progressState.percent}
          message={getProgressMessage(progressState)}
        />
      )}
    </form>
  );
};
