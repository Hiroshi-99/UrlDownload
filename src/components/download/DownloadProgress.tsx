import { Progress } from "@/components/ui/progress";

interface DownloadProgressProps {
  progress: number;
  message: string;
}

export const DownloadProgress = ({
  progress,
  message,
}: DownloadProgressProps) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>{message}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
