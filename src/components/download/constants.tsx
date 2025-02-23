import * as React from "react";
import { Video, Volume2 } from "lucide-react";
import { VideoFormat } from "./types";

export const formats: VideoFormat[] = [
  {
    value: "mp4",
    label: "MP4 Video",
    icon: <Video className="w-4 h-4" />,
    quality: "1080p",
  },
  {
    value: "mp4-hd",
    label: "MP4 Video HD",
    icon: <Video className="w-4 h-4" />,
    quality: "4K",
  },
  {
    value: "mp3",
    label: "MP3 Audio",
    icon: <Volume2 className="w-4 h-4" />,
    quality: "320kbps",
  },
  {
    value: "mp3-hq",
    label: "MP3 Audio HQ",
    icon: <Volume2 className="w-4 h-4" />,
    quality: "320kbps",
  },
];

export const videoPatterns = [
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
  /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/,
  /^(https?:\/\/)?(www\.)?dailymotion\.com\/.+$/,
];
