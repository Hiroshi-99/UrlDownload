import { ReactNode } from "react";
import type { Database } from "@/integrations/supabase/types";

export interface Download {
  id: string;
  status: "processing" | "completed" | "failed";
  error_message?: string;
  download_url?: string;
}

export interface VideoFormat {
  value: string;
  label: string;
  icon: ReactNode;
  quality: string;
}
