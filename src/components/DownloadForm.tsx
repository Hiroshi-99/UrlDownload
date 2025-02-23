
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Volume2 } from "lucide-react";

interface VideoFormat {
  value: string;
  label: string;
  icon: React.ReactNode;
  quality: string;
}

const formats: VideoFormat[] = [
  { value: "mp4", label: "MP4 Video", icon: <Video className="w-4 h-4" />, quality: "1080p" },
  { value: "mp4-hd", label: "MP4 Video HD", icon: <Video className="w-4 h-4" />, quality: "4K" },
  { value: "mp3", label: "MP3 Audio", icon: <Volume2 className="w-4 h-4" />, quality: "320kbps" },
  { value: "mp3-hq", label: "MP3 Audio HQ", icon: <Volume2 className="w-4 h-4" />, quality: "320kbps" },
];

export const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateURL = (url: string) => {
    const videoPatterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/,
      /^(https?:\/\/)?(www\.)?dailymotion\.com\/.+$/,
    ];

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

      // Simulate download process with realistic progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Add some randomness to make it feel more realistic
          const increment = Math.random() * 15 + 5;
          return Math.min(prev + increment, 100);
        });
      }, 500);

      // Simulate processing time based on format
      const processingTime = format.includes('hd') || format.includes('hq') ? 7000 : 5000;

      // Reset after "download" completion
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        clearInterval(interval);
        toast({
          title: "Download Complete!",
          description: `Your ${format.toUpperCase()} file has been processed successfully.`,
        });
      }, processingTime);
    } catch (error) {
      toast({
        title: "Processing Error",
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
        <Select
          value={format}
          onValueChange={setFormat}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px] glass-effect border-none">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {formats.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                <div className="flex items-center gap-2">
                  {format.icon}
                  <span>{format.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {format.quality}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {loading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {progress < 100 ? "Processing your download..." : "Almost done..."}
          </p>
        </div>
      )}
    </form>
  );
};
