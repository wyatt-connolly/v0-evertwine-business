import { GeoPoint } from "firebase/firestore"

// Simple client-side geocoding function (requires Google Maps to be loaded externally)
export function geocodeToGeoPoint(address: string): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.google?.maps?.Geocoder) {
      return reject(new Error("Google Maps JS API not loaded."))
    }

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location
        // location.lat() and location.lng() are functions in legacy API
        const lat = typeof location.lat === "function" ? location.lat() : location.lat
        const lng = typeof location.lng === "function" ? location.lng() : location.lng

        console.log(`Geocoded "${address}" to lat: ${lat}, lng: ${lng}`)
        resolve(new GeoPoint(lat, lng))
      } else {
        reject(new Error(`Geocoding failed: ${status}` + (results?.length === 0 ? " (no results)" : "")))
      }
    })
  })
}

// Fallback function that doesn't require API key
export async function geocodeToGeoPointModern(address: string): Promise<GeoPoint> {
  // This function now just throws an error since we don't have access to geocoding
  // The app will work without coordinates
  throw new Error("Geocoding not available - address will be stored as text only")
}
