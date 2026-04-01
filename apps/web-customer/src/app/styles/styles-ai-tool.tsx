"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  Download,
  ImagePlus,
  RotateCcw,
  Scissors,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

const STYLE_CATEGORIES = [
  { id: "fade", label: "Fade" },
  { id: "textured", label: "Textured" },
  { id: "undercut", label: "Undercut" },
  { id: "slickback", label: "Slick Back" },
  { id: "curly", label: "Curly" },
  { id: "classic", label: "Classic" },
] as const;

const INSPIRATION_STYLES = [
  {
    id: 1,
    label: "Low Fade + Textured Top",
    category: "fade",
    gradient: "from-zinc-800 to-zinc-700",
    icon: "✂️",
  },
  {
    id: 2,
    label: "High Fade + Slick Back",
    category: "fade",
    gradient: "from-stone-800 to-stone-700",
    icon: "💈",
  },
  {
    id: 3,
    label: "Undercut + Pompadour",
    category: "undercut",
    gradient: "from-neutral-800 to-neutral-700",
    icon: "👑",
  },
  {
    id: 4,
    label: "Buzz Cut + Line Up",
    category: "fade",
    gradient: "from-gray-800 to-gray-700",
    icon: "⚡",
  },
  {
    id: 5,
    label: "Curly Fringe",
    category: "curly",
    gradient: "from-zinc-700 to-zinc-600",
    icon: "🌀",
  },
  {
    id: 6,
    label: "Classic Side Part",
    category: "classic",
    gradient: "from-stone-700 to-stone-600",
    icon: "🎩",
  },
];

type Category = (typeof STYLE_CATEGORIES)[number]["id"] | "all";

export function StylesAiTool() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
    setGenerated(false);
    setSelectedStyle(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleGenerate() {
    if (!photo || selectedStyle === null) return;
    setGenerating(true);
    // Simulate AI processing — replace with real API call
    await new Promise((r) => setTimeout(r, 2200));
    setGenerating(false);
    setGenerated(true);
  }

  function handleReset() {
    setPhoto(null);
    setGenerated(false);
    setSelectedStyle(null);
    setGenerating(false);
  }

  const filtered =
    activeCategory === "all"
      ? INSPIRATION_STYLES
      : INSPIRATION_STYLES.filter((s) => s.category === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/15">
          <Sparkles className="h-5 w-5 text-[#d4af37]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Haircut Styler</h1>
          <p className="text-sm text-gray-500">
            Upload your photo · pick a style · show your barber
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#d4af37] sm:flex">
          <Scissors className="h-3 w-3" />
          Plus Member
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload + result */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161a1f]"
          >
            {photo ? (
              <div className="relative">
                <Image
                  src={photo}
                  alt="Your photo"
                  width={600}
                  height={400}
                  className="h-72 w-full object-cover"
                />
                {generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0c0f]/80 backdrop-blur-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d4af37]/20">
                      <Wand2 className="h-6 w-6 animate-pulse text-[#d4af37]" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Applying style…
                    </p>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-[#d4af37]" />
                    </div>
                  </div>
                )}
                {generated && (
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20">
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3 py-1.5 text-xs font-bold text-black transition hover:brightness-110">
                      <Download className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-72 w-full flex-col items-center justify-center gap-4 text-gray-500 transition hover:text-gray-300"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
                  <ImagePlus className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-300">
                    Upload your photo
                  </p>
                  <p className="mt-1 text-xs">
                    Drag &amp; drop or click · JPG, PNG, WEBP
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {!photo ? (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  <Camera className="h-4 w-4" />
                  Take Selfie
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-gray-400 transition hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={selectedStyle === null || generating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-3 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Wand2 className="h-4 w-4" />
                  {generating ? "Generating…" : "Apply Style"}
                </button>
              </>
            )}
          </div>

          {photo && selectedStyle === null && (
            <p className="text-center text-xs text-amber-500/80">
              ← Pick a style from the list to get started
            </p>
          )}
        </div>

        {/* Right: Style selector */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Style Gallery</p>
            <span className="text-xs text-gray-500">
              {filtered.length} styles
            </span>
          </div>

          {/* Category filter */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeCategory === "all"
                  ? "bg-[#d4af37] text-black"
                  : "border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
            {STYLE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeCategory === cat.id
                    ? "bg-[#d4af37] text-black"
                    : "border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Style grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id)}
                className={`group relative overflow-hidden rounded-xl border text-left transition ${
                  selectedStyle === style.id
                    ? "border-[#d4af37] ring-1 ring-[#d4af37]/50"
                    : "border-white/5 hover:border-white/20"
                }`}
              >
                {/* Style visual placeholder */}
                <div
                  className={`flex h-28 items-center justify-center bg-gradient-to-br ${style.gradient}`}
                >
                  <span className="text-3xl">{style.icon}</span>
                </div>
                <div className="bg-[#161a1f] p-2.5">
                  <p className="text-[11px] font-semibold leading-tight text-gray-200">
                    {style.label}
                  </p>
                </div>
                {selectedStyle === style.id && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37]">
                    <span className="text-[9px] font-black text-black">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            More styles coming soon · AI generation powered by BarberPro
          </p>
        </div>
      </div>
    </div>
  );
}
