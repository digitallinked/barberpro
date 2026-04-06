"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Store, ArrowRight, Scissors, Search, X } from "lucide-react";

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/shop-media";

type Shop = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  branches: { id: string; name: string; address: string | null }[];
};

type Props = {
  shops: Shop[];
};

export function ShopsGrid({ shops }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? shops.filter((s) => {
        const q = query.toLowerCase();
        if (s.name.toLowerCase().includes(q)) return true;
        return s.branches.some((b) =>
          (b.address ?? "").toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q)
        );
      })
    : shops;

  return (
    <>
      {/* Search bar */}
      <div className="mb-8 flex max-w-sm items-center gap-2 overflow-hidden rounded-xl border border-border bg-card px-3.5 py-2.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by shop name or area…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Result count when searching */}
      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tenant) => {
          const primaryBranch = tenant.branches[0];
          const logoSrc = tenant.logo_url ? `${STORAGE_URL}/${tenant.logo_url}` : null;

          return (
            <Link
              key={tenant.id}
              href={`/shop/${tenant.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={`${tenant.name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Scissors className="h-5 w-5 text-primary" />
                )}
              </div>

              <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
                {tenant.name}
              </h3>

              {primaryBranch && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">{primaryBranch.address || "Address not listed"}</span>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Store className="h-3.5 w-3.5" />
                  {tenant.branches.length} {tenant.branches.length === 1 ? "branch" : "branches"}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Book Now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card py-20 text-center">
            <Store className="mx-auto h-12 w-12 text-muted-foreground/30" />
            {query ? (
              <>
                <p className="mt-4 text-muted-foreground">No shops found for &ldquo;{query}&rdquo;</p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <p className="mt-4 text-muted-foreground">No barbershops found yet. Check back soon!</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
