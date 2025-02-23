
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
import { Loader2 } from "lucide-react";

export const DownloadForm = () => {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Simulate progress for now
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Reset after "download"
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        clearInterval(interval);
        toast({
          title: "Success!",
          description: "Your download will begin shortly.",
        });
      }, 5000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Paste your video URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 glass-effect border-none"
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
            <SelectItem value="mp4">MP4 Video</SelectItem>
            <SelectItem value="mp3">MP3 Audio</SelectItem>
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
        <Progress value={progress} className="h-2 w-full" />
      )}
    </form>
  );
};
