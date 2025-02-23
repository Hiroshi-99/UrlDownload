import type { VideoFormat, VideoInfo } from "https://esm.sh/ytdl-core@4.11.5";
import ytdl from "https://esm.sh/ytdl-core@4.11.5";

interface VimeoFormat {
  quality: string;
  url: string;
}

interface DailymotionQuality {
  [key: string]: Array<{ url: string }>;
}

async function getVimeoInfo(url: string): Promise<VimeoFormat[]> {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  if (!videoId) throw new Error("Invalid Vimeo URL");

  const response = await fetch(
    `https://player.vimeo.com/video/${videoId}/config`
  );
  const data = await response.json();
  return data.request.files.progressive;
}

async function getDailymotionInfo(url: string): Promise<DailymotionQuality> {
  const videoId = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/)?.[1];
  if (!videoId) throw new Error("Invalid Dailymotion URL");

  const response = await fetch(
    `https://www.dailymotion.com/player/metadata/video/${videoId}`
  );
  const data = await response.json();
  return data.qualities;
}

export async function downloadVideo(url: string, format: string) {
  try {
    let videoUrl: string;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const info = await ytdl.getInfo(url);
      const videoFormat = format.includes("hd")
        ? ytdl.chooseFormat(info.formats, { quality: "highestvideo" })
        : ytdl.chooseFormat(info.formats, { quality: "highest" });
      videoUrl = videoFormat.url;
    } else if (url.includes("vimeo.com")) {
      const formats = await getVimeoInfo(url);
      const videoFormat = format.includes("hd")
        ? formats.find((f) => f.quality === "1080p") || formats[0]
        : formats.find((f) => f.quality === "720p") || formats[0];
      videoUrl = videoFormat.url;
    } else if (url.includes("dailymotion.com")) {
      const qualities = await getDailymotionInfo(url);
      const quality = format.includes("hd") ? "1080" : "720";
      videoUrl = qualities[quality]?.[0]?.url || qualities["720"][0].url;
    } else {
      throw new Error("Unsupported video platform");
    }

    // Download the video
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Error downloading video:", error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

export async function downloadAudio(url: string) {
  try {
    let audioUrl: string;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const info = await ytdl.getInfo(url);
      const audioFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      });
      audioUrl = audioFormat.url;
    } else if (url.includes("vimeo.com")) {
      const formats = await getVimeoInfo(url);
      // Vimeo doesn't provide audio-only streams, use lowest quality video
      audioUrl = formats[formats.length - 1].url;
    } else if (url.includes("dailymotion.com")) {
      const qualities = await getDailymotionInfo(url);
      // Use lowest quality for audio extraction
      audioUrl = qualities["240"][0].url;
    } else {
      throw new Error("Unsupported platform");
    }

    // Download the audio
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw new Error(`Failed to download audio: ${error.message}`);
  }
}
