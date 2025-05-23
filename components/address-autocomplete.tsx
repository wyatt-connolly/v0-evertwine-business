"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, placeData?: any) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  label = "Address",
  placeholder = "Enter your address",
  required = false,
  disabled = false,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAddress, setSelectedAddress] = useState(value)

  // Update selected address when value prop changes
  useEffect(() => {
    setSelectedAddress(value)
  }, [value])

  const closeModal = () => {
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleManualInput = () => {
    const address = searchQuery.trim()
    if (address) {
      setSelectedAddress(address)
      onChange(address)
      closeModal()
    }
  }

  const handleDirectEdit = () => {
    setSearchQuery(selectedAddress || "")
    setIsOpen(true)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Display selected address */}
      <div className="relative">
        <div
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent transition-colors"
          onClick={() => !disabled && handleDirectEdit()}
        >
          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
          <span className={selectedAddress ? "text-foreground" : "text-muted-foreground"}>
            {selectedAddress || placeholder}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Click above to enter or edit your business address</div>

      {/* Address input modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-3">Enter Address</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your complete business address..."
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4">
              <div className="text-sm text-muted-foreground mb-4">
                <p className="mb-2">Please enter your complete business address including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Street number and name</li>
                  <li>City, State/Province</li>
                  <li>ZIP/Postal code</li>
                  <li>Country (if applicable)</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleManualInput}
                  disabled={!searchQuery.trim()}
                  className="flex-1 bg-[#6A0DAD] hover:bg-[#5a0b93]"
                >
                  Save Address
                </Button>
                <Button onClick={closeModal} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
