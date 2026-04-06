"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Clock, FileText } from "lucide-react";

import { useLanguage } from "@/lib/i18n/language-context";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[];
  reading_time_minutes: number | null;
  published_at: string | null;
};

type Props = {
  initialQuery?: string;
};

export function BlogSearch({ initialQuery }: Props) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const b = t.blog;
  const [query, setQuery] = useState(initialQuery ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/blog/search?q=${encodeURIComponent(value.trim())}&lang=${language}`,
            { credentials: "same-origin" }
          );
          if (!res.ok) return;
          const json = (await res.json()) as { results: SearchResult[] };
          setResults(json.results ?? []);
          setOpen(true);
        } catch {
          // ignore
        }
      });
    }, 300);
  }

  function goToFullSearch() {
    setOpen(false);
    if (query.trim()) {
      router.push(`/blog?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/blog");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToFullSearch();
  }

  function handleSelect(slug: string) {
    setOpen(false);
    router.push(`/blog/${slug}`);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push("/blog");
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all focus-within:border-[#d4af37]/50 focus-within:bg-white/8">
          <Search className="ml-4 h-4 w-4 shrink-0 text-gray-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={b.searchPlaceholder}
            className="h-12 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none"
          />
          {isPending && <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-gray-500" />}
          {query && !isPending && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
              aria-label={b.clearSearch}
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="submit"
            className="mr-2 shrink-0 rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-bold text-black transition hover:brightness-110"
          >
            {b.searchButton}
          </button>
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111518] shadow-2xl">
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result.slug)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{result.title}</p>
                  {result.excerpt && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{result.excerpt}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {result.reading_time_minutes != null && result.reading_time_minutes > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock className="h-2.5 w-2.5" />
                        {result.reading_time_minutes} {b.minRead}
                      </span>
                    )}
                    {result.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] capitalize text-[#d4af37]/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-white/5 px-4 py-2">
            <button
              type="button"
              onClick={goToFullSearch}
              className="text-xs text-gray-500 transition hover:text-white"
            >
              {b.seeAllResults} &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}

      {open && results.length === 0 && query.trim().length >= 2 && !isPending && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111518] shadow-2xl">
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            {b.noResultsFor} &ldquo;{query}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
