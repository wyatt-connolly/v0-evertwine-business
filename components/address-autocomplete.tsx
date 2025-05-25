"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Loader2, X, Edit3 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, placeData?: any) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  label = "Address",
  placeholder = "Enter your address",
  required = false,
  disabled = false,
}: AddressAutocompleteProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [apiLoadAttempts, setApiLoadAttempts] = useState(0)
  const [configLoaded, setConfigLoaded] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)
  const { toast } = useToast()

  // Fetch configuration from server and initialize Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      console.log("🚀 AddressAutocomplete: Fetching configuration and initializing Google Maps API")

      try {
        // Fetch configuration from server
        console.log("🔧 Fetching configuration from server...")
        const response = await fetch("/api/config")
        const data = await response.json()

        if (!data.success || !data.googleMapsApiKey) {
          console.error("❌ Failed to fetch Google Maps configuration:", data.error)
          setConfigLoaded(false)
          return
        }

        console.log("✅ Configuration fetched successfully")
        setConfigLoaded(true)

        const apiKey = data.googleMapsApiKey

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("✅ Google Maps API already loaded, initializing services")
          try {
            autocompleteService.current = new window.google.maps.places.AutocompleteService()
            placesService.current = new window.google.maps.places.PlacesService(document.createElement("div"))
            setIsGoogleMapsLoaded(true)
            console.log("✅ Google Maps services initialized successfully")
            return
          } catch (error) {
            console.error("❌ Error initializing Google Maps services:", error)
            setIsGoogleMapsLoaded(false)
            return
          }
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        if (existingScript) {
          console.log("⏳ Google Maps script already exists, waiting for load...")
          existingScript.addEventListener("load", () => {
            console.log("✅ Existing Google Maps script loaded")
            initializeServices()
          })
          existingScript.addEventListener("error", (error) => {
            console.error("❌ Existing Google Maps script failed to load:", error)
            setIsGoogleMapsLoaded(false)
            setApiLoadAttempts((prev) => prev + 1)
          })
          return
        }

        // Load Google Maps API
        console.log("📥 Loading Google Maps API script...")
        const script = document.createElement("script")

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
        script.async = true
        script.defer = true

        // Create a global callback function
        window.initGoogleMaps = () => {
          console.log("🎯 Google Maps API callback triggered")
          initializeServices()
        }

        script.onload = () => {
          console.log("📦 Google Maps script onload triggered")
        }

        script.onerror = (error) => {
          console.error("❌ Google Maps script failed to load:", error)
          setIsGoogleMapsLoaded(false)
          setApiLoadAttempts((prev) => prev + 1)
        }

        console.log("🔗 Adding Google Maps script to document head")
        document.head.appendChild(script)
      } catch (error) {
        console.error("❌ Error fetching configuration:", error)
        setConfigLoaded(false)
      }
    }

    const initializeServices = () => {
      try {
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          placesService.current = new window.google.maps.places.PlacesService(document.createElement("div"))
          setIsGoogleMapsLoaded(true)
          console.log("✅ Google Maps API loaded and services initialized")
        } else {
          console.error("❌ Google Maps API loaded but services not available")
          setIsGoogleMapsLoaded(false)
        }
      } catch (error) {
        console.error("❌ Error initializing Google Maps services:", error)
        setIsGoogleMapsLoaded(false)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeGoogleMaps()
    }, 100)

    return () => {
      clearTimeout(timer)
      // Clean up global callback
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
    }
  }, [])

  // Monitor Google Maps loading state
  useEffect(() => {
    console.log("📊 Google Maps state changed:", {
      configLoaded,
      isLoaded: isGoogleMapsLoaded,
      hasGoogle: !!window.google,
      hasMaps: !!(window.google && window.google.maps),
      hasPlaces: !!(window.google && window.google.maps && window.google.maps.places),
      hasAutocompleteService: !!autocompleteService.current,
      hasPlacesService: !!placesService.current,
      apiLoadAttempts,
    })
  }, [isGoogleMapsLoaded, apiLoadAttempts, configLoaded])

  // Reset input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      console.log("🔄 Modal opened, resetting input state")
      setInputValue(value || "")
      setSuggestions([])
      setShowSuggestions(false)
      setSelectedIndex(-1)
      // Focus the input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus()
        console.log("🎯 Input focused")
      }, 100)
    }
  }, [isModalOpen, value])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      console.log("🔍 Debounced search triggered:", {
        query,
        queryLength: query.length,
        isGoogleMapsLoaded,
        hasAutocompleteService: !!autocompleteService.current,
        configLoaded,
      })

      if (!query.trim()) {
        console.log("⚠️ Empty query, clearing suggestions")
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      if (!isGoogleMapsLoaded) {
        console.log("⚠️ Google Maps not loaded, cannot search")
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      if (!autocompleteService.current) {
        console.log("⚠️ AutocompleteService not available, cannot search")
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      console.log("⏳ Starting autocomplete search...")

      const request = {
        input: query,
        types: ["establishment", "geocode"],
        componentRestrictions: { country: "us" }, // Restrict to US addresses
      }

      console.log("📤 Sending autocomplete request:", request)

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: AddressSuggestion[] | null, status: any) => {
          setIsLoading(false)
          console.log("📥 Autocomplete response received:", {
            status,
            predictionsCount: predictions?.length || 0,
            predictions: predictions?.slice(0, 2), // Log first 2 for debugging
          })

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const limitedPredictions = predictions.slice(0, 5)
            setSuggestions(limitedPredictions)
            setShowSuggestions(true)
            setSelectedIndex(-1)
            console.log("✅ Suggestions updated:", limitedPredictions.length)
          } else {
            console.log("⚠️ No predictions or error:", status)
            setSuggestions([])
            setShowSuggestions(false)
          }
        },
      )
    }, 300),
    [isGoogleMapsLoaded, configLoaded],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log("⌨️ Input changed:", { newValue, length: newValue.length })
    setInputValue(newValue)

    if (newValue.length >= 3) {
      console.log("🔍 Triggering search for:", newValue)
      debouncedSearch(newValue)
    } else {
      console.log("⚠️ Input too short, clearing suggestions")
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    console.log("🎯 Suggestion clicked:", {
      placeId: suggestion.place_id,
      description: suggestion.description,
      hasPlacesService: !!placesService.current,
    })

    if (!placesService.current) {
      console.log("⚠️ PlacesService not available, using fallback")
      setInputValue(suggestion.description)
      return
    }

    setIsLoading(true)
    setShowSuggestions(false)
    setInputValue(suggestion.description)

    // Get detailed place information
    const request = {
      placeId: suggestion.place_id,
      fields: ["formatted_address", "geometry", "name", "place_id", "types"],
    }

    console.log("📤 Requesting place details:", request)

    placesService.current.getDetails(request, (place: any, status: any) => {
      setIsLoading(false)
      console.log("📥 Place details response:", {
        status,
        place: place
          ? {
              placeId: place.place_id,
              name: place.name,
              formattedAddress: place.formatted_address,
              hasGeometry: !!place.geometry,
              hasLocation: !!(place.geometry && place.geometry.location),
            }
          : null,
      })

      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const placeData = {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          name: place.name,
          geometry: place.geometry,
          types: place.types,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }

        setInputValue(place.formatted_address)
        console.log("✅ Place data extracted:", placeData)

        toast({
          title: "Address selected",
          description: "Location details have been saved successfully.",
        })
      } else {
        console.log("⚠️ Place details failed, using fallback")
        toast({
          title: "Address selected",
          description: "Address saved (location details unavailable).",
        })
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    console.log("⌨️ Key pressed:", e.key, "selectedIndex:", selectedIndex)

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          console.log("⏎ Enter pressed, selecting suggestion:", selectedIndex)
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case "Escape":
        console.log("⎋ Escape pressed, hiding suggestions")
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSaveAddress = () => {
    console.log("💾 Save address clicked:", { inputValue: inputValue.trim() })

    if (!inputValue.trim()) {
      console.log("⚠️ Empty address, showing error")
      toast({
        variant: "destructive",
        title: "Address required",
        description: "Please enter an address before saving.",
      })
      return
    }

    // If we have place data from a suggestion, use it
    if (placesService.current && suggestions.length > 0) {
      // Check if the current input matches any suggestion
      const matchingSuggestion = suggestions.find((s) => s.description === inputValue)
      if (matchingSuggestion) {
        console.log("🎯 Input matches suggestion, getting place details")
        handleSuggestionClick(matchingSuggestion)
        // Wait for the place details to be fetched before closing
        setTimeout(() => {
          onChange(inputValue)
          setIsModalOpen(false)
          console.log("✅ Modal closed after place details")
        }, 500)
        return
      }
    }

    // Manual address entry
    console.log("📝 Manual address entry")
    onChange(inputValue)
    setIsModalOpen(false)

    toast({
      title: "Address saved",
      description: "Your address has been saved successfully.",
    })
  }

  const handleCancel = () => {
    console.log("❌ Cancel clicked, resetting to original value")
    setInputValue(value || "")
    setSuggestions([])
    setShowSuggestions(false)
    setIsModalOpen(false)
  }

  const clearInput = () => {
    console.log("🗑️ Clear input clicked")
    setInputValue("")
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Display current address */}
      <div className="relative">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <div
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                if (!disabled) {
                  console.log("🖱️ Address field clicked, opening modal")
                  setIsModalOpen(true)
                }
              }}
            >
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || placeholder}</span>
              <Edit3 className="h-4 w-4 ml-auto text-muted-foreground" />
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enter Business Address</DialogTitle>
              <DialogDescription>Start typing your address to see suggestions, or enter it manually.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Start typing your complete business address..."
                    className="pl-10 pr-10"
                    autoComplete="off"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {inputValue && !isLoading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                      onClick={clearInput}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-b-0 ${
                          index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {suggestion.structured_formatting.main_text}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debug information */}
              <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                <div className="font-medium mb-1">🔧 Debug Info:</div>
                <div>Configuration: {configLoaded ? "✅ Loaded" : "⏳ Loading..."}</div>
                <div>Google Maps Loaded: {isGoogleMapsLoaded ? "✅ Yes" : "❌ No"}</div>
                <div>API Load Attempts: {apiLoadAttempts}</div>
                <div>Autocomplete Service: {autocompleteService.current ? "✅ Ready" : "❌ Not Ready"}</div>
                <div>Places Service: {placesService.current ? "✅ Ready" : "❌ Not Ready"}</div>
                <div>Current Suggestions: {suggestions.length}</div>
              </div>

              {!configLoaded && (
                <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <span className="inline-flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Loading configuration from server...
                  </span>
                </div>
              )}

              {configLoaded && !isGoogleMapsLoaded && (
                <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  <span className="inline-flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {apiLoadAttempts > 0
                      ? `Address suggestions failed to load (attempt ${apiLoadAttempts}). You can still enter your address manually.`
                      : "Loading address suggestions... You can enter your address manually if this takes too long."}
                  </span>
                </div>
              )}

              {isGoogleMapsLoaded && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  💡 <strong>Tips:</strong> Start typing your address to see suggestions. Use arrow keys to navigate and
                  Enter to select. You can also type your complete address manually.
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Please include:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Street number and name</li>
                  <li>• City, State/Province</li>
                  <li>• ZIP/Postal code</li>
                  <li>• Country (if applicable)</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
                disabled={!inputValue.trim()}
              >
                Save Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-xs text-muted-foreground">
        Click above to enter or edit your business address
        {!isGoogleMapsLoaded && " (Address suggestions loading...)"}
      </div>
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
