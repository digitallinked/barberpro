"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  Scissors,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Loader2,
} from "lucide-react";
import { shopMediaDisplayUrl } from "@barberpro/db/shop-media";

const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
];

const PAGE_SIZE = 12;

type Shop = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  branches: {
    id: string;
    name: string;
    address: string | null;
    logo_url: string | null;
    latitude: number | null;
    longitude: number | null;
  }[];
};

type BranchCard = {
  key: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  logoUrl: string | null;
  branchName: string;
  branchAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  showBranchLabel: boolean;
};

type UserLocation = { lat: number; lng: number };

type Props = {
  shops: Shop[];
};

function getStateFromAddress(address: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  return MALAYSIA_STATES.find((s) => lower.includes(s.toLowerCase())) ?? null;
}

/** Haversine formula — returns distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function ShopsGrid({ shops }: Props) {
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [page, setPage] = useState(1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Flatten all shops into one card per branch
  const allCards = useMemo<BranchCard[]>(() => {
    const cards: BranchCard[] = [];
    shops.forEach((shop) => {
      const isMulti = shop.branches.length > 1;
      if (shop.branches.length === 0) {
        cards.push({
          key: shop.id,
          shopId: shop.id,
          shopName: shop.name,
          shopSlug: shop.slug,
          logoUrl: shop.logo_url,
          branchName: "",
          branchAddress: null,
          latitude: null,
          longitude: null,
          showBranchLabel: false,
        });
      } else {
        shop.branches.forEach((b) => {
          cards.push({
            key: `${shop.id}-${b.id}`,
            shopId: shop.id,
            shopName: shop.name,
            shopSlug: shop.slug,
            logoUrl: b.logo_url ?? shop.logo_url,
            branchName: b.name,
            branchAddress: b.address,
            latitude: b.latitude,
            longitude: b.longitude,
            showBranchLabel: isMulti,
          });
        });
      }
    });
    return cards;
  }, [shops]);

  // States present in the flattened cards
  const availableStates = useMemo(() => {
    const found = new Set<string>();
    allCards.forEach((c) => {
      const s = getStateFromAddress(c.branchAddress);
      if (s) found.add(s);
    });
    return MALAYSIA_STATES.filter((s) => found.has(s));
  }, [allCards]);

  const filtered = useMemo(() => {
    let result = allCards;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.shopName.toLowerCase().includes(q) ||
          c.branchName.toLowerCase().includes(q) ||
          (c.branchAddress ?? "").toLowerCase().includes(q)
      );
    }

    if (selectedState) {
      result = result.filter(
        (c) => getStateFromAddress(c.branchAddress) === selectedState
      );
    }

    // When user location is known, sort by distance (cards with no coords go last)
    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distA =
          a.latitude != null && a.longitude != null
            ? haversineKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
            : Infinity;
        const distB =
          b.latitude != null && b.longitude != null
            ? haversineKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
            : Infinity;
        return distA - distB;
      });
    }

    return result;
  }, [allCards, query, selectedState, userLocation]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasFilters = Boolean(query || selectedState);

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setPage(1);
  };
  const handleStateChange = (v: string) => {
    setSelectedState(v);
    setPage(1);
  };

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support geolocation.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPage(1);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Location access denied. Please allow location access and try again.");
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setGeoError(null);
  }, []);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl border border-border bg-card px-3.5 py-2.5 transition-all focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by shop name or area…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* State filter */}
        {availableStates.length > 0 && (
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="h-[42px] appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 text-sm text-foreground transition-all focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">All States</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}

        {/* Near Me button */}
        {userLocation ? (
          <button
            onClick={clearLocation}
            className="flex h-[42px] items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Navigation className="h-4 w-4" />
            Near Me
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={handleNearMe}
            disabled={geoLoading}
            className="flex h-[42px] items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Near Me
          </button>
        )}
      </div>

      {/* Geo error */}
      {geoError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {geoError}
        </p>
      )}

      {/* Active filter summary */}
      {(hasFilters || userLocation) && (
        <div className="mb-5 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} location{filtered.length !== 1 ? "s" : ""}
            {query && <> for &ldquo;{query}&rdquo;</>}
            {selectedState && <> in {selectedState}</>}
            {userLocation && <> sorted by distance</>}
          </span>
          {hasFilters && (
            <button
              onClick={() => {
                handleQueryChange("");
                handleStateChange("");
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grid — one card per branch */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((card) => {
          const logoSrc = card.logoUrl
            ? shopMediaDisplayUrl(card.logoUrl, { width: 240, quality: 85 })
            : null;
          const stateLabel = getStateFromAddress(card.branchAddress);
          const distance =
            userLocation && card.latitude != null && card.longitude != null
              ? haversineKm(userLocation.lat, userLocation.lng, card.latitude, card.longitude)
              : null;

          return (
            <Link
              key={card.key}
              href={`/shop/${card.shopSlug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Card header: logo + shop name + state */}
              <div className="flex items-center gap-3.5 p-5 pb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${card.shopName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Scissors className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                    {card.shopName}
                  </h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {stateLabel && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/70">
                        <MapPin className="h-3 w-3" />
                        {stateLabel}
                      </span>
                    )}
                    {distance !== null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Navigation className="h-2.5 w-2.5" />
                        {formatDistance(distance)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mx-5 border-t border-border/50" />

              {/* Body: optional branch label + address */}
              <div className="flex-1 space-y-1.5 px-5 py-3.5">
                {card.showBranchLabel && card.branchName && (
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                    {card.branchName}
                  </p>
                )}
                {card.branchAddress ? (
                  <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2">{card.branchAddress}</span>
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Address not listed
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end px-5 pb-4 pt-1">
                <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Book Now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}

        {paginated.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card py-20 text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground/30" />
            {hasFilters ? (
              <>
                <p className="mt-4 text-muted-foreground">
                  No locations found matching your filters.
                </p>
                <button
                  onClick={() => {
                    handleQueryChange("");
                    handleStateChange("");
                  }}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p className="mt-4 text-muted-foreground">
                No barbershops found yet. Check back soon!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors ${
                p === currentPage
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="ml-1 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </>
  );
}
