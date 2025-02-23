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

export const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const validateURL = (url: string) => {
    return videoPatterns.some((pattern) => pattern.test(url));
  };

  const handleDownload = async (downloadId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-download-url",
        {
          body: { downloadId },
        }
      );

      if (error) throw error;
      if (!data?.url) throw new Error("No download URL received");

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = data.url;
      link.setAttribute("download", ""); // This will keep the original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
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
      setProgress(0);
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
          .select("id, status, error_message, download_url")
          .eq("id", data.id)
          .maybeSingle();

        if (downloadError) {
          clearInterval(checkProgress);
          setLoading(false);
          toast({
            title: "Error",
            description: "Failed to check download status",
            variant: "destructive",
          });
          return;
        }

        const download = downloadData as DownloadItem;

        if (download) {
          if (download.status === "completed") {
            setProgress(100);
            clearInterval(checkProgress);
            setLoading(false);
            setDownloadUrl(download.id); // Store the download ID
            toast({
              title: "Success!",
              description: "Your download is ready",
            });
            // Automatically trigger download
            await handleDownload(download.id);
          } else if (download.status === "failed") {
            clearInterval(checkProgress);
            setLoading(false);
            toast({
              title: "Error",
              description: download.error_message || "Download failed",
              variant: "destructive",
            });
          } else {
            setProgress((prev) => Math.min(prev + 10, 90));
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
      setProgress(0);
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

      {loading && <DownloadProgress progress={progress} />}
    </form>
  );
};
