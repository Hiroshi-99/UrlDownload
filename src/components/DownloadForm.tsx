
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FormatSelector } from "./download/FormatSelector";
import { DownloadProgress } from "./download/DownloadProgress";
import { Download } from "./download/types";
import { videoPatterns } from "./download/constants";

export const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateURL = (url: string) => {
    return videoPatterns.some(pattern => pattern.test(url));
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

      const { data, error } = await supabase.functions.invoke('process-download', {
        body: { url, format }
      });

      if (error) {
        throw error;
      }

      // Set up progress monitoring
      const checkProgress = setInterval(async () => {
        const { data: downloadData, error: downloadError } = await supabase
          .from('downloads')
          .select('id, status, error_message')
          .eq('id', data.id)
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

        const download = downloadData as Download;

        if (download) {
          if (download.status === 'completed') {
            setProgress(100);
            clearInterval(checkProgress);
            setLoading(false);
            toast({
              title: "Success!",
              description: "Your download is ready",
            });
          } else if (download.status === 'failed') {
            clearInterval(checkProgress);
            setLoading(false);
            toast({
              title: "Error",
              description: download.error_message || "Download failed",
              variant: "destructive",
            });
          } else {
            // Update progress for processing state
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

        <Button 
          type="submit" 
          className="flex-1 h-12 bg-primary hover:bg-primary/90" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {loading ? "Processing..." : "Download"}
        </Button>
      </div>

      {loading && <DownloadProgress progress={progress} />}
    </form>
  );
};
