"use client"

console.log("Rendering NEW promotion page")

import type React from "react"
// Define Google Maps types locally
declare global {
  interface Window {
    google: any
  }
}

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Calendar, Tag, MapPin, AlertCircle, ImagePlus } from "lucide-react"
import { doc, updateDoc, getDoc, addDoc, collection, query, where, getDocs, GeoPoint } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageCarousel } from "@/components/image-carousel"
import { AddressAutocomplete } from "@/components/address-autocomplete"

const PROMOTION_CATEGORIES = ["Restaurant", "Spa", "Retail", "Entertainment", "Other"]
const MAX_PROMOTIONS = 2
const MAX_IMAGES = 6

export default function NewPromotionPage() {
  const { user, userProfile } = useAuth()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [placeData, setPlaceData] = useState<any>(null)
  const [geoPoint, setGeoPoint] = useState<GeoPoint | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [existingPromotions, setExistingPromotions] = useState<any[]>([])
  const [reachedLimit, setReachedLimit] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Debug the current path
  useEffect(() => {
    console.log("Current pathname:", pathname)
    console.log("This should be the NEW promotion page")
  }, [pathname])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoadingData(false)
        return
      }

      console.log("Fetching user data for NEW promotion page")

      try {
        // Get user data from business_users collection
        const docRef = doc(db, "business_users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setAddress(data.address || "")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // Don't show an error toast, just log it
      }

      // Check existing promotions count
      try {
        // Make sure we're querying with the correct field name
        const promotionsQuery = query(collection(db, "promotions"), where("business_id", "==", user.uid))
        const promotionsSnapshot = await getDocs(promotionsQuery)

        // Filter to only include live promotions
        const promotionsData = promotionsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((promo) => promo.status === "live")

        setExistingPromotions(promotionsData)

        // Only set reached limit if we actually have MAX_PROMOTIONS or more
        const hasReachedLimit = promotionsData.length >= MAX_PROMOTIONS
        setReachedLimit(hasReachedLimit)

        console.log(`Found ${promotionsData.length} promotions, limit reached: ${hasReachedLimit}`)
      } catch (error) {
        console.error("Error fetching promotions count:", error)
      }

      setIsLoadingData(false)
    }

    fetchUserData()
  }, [user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      // Check if adding these files would exceed the limit
      if (imageFiles.length + newFiles.length > MAX_IMAGES) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: `You can only upload up to ${MAX_IMAGES} images per promotion.`,
        })
        return
      }

      // Add new files to the existing ones
      const updatedFiles = [...imageFiles, ...newFiles]
      setImageFiles(updatedFiles)

      // Generate preview URLs for all files
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    // Remove the file and its preview URL
    const newFiles = [...imageFiles]
    newFiles.splice(index, 1)
    setImageFiles(newFiles)

    const newPreviewUrls = [...imagePreviewUrls]
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index])
    newPreviewUrls.splice(index, 1)
    setImagePreviewUrls(newPreviewUrls)
  }

  // Enhanced address change handler with Google Places integration
  const handleAddressChange = async (newAddress: string, place?: any) => {
    console.log("handleAddressChange called with:", { newAddress, place })
    setAddress(newAddress)

    // Reset previous location data
    setPlaceData(null)
    setGeoPoint(null)

    if (place && place.geometry && place.geometry.location) {
      try {
        // Extract coordinates from Google Places data
        const lat = typeof place.lat === "number" ? place.lat : place.geometry.location.lat()
        const lng = typeof place.lng === "number" ? place.lng : place.geometry.location.lng()

        // Create GeoPoint for Firestore
        const newGeoPoint = new GeoPoint(lat, lng)
        setGeoPoint(newGeoPoint)

        // Store place data for additional information
        setPlaceData({
          place_id: place.place_id,
          formatted_address: place.formatted_address || newAddress,
          name: place.name,
          types: place.types,
          lat,
          lng,
        })

        console.log("🎯 Location data set:", { lat, lng, geoPoint: newGeoPoint })
      } catch (error) {
        console.error("Error processing place data:", error)
        // Still store the address even if we can't get coordinates
        console.log("📝 Storing address without coordinates:", newAddress)
      }
    } else {
      // Manual address entry without coordinates
      console.log("📝 Manual address entry without coordinates:", newAddress)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to create a promotion.",
      })
      return
    }

    // Double-check the limit before submitting
    if (existingPromotions.length >= MAX_PROMOTIONS) {
      toast({
        variant: "destructive",
        title: "Promotion limit reached",
        description: `You can only have ${MAX_PROMOTIONS} active promotions at a time.`,
      })
      return
    }

    if (!title || !category || !description) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsLoading(true)

    try {
      let imageURLs: string[] = []

      // Upload all images if there are any
      if (imageFiles.length > 0) {
        try {
          // Upload each image and collect the URLs
          const uploadPromises = imageFiles.map(async (file) => {
            const storageRef = ref(
              storage,
              `promotions/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
            )
            await uploadBytes(storageRef, file)
            return getDownloadURL(storageRef)
          })

          imageURLs = await Promise.all(uploadPromises)
        } catch (uploadError: any) {
          console.error("Error uploading images:", uploadError)
          toast({
            variant: "destructive",
            title: "Image upload failed",
            description: "Your promotion will be created without images. You can edit it later to add images.",
          })
          // Continue without the images
        }
      }

      // Create the promotion data object
      const promotionData: any = {
        business_id: user.uid,
        title,
        category,
        description,
        address,
        ...(expirationDate && { expiration_date: expirationDate.toISOString() }),
        ...(imageURLs.length > 0 && {
          image_url: imageURLs[0], // For backward compatibility
          image_urls: imageURLs,
        }),
        status: "live", // Set to live immediately - no review needed
        created_at: new Date().toISOString(),
        views: 0,
        clicks: 0,
      }

      // Add enhanced location data if available
      if (geoPoint && placeData) {
        console.log("🎯 Adding enhanced location data:", { geoPoint, placeData })
        promotionData.location = geoPoint
        promotionData.place_id = placeData.place_id
        promotionData.formatted_address = placeData.formatted_address
        promotionData.place_name = placeData.name
        promotionData.place_types = placeData.types
      } else if (address) {
        // If we have an address but no coordinates, still store the address
        console.log("📝 Storing address without enhanced location data")
        promotionData.address = address
      }

      console.log("🚀 Creating new promotion with data:", promotionData)

      // Add promotion to Firestore
      const docRef = await addDoc(collection(db, "promotions"), promotionData)
      console.log("✅ Promotion created with ID:", docRef.id)

      // Try to update the user's promotion count
      try {
        const businessRef = doc(db, "business_users", user.uid)
        const businessDoc = await getDoc(businessRef)

        if (businessDoc.exists()) {
          const businessData = businessDoc.data()
          await updateDoc(businessRef, {
            promotions_used: (businessData.promotions_used || 0) + 1,
          })
          console.log("Updated user's promotion count")
        }
      } catch (error) {
        console.error("Could not update promotion count:", error)
        // Continue anyway, the promotion was created
      }

      toast({
        title: "Promotion created",
        description: "Your promotion is now live!",
      })

      router.push("/dashboard/promotions")
    } catch (error: any) {
      console.error("Failed to create promotion:", error)
      toast({
        variant: "destructive",
        title: "Failed to create promotion",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Promotion</h1>
        <p className="text-muted-foreground">Fill in the details to create a new promotion for your business</p>
      </div>

      {reachedLimit && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum limit of {MAX_PROMOTIONS} active promotions. Please delete an existing
            promotion before creating a new one.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 20% Off Lunch Specials"
                    required
                    disabled={reachedLimit}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTION_CATEGORIES.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={category === cat ? "default" : "outline"}
                        className={category === cat ? "bg-[#6A0DAD] hover:bg-[#5a0b93]" : ""}
                        onClick={() => setCategory(cat)}
                        disabled={reachedLimit}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-gray-500">{description.length}/300</span>
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setDescription(e.target.value)
                      }
                    }}
                    placeholder="Describe your promotion in detail..."
                    className="resize-none"
                    rows={4}
                    required
                    disabled={reachedLimit}
                  />
                </div>

                <AddressAutocomplete
                  value={address}
                  onChange={handleAddressChange}
                  disabled={reachedLimit}
                  placeholder="Click to enter your business address..."
                  label="Business Address"
                />

                {/* Enhanced debug info for location data */}
                {(placeData || geoPoint) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                    <div className="font-medium text-green-800 mb-1">📍 Enhanced Location Data Detected:</div>
                    {placeData && (
                      <div className="text-green-700 space-y-1">
                        <div>📍 Place: {placeData.name || "N/A"}</div>
                        <div>🏷️ Place ID: {placeData.place_id}</div>
                        <div>
                          📍 Coordinates: {placeData.lat?.toFixed(6)}, {placeData.lng?.toFixed(6)}
                        </div>
                        <div>🏢 Types: {placeData.types?.join(", ") || "N/A"}</div>
                      </div>
                    )}
                    {geoPoint && (
                      <div className="text-green-700">
                        🗺️ GeoPoint: {geoPoint.latitude.toFixed(6)}, {geoPoint.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={reachedLimit}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Promotion Images (Up to {MAX_IMAGES})</Label>

                  {imagePreviewUrls.length > 0 && (
                    <div className="mb-4">
                      <ImageCarousel images={imagePreviewUrls} onRemoveImage={removeImage} editable={true} />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => !reachedLimit && fileInputRef.current?.click()}
                      disabled={reachedLimit || imageFiles.length >= MAX_IMAGES}
                      className="flex items-center gap-2"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {imageFiles.length === 0 ? "Add Images" : "Add More Images"}
                      <span className="text-xs text-muted-foreground">
                        ({imageFiles.length}/{MAX_IMAGES})
                      </span>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={reachedLimit || imageFiles.length >= MAX_IMAGES}
                    />
                    <div className="text-sm text-gray-500">Upload JPG or PNG images for your promotion</div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/promotions")}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
                    disabled={isLoading || reachedLimit}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Promotion"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Live Preview</h3>
              <div className="border rounded-lg overflow-hidden">
                {imagePreviewUrls.length > 0 ? (
                  <ImageCarousel images={imagePreviewUrls} />
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Tag className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">{category || "Category"}</span>
                  </div>
                  <h3 className="font-medium mb-2">{title || "Promotion Title"}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {description || "Promotion description will appear here..."}
                  </p>
                  {address && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{address}</span>
                    </div>
                  )}
                  {expirationDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {format(expirationDate, "PPP")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 text-sm">Your promotion will be published immediately after creation.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
