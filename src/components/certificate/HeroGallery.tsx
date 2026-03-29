import { useState } from "react";
import { Play, ChevronLeft, ChevronRight, Image } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface MediaItem {
  id: string;
  type: "image" | "video";
  storage_url?: string;
  embed_url?: string;
  thumbnail_url?: string;
  duration_sec?: number;
  sort_order: number;
}

interface HeroGalleryProps {
  media: MediaItem[];
}

export function HeroGallery({ media }: HeroGalleryProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-video bg-muted rounded flex items-center justify-center border border-border">
        <Image className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  const active = media[activeIndex];
  const imageCount = media.filter((m) => m.type === "image").length;
  const videoCount = media.filter((m) => m.type === "video").length;

  const prev = () => setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-2">
      {/* Main display */}
      <div className="relative w-full aspect-video bg-muted rounded border border-border overflow-hidden">
        {active.type === "video" && active.embed_url ? (
          <iframe
            src={active.embed_url}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : active.storage_url ? (
          <img
            src={active.storage_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Counter badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-white text-[11px] font-mono-data">
          {activeIndex + 1} / {media.length}
        </div>

        {/* Video badge */}
        {active.type === "video" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-primary/90 text-white text-[11px] font-mono-data">
            <Play className="w-3 h-3" />
            VIDEO
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {media.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 w-14 h-10 rounded border overflow-hidden transition-all ${
                idx === activeIndex
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="w-3 h-3 text-primary" />
                </div>
              ) : (
                <img
                  src={item.thumbnail_url || item.storage_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Media count label */}
      <p className="text-[11px] text-muted-foreground font-body">
        {imageCount > 0 && `${imageCount} ${t("photos")}`}
        {imageCount > 0 && videoCount > 0 && " · "}
        {videoCount > 0 && `${videoCount} ${t("video")}`}
      </p>
    </div>
  );
}
