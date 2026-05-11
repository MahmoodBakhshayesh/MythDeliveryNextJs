import { apiJson } from "@/lib/api-client";

export type ReverseGeocodeDto = {
  latitude: number;
  longitude: number;
  displayAddress: string;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type GeocodeCandidateDto = {
  title: string;
  address?: string | null;
  latitude: number;
  longitude: number;
};

export type GeocodeSearchDto = {
  results: GeocodeCandidateDto[];
};

export const geocodingRepository = {
  reverse(latitude: number, longitude: number) {
    const q = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });
    return apiJson<ReverseGeocodeDto>(`/api/geocoding/reverse?${q}`, {
      method: "GET",
    });
  },

  search(text: string, bias?: { lat: number; lng: number }) {
    return apiJson<GeocodeSearchDto>("/api/geocoding/search", {
      method: "POST",
      body: JSON.stringify({
        text,
        latitude: bias?.lat,
        longitude: bias?.lng,
      }),
    });
  },
};
