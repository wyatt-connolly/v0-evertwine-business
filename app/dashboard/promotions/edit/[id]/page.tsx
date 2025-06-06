"use client"

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
import { Loader2, Calendar, Tag, MapPin, ImagePlus } from "lucide-react"
import { doc, updateDoc, getDoc, GeoPoint } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ImageCarousel } from "@/components/image-carousel"
import { AddressAutocomplete } from "@/components/address-autocomplete"

const PROMOTION_CATEGORIES = ["Restaurant", "Health", "Entertainment", "Retail", "Spa", "Other"]
const MAX_IMAGES = 6

export default function EditPromotionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [placeData, setPlaceData] = useState<any>(null)
  const [geoPoint, setGeoPoint] = useState<GeoPoint | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPromotionData = async () => {
      if (!user || !params.id) {
        router.push("/dashboard/promotions")
        return
      }

      try {
        const docRef = doc(db, "promotions", params.id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          toast({
            variant: "destructive",
            title: "Promotion not found",
            description: "The promotion you are trying to edit does not exist.",
          })
          router.push("/dashboard/promotions")
          return
        }

        const data = docSnap.data()

        // Check if the promotion belongs to the current user
        if (data.business_id !== user.uid) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You do not have permission to edit this promotion.",
          })
          router.push("/dashboard/promotions")
          return
        }

        setTitle(data.title || "")
        setCategory(data.category || "")
        setDescription(data.description || "")
        setAddress(data.address || data.formatted_address || "")
        setStatus(data.status || "live")

        // Handle enhanced location data
        if (data.location && data.location.latitude && data.location.longitude) {
          const existingGeoPoint = new GeoPoint(data.location.latitude, data.location.longitude)
          setGeoPoint(existingGeoPoint)

          setPlaceData({
            place_id: data.place_id,
            formatted_address: data.formatted_address || data.address,
            name: data.place_name,
            types: data.place_types,
            lat: data.location.latitude,
            lng: data.location.longitude,
          })
        }

        if (data.expiration_date) {
          setExpirationDate(new Date(data.expiration_date))
        }

        // Handle both single image_url and multiple image_urls
        if (data.image_urls && Array.isArray(data.image_urls)) {
          setExistingImageUrls(data.image_urls)
        } else if (data.image_url) {
          setExistingImageUrls([data.image_url])
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load promotion data. Please try again.",
        })
        router.push("/dashboard/promotions")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchPromotionData()
  }, [user, params.id, router, toast])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      // Check if adding these files would exceed the limit
      if (existingImageUrls.length + imageFiles.length + newFiles.length > MAX_IMAGES) {
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

  const removeNewImage = (index: number) => {
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

  const removeExistingImage = (index: number) => {
    const newUrls = [...existingImageUrls]
    newUrls.splice(index, 1)
    setExistingImageUrls(newUrls)
  }

  const handleAddressChange = (newAddress: string, place?: any) => {
    setAddress(newAddress)

    // Reset previous location data
    setPlaceData(null)
    setGeoPoint(null)

    if (place && place.lat && place.lng) {
      try {
        // Create GeoPoint for Firestore
        const newGeoPoint = new GeoPoint(place.lat, place.lng)
        setGeoPoint(newGeoPoint)

        // Store enhanced place data
        setPlaceData({
          place_id: place.place_id,
          formatted_address: place.formatted_address || newAddress,
          name: place.name,
          types: place.types,
          lat: place.lat,
          lng: place.lng,
          location_name: place.location_name,
        })
      } catch (error) {
        console.error("Error processing place data on edit:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to update a promotion.",
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
      let newImageURLs: string[] = []

      // Upload all new images if there are any
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

          newImageURLs = await Promise.all(uploadPromises)
        } catch (uploadError: any) {
          toast({
            variant: "destructive",
            title: "Image upload failed",
            description: "Your promotion will be updated without the new images. You can try again later.",
          })
          // Continue without the new images
        }
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...newImageURLs]

      const promotionData: any = {
        title,
        category,
        description,
        address,
        ...(expirationDate && { expiration_date: expirationDate.toISOString() }),
        ...(allImageUrls.length > 0 && {
          image_url: allImageUrls[0], // For backward compatibility
          image_urls: allImageUrls,
        }),
        updated_at: new Date().toISOString(),
        // Always keep status as live
        status: "live",
      }

      // Add enhanced location data if available
      if (geoPoint && placeData) {
        promotionData.location = geoPoint
        if (placeData.place_id) promotionData.place_id = placeData.place_id
        if (placeData.formatted_address) promotionData.formatted_address = placeData.formatted_address
        if (placeData.name) promotionData.place_name = placeData.name
        if (placeData.types && placeData.types.length > 0) promotionData.place_types = placeData.types
        if (placeData.location_name) promotionData.location_name = placeData.location_name
      } else if (address) {
        promotionData.address = address
      }

      // Update promotion in Firestore
      await updateDoc(doc(db, "promotions", params.id), promotionData)

      toast({
        title: "Promotion updated",
        description: "Your promotion has been updated successfully.",
      })

      router.push("/dashboard/promotions")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update promotion",
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

  // Combine existing and new images for preview
  const allImages = [...existingImageUrls, ...imagePreviewUrls]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Promotion</h1>
        <p className="text-muted-foreground">Update the details of your promotion</p>
      </div>

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
                        onClick={() => setCategory(cat)}
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
                  />
                </div>

                <AddressAutocomplete
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Click to enter your business address..."
                  label="Business Address"
                />

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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

                  {allImages.length > 0 && (
                    <div className="mb-4">
                      <ImageCarousel
                        images={allImages}
                        onRemoveImage={(index) =>
                          index < existingImageUrls.length
                            ? removeExistingImage(index)
                            : removeNewImage(index - existingImageUrls.length)
                        }
                        editable={true}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={allImages.length >= MAX_IMAGES}
                      className="flex items-center gap-2"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {allImages.length === 0 ? "Add Images" : "Add More Images"}
                      <span className="text-xs text-muted-foreground">
                        ({allImages.length}/{MAX_IMAGES})
                      </span>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={allImages.length >= MAX_IMAGES}
                    />
                    <div className="text-sm text-gray-500">Upload JPG or PNG images for your promotion</div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/promotions")}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Promotion"
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
                {allImages.length > 0 ? (
                  <ImageCarousel images={allImages} />
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
                <p className="text-blue-700 text-sm">Your changes will be applied immediately.</p>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
