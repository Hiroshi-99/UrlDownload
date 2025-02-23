
import { Progress } from "@/components/ui/progress";

interface DownloadProgressProps {
  progress: number;
}

export const DownloadProgress = ({ progress }: DownloadProgressProps) => {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2 w-full" />
      <p className="text-sm text-center text-muted-foreground">
        {progress < 100 ? "Processing your download..." : "Almost done..."}
      </p>
    </div>
  );
};
