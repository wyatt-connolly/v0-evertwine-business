"use client"

import type React from "react"
// Define Google Maps types locally
declare global {
  interface Window {
    google: any
  }
}

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Calendar, Tag, MapPin, AlertCircle, ImagePlus, ArrowLeft } from "lucide-react"
import { doc, updateDoc, getDoc, addDoc, collection, GeoPoint, Timestamp, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageCarousel } from "@/components/image-carousel"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { Badge } from "@/components/ui/badge"

const PROMOTION_CATEGORIES = ["Restaurant", "Health", "Entertainment", "Retail", "Spa", "Other"]
const MAX_IMAGES = 6

export default function NewPromotionPage() {
  const { user, userProfile } = useAuth()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [placeData, setPlaceData] = useState<any>(null)
  const [geoPoint, setGeoPoint] = useState<GeoPoint | null>(null)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoadingData(false)
        return
      }

      try {
        const docRef = doc(db, "business_users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setAddress(data.address || "")
          setBusinessName(data.business_name || "")
          console.log("Fetched business name:", data.business_name)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }

      setIsLoadingData(false)
    }

    fetchUserData()
  }, [user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      if (imageFiles.length + newFiles.length > MAX_IMAGES) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: `You can only upload up to ${MAX_IMAGES} images per promotion.`,
        })
        return
      }

      const updatedFiles = [...imageFiles, ...newFiles]
      setImageFiles(updatedFiles)

      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles]
    newFiles.splice(index, 1)
    setImageFiles(newFiles)

    const newPreviewUrls = [...imagePreviewUrls]
    URL.revokeObjectURL(newPreviewUrls[index])
    newPreviewUrls.splice(index, 1)
    setImagePreviewUrls(newPreviewUrls)
  }

  const handleAddressChange = async (newAddress: string, place?: any) => {
    setAddress(newAddress)
    setPlaceData(null)
    setGeoPoint(null)

    if (place && place.lat && place.lng) {
      try {
        const newGeoPoint = new GeoPoint(place.lat, place.lng)
        setGeoPoint(newGeoPoint)

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
        console.error("Error processing place data:", error)
      }
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

      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map(async (file) => {
            const storageRef = ref(
              storage,
              `meetups/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
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
        }
      }

      // Get business name if not already set
      let finalBusinessName = businessName
      if (!finalBusinessName) {
        try {
          const userDoc = await getDoc(doc(db, "business_users", user.uid))
          if (userDoc.exists()) {
            finalBusinessName = userDoc.data().business_name || ""
          }
        } catch (error) {
          console.error("Error fetching business name:", error)
        }
      }

      const meetupData: any = {
        creator_id: user.uid,
        creator_type: "business", // Differentiate from user-created meetups
        business_id: user.uid, // Keep for backward compatibility
        business_name: finalBusinessName,
        title,
        category,
        description,
        address,
        ...(expirationDate && { expiration_date: Timestamp.fromDate(expirationDate) }),
        ...(imageURLs.length > 0 && {
          image_url: imageURLs[0],
          image_urls: imageURLs,
        }),
        is_live: true, // Use boolean instead of status
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        views: 0,
        clicks: 0,
        // Additional fields for meetup compatibility
        type: "promotion", // Distinguish from regular meetups
        attendees: [],
        max_attendees: null,
      }

      console.log("Creating business meetup with data:", finalBusinessName)

      if (geoPoint && placeData) {
        meetupData.location = geoPoint
        if (placeData.place_id) meetupData.place_id = placeData.place_id
        if (placeData.formatted_address) meetupData.formatted_address = placeData.formatted_address
        if (placeData.name) meetupData.place_name = placeData.name
        if (placeData.types && placeData.types.length > 0) meetupData.place_types = placeData.types
        if (placeData.location_name) meetupData.location_name = placeData.location_name
      } else if (address) {
        meetupData.address = address
      }

      // Save to meetups collection instead of promotions
      const docRef = await addDoc(collection(db, "meetups"), meetupData)

      try {
        const businessRef = doc(db, "business_users", user.uid)
        const businessDoc = await getDoc(businessRef)

        if (businessDoc.exists()) {
          const businessData = businessDoc.data()
          await updateDoc(businessRef, {
            promotions_used: (businessData.promotions_used || 0) + 1,
          })
        }
      } catch (error) {
        console.error("Could not update promotion count:", error)
      }

      toast({
        title: "Success",
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push("/dashboard/promotions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Promotions
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Promotion</h1>
          <p className="text-muted-foreground">Fill in the details to create a new promotion for your business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Details</CardTitle>
              <CardDescription>Enter the information for your new promotion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Name - Display only */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    disabled={true}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your registered business name and cannot be changed here
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 20% Off Lunch Specials"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTION_CATEGORIES.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={category === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">{description.length}/300</span>
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

                {/* Address */}
                <AddressAutocomplete
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Click to enter your business address..."
                  label="Business Address"
                />

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label>Expiration Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
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

                {/* Images */}
                <div className="space-y-4">
                  <Label>Promotion Images (Up to {MAX_IMAGES})</Label>

                  {imagePreviewUrls.length > 0 && (
                    <div className="mb-4">
                      <ImageCarousel images={imagePreviewUrls} onRemoveImage={removeImage} editable={true} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageFiles.length >= MAX_IMAGES}
                      className="w-full"
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      {imageFiles.length === 0 ? "Add Images" : "Add More Images"}
                      <Badge variant="secondary" className="ml-2">
                        {imageFiles.length}/{MAX_IMAGES}
                      </Badge>
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={imageFiles.length >= MAX_IMAGES}
                    />
                    <p className="text-sm text-muted-foreground">Upload JPG or PNG images for your promotion</p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/promotions")}
                    className="sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="sm:flex-1">
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

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <CardDescription>See how your promotion will appear</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                {imagePreviewUrls.length > 0 ? (
                  <ImageCarousel images={imagePreviewUrls} />
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Tag className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {businessName && <div className="text-sm font-medium text-primary">{businessName}</div>}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {category || "Category"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{title || "Promotion Title"}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {description || "Promotion description will appear here..."}
                  </p>
                  {address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                  )}
                  {expirationDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Expires: {format(expirationDate, "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your promotion will be published immediately after creation and will be visible to customers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
