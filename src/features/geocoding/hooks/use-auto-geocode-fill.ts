"use client";

import { useEffect, useRef } from "react";
import { geocodingRepository } from "@/features/geocoding/repositories/geocoding.repository";
import { isAppSuccess } from "@/lib/api-types";

function parseLatLng(latitude: string, longitude: string) {
  const lat = Number.parseFloat(latitude.trim());
  const lng = Number.parseFloat(longitude.trim());
  const latLngValid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return { lat, lng, latLngValid };
}

type SearchBias = { lat: number; lng: number };

/**
 * When coords are valid and address is empty → reverse geocode (fill address).
 * When address is non-empty and coords are missing/invalid → forward geocode (fill lat/lng).
 */
export function useAutoGeocodeFill({
  latitude,
  longitude,
  addressLine1,
  setLatitude,
  setLongitude,
  setAddressLine1,
  enabled,
  debounceMs = 450,
  searchBias = null,
}: {
  latitude: string;
  longitude: string;
  addressLine1: string;
  setLatitude: (v: string) => void;
  setLongitude: (v: string) => void;
  setAddressLine1: (v: string) => void;
  enabled: boolean;
  debounceMs?: number;
  searchBias?: SearchBias | null;
}) {
  const seq = useRef(0);
  const latStrRef = useRef(latitude);
  const lngStrRef = useRef(longitude);
  const addrStrRef = useRef(addressLine1);
  latStrRef.current = latitude;
  lngStrRef.current = longitude;
  addrStrRef.current = addressLine1;

  const biasLatRef = useRef<number | undefined>(undefined);
  const biasLngRef = useRef<number | undefined>(undefined);
  biasLatRef.current = searchBias?.lat;
  biasLngRef.current = searchBias?.lng;

  useEffect(() => {
    if (!enabled) return;

    const id = ++seq.current;
    const timer = window.setTimeout(async () => {
      if (seq.current !== id) return;

      const { lat, lng, latLngValid } = parseLatLng(
        latStrRef.current,
        lngStrRef.current,
      );
      const addr = addrStrRef.current.trim();

      const wantReverse = latLngValid && addr.length === 0;
      const wantForward = addr.length > 0 && !latLngValid;

      if (!wantReverse && !wantForward) return;

      try {
        if (wantReverse) {
          const res = await geocodingRepository.reverse(lat, lng);
          if (seq.current !== id) return;
          if (!isAppSuccess(res) || !res.body?.displayAddress?.trim()) return;
          if (addrStrRef.current.trim().length > 0) return;
          setAddressLine1(res.body.displayAddress.trim());
          return;
        }

        const bias =
          biasLatRef.current !== undefined &&
          biasLngRef.current !== undefined &&
          Number.isFinite(biasLatRef.current) &&
          Number.isFinite(biasLngRef.current)
            ? { lat: biasLatRef.current, lng: biasLngRef.current }
            : undefined;

        const res = await geocodingRepository.search(addr, bias);
        if (seq.current !== id) return;
        if (!isAppSuccess(res) || !res.body?.results?.[0]) return;
        if (addrStrRef.current.trim() !== addr) return;

        const { latLngValid: stillValid } = parseLatLng(
          latStrRef.current,
          lngStrRef.current,
        );
        if (stillValid) return;

        const first = res.body.results[0];
        setLatitude(String(first.latitude));
        setLongitude(String(first.longitude));
      } catch {
        /* ignore while typing */
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [
    latitude,
    longitude,
    addressLine1,
    enabled,
    debounceMs,
    searchBias?.lat,
    searchBias?.lng,
    setLatitude,
    setLongitude,
    setAddressLine1,
  ]);
}
