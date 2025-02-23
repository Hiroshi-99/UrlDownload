import { ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

export type DownloadItem = Database["public"]["Tables"]["downloads"]["Row"] & {
  progress?: number;
  stage?: "downloading" | "processing" | "uploading" | "completed";
};

export interface VideoFormat {
  value: string;
  label: string;
  icon: ReactNode;
  quality: string;
}
