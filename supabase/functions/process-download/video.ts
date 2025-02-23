import { ytdl, type VideoFormat, type VideoInfo } from "./deps.ts";

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

async function downloadWithProgress(
  url: string,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  if (!response.body) throw new Error("Response body is null");

  const contentLength = Number(response.headers.get("Content-Length")) || 0;
  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (onProgress && contentLength) {
      const progress = (receivedLength / contentLength) * 100;
      onProgress(Math.round(progress));
    }
  }

  // Combine all chunks into a single Uint8Array
  const result = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result;
}

export async function downloadVideo(
  url: string,
  format: string,
  onProgress?: (progress: number) => void
) {
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

    // Download the video with progress
    return await downloadWithProgress(videoUrl, onProgress);
  } catch (error) {
    console.error("Error downloading video:", error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

export async function downloadAudio(
  url: string,
  onProgress?: (progress: number) => void
) {
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

    // Download the audio with progress
    return await downloadWithProgress(audioUrl, onProgress);
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw new Error(`Failed to download audio: ${error.message}`);
  }
}
