"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, Loader2 } from "lucide-react";

type Props = {
  /** Default address value (for edit forms) */
  defaultValue?: string;
  /** Default latitude (for edit forms) */
  defaultLat?: number | null;
  /** Default longitude (for edit forms) */
  defaultLng?: number | null;
  placeholder?: string;
  className?: string;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function PlacesAutocomplete({
  defaultValue = "",
  defaultLat = null,
  defaultLng = null,
  placeholder = "Start typing an address…",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    if (!API_KEY) {
      setNoKey(true);
      return;
    }

    // Loader v2: configure options, then use the standalone importLibrary function
    new Loader({ apiKey: API_KEY, version: "weekly" });

    importLibrary("places").then((placesLib) => {
      if (!inputRef.current) return;

      const { Autocomplete } = placesLib as typeof google.maps.places;

      const autocomplete = new Autocomplete(inputRef.current, {
        componentRestrictions: { country: "my" },
        fields: ["formatted_address", "geometry"],
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        if (inputRef.current) {
          inputRef.current.value = place.formatted_address ?? inputRef.current.value;
        }
        if (latRef.current) {
          latRef.current.value = String(place.geometry.location.lat());
        }
        if (lngRef.current) {
          lngRef.current.value = String(place.geometry.location.lng());
        }
      });

      setReady(true);
    });
  }, []);

  if (noKey) {
    // Graceful fallback: plain text input when no API key is configured
    return (
      <input
        name="address"
        defaultValue={defaultValue}
        placeholder="Full address (Google Maps not configured)"
        className={className}
      />
    );
  }

  return (
    <>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          ref={inputRef}
          name="address"
          defaultValue={defaultValue}
          placeholder={ready ? placeholder : "Loading…"}
          disabled={!ready && !noKey}
          autoComplete="off"
          className={`pl-9 ${className ?? ""}`}
        />
        {!ready && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
        )}
      </div>
      {/* Hidden inputs carry lat/lng through the form submission */}
      <input ref={latRef} type="hidden" name="latitude" defaultValue={defaultLat ?? ""} />
      <input ref={lngRef} type="hidden" name="longitude" defaultValue={defaultLng ?? ""} />
    </>
  );
}
