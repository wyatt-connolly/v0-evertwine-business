"use client"

import type React from "react"

import { forwardRef, useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2 } from "lucide-react"

interface AddressAutocompleteProps extends React.HTMLAttributes<HTMLInputElement> {
  apiKey: string
  onSelect: (address: google.maps.places.PlaceResult) => void
}

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  ({ apiKey, onSelect, className, ...props }, ref) => {
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const loadScript = useCallback(() => {
      return new Promise((resolve) => {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          resolve(true)
          return
        }

        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        document.head.appendChild(script)

        script.onload = () => {
          resolve(true)
        }
      })
    }, [apiKey])

    useEffect(() => {
      let autocomplete: google.maps.places.Autocomplete

      const initializeAutocomplete = async () => {
        const isLoaded = await loadScript()

        if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
          autocomplete = new window.google.maps.places.Autocomplete(inputRef.current as HTMLInputElement, {
            types: ["address"],
            componentRestrictions: { country: "us" },
            fields: ["address_components", "geometry", "icon", "name"],
          })

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            if (!place.geometry) {
              console.log("No details available for input: '" + place.name + "'")
              return
            }
            onSelect(place)
            setQuery(place.formatted_address || "")
            setIsOpen(false)
          })
        } else {
          console.error("Google Maps Places API could not be initialized.")
        }
      }

      initializeAutocomplete()

      return () => {
        // Cleanup if needed
      }
    }, [apiKey, loadScript, onSelect])

    useEffect(() => {
      const getPlacePredictions = async () => {
        if (!query) {
          setPredictions([])
          return
        }

        setIsLoading(true)

        try {
          const service = new google.maps.places.AutocompleteService()
          const request = {
            input: query,
            types: ["address"],
            componentRestrictions: { country: "us" },
          }

          service.getPlacePredictions(request, (predictions, status) => {
            setIsLoading(false)
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
              console.error("Autocomplete failed: " + status)
              return
            }

            setPredictions(predictions || [])
            setIsOpen(true)
          })
        } catch (error) {
          console.error("Error fetching predictions:", error)
          setIsLoading(false)
        }
      }

      const delayDebounceFn = setTimeout(() => {
        getPlacePredictions()
      }, 500)

      return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
      setQuery(prediction.description)
      setPredictions([])

      // Programmatically trigger the autocomplete to select the place
      const inputElement = inputRef.current as HTMLInputElement
      inputElement.value = prediction.description

      // Create a new Autocomplete instance and trigger the place_changed event
      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["address_components", "geometry", "icon", "name"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (!place.geometry) {
          console.log("No details available for input: '" + place.name + "'")
          return
        }
        onSelect(place)
        setQuery(place.formatted_address || "")
        setIsOpen(false)
      })

      google.maps.event.trigger(inputElement, "focus", {})
      google.maps.event.trigger(inputElement, "keydown", { keyCode: 13 })
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Input ref={inputRef} onChange={(e) => setQuery(e.target.value)} value={query} {...props} />
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : predictions.length > 0 ? (
            <ul className="divide-y divide-border">
              {predictions.map((prediction) => (
                <li
                  key={prediction.place_id}
                  className="cursor-pointer p-2 hover:bg-secondary"
                  onClick={() => handleSelectPrediction(prediction)}
                >
                  {prediction.description}
                </li>
              ))}
            </ul>
          ) : query.length > 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No results found.</div>
          ) : null}
        </PopoverContent>
      </Popover>
    )
  },
)
AddressAutocomplete.displayName = "AddressAutocomplete"

export default AddressAutocomplete
