"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, place?: any) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter address...",
  label = "Address",
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)
  const { toast } = useToast()

  // Fetch API key and load Google Maps
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Fetch API key from server
        const response = await fetch("/api/google-maps-config")

        // Check if response is OK and is JSON
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Google Maps config endpoint returned non-JSON response:", contentType)
          throw new Error("Invalid response format from API")
        }

        const data = await response.json()

        if (!data.apiKey) {
          console.error("Google Maps API key not found in response")
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Could not load address suggestions. Please try again later.",
          })
          return
        }

        setApiKey(data.apiKey)

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          initializeServices()
          return
        }

        // Load Google Maps script
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => {
          initializeServices()
        }
        script.onerror = (e) => {
          console.error("Failed to load Google Maps script", e)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load address suggestions. Please try again later.",
          })
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load address suggestions. Please try manually entering your address.",
        })
      }
    }

    const initializeServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        // Create a dummy map for PlacesService (required by Google Maps API)
        const dummyMap = new window.google.maps.Map(document.createElement("div"))
        placesService.current = new window.google.maps.places.PlacesService(dummyMap)
        setIsGoogleMapsLoaded(true)
      }
    }

    loadGoogleMaps()
  }, [])

  // Extract neighborhood from place details
  const extractNeighborhood = (addressComponents: any[]) => {
    const neighborhoodTypes = [
      "neighborhood",
      "sublocality_level_1",
      "sublocality",
      "locality",
      "administrative_area_level_3",
    ]

    for (const type of neighborhoodTypes) {
      const component = addressComponents.find((comp) => comp.types.includes(type))
      if (component) {
        return component.long_name
      }
    }
    return null
  }

  const handlePredictionSelect = async (prediction: any) => {
    setIsLoading(true)
    setInputValue(prediction.description)

    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["geometry", "formatted_address", "name", "types", "address_components"],
        },
        (place: any, status: any) => {
          setIsLoading(false)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()

            // Extract neighborhood
            const neighborhood = extractNeighborhood(place.address_components || [])

            const placeData = {
              place_id: prediction.place_id,
              formatted_address: place.formatted_address,
              name: place.name,
              types: place.types,
              lat,
              lng,
              location_name: neighborhood,
            }

            onChange(prediction.description, placeData)
            setIsOpen(false)
            setPredictions([])
            setSelectedIndex(-1)
          } else {
            console.error("Place details request failed:", status)
            onChange(prediction.description)
            setIsOpen(false)
            setPredictions([])
            setSelectedIndex(-1)
          }
        },
      )
    } else {
      setIsLoading(false)
      onChange(prediction.description)
      setIsOpen(false)
      setPredictions([])
      setSelectedIndex(-1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)

    if (newValue.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: newValue,
          types: ["establishment", "geocode"],
        },
        (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions.slice(0, 5))
          } else {
            setPredictions([])
          }
        },
      )
    } else {
      setPredictions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (predictions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handlePredictionSelect(predictions[selectedIndex])
        }
        break
      case "Escape":
        setPredictions([])
        setSelectedIndex(-1)
        break
    }
  }

  const handleManualSubmit = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim())
      setIsOpen(false)
      setPredictions([])
      setSelectedIndex(-1)
    }
  }

  const openModal = () => {
    if (!disabled) {
      setInputValue(value)
      setIsOpen(true)
      setPredictions([])
      setSelectedIndex(-1)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal h-auto p-3 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            disabled={disabled}
            onClick={openModal}
          >
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{value || placeholder}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Business Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Start typing your address..."
                className="w-full border-gray-200 focus:border-purple-300 focus:ring-purple-200 focus:ring-2 transition-all duration-200"
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>

            {!isGoogleMapsLoaded && <div className="text-sm text-muted-foreground">Loading address suggestions...</div>}

            {predictions.length > 0 && (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {predictions.map((prediction, index) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    className={`w-full text-left p-3 hover:bg-accent transition-colors border-b last:border-b-0 ${
                      index === selectedIndex ? "bg-accent" : ""
                    }`}
                    onClick={() => handlePredictionSelect(prediction)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{prediction.structured_formatting?.main_text}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {prediction.structured_formatting?.secondary_text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" onClick={handleManualSubmit} className="flex-1">
                Use This Address
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Select from suggestions for enhanced location features, or click "Use This Address" to enter manually.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
