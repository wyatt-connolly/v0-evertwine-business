"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, Calendar, Tag, MapPin } from "lucide-react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const PROMOTION_CATEGORIES = ["Restaurant", "Spa", "Retail", "Entertainment", "Other"]

export default function EditPromotionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageURL, setCurrentImageURL] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPromotionData = async () => {
      if (user && params.id) {
        try {
          const docRef = doc(db, "promotions", params.id)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()

            // Check if the promotion belongs to the current user
            if (data.businessId !== user.uid) {
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
            setAddress(data.address || "")
            setStatus(data.status || "pending")

            if (data.expirationDate) {
              setExpirationDate(new Date(data.expirationDate))
            }

            if (data.imageURL) {
              setCurrentImageURL(data.imageURL)
              setImagePreview(data.imageURL)
            }
          } else {
            toast({
              variant: "destructive",
              title: "Promotion not found",
              description: "The promotion you are trying to edit does not exist.",
            })
            router.push("/dashboard/promotions")
          }
        } catch (error) {
          console.error("Error fetching promotion data:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load promotion data. Please try again.",
          })
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    fetchPromotionData()
  }, [user, params.id, router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setCurrentImageURL(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
      let imageURL = currentImageURL

      if (imageFile) {
        const storageRef = ref(storage, `promotions/${user.uid}/${Date.now()}_${imageFile.name}`)
        await uploadBytes(storageRef, imageFile)
        imageURL = await getDownloadURL(storageRef)
      }

      const promotionData = {
        title,
        category,
        description,
        address,
        ...(expirationDate && { expirationDate: expirationDate.toISOString() }),
        ...(imageURL && { imageURL }),
        updatedAt: new Date().toISOString(),
        // Reset status to pending if it was live and significant changes were made
        ...(status === "live" && { status: "pending" }),
      }

      // Update promotion in Firestore
      await updateDoc(doc(db, "promotions", params.id), promotionData)

      toast({
        title: "Promotion updated",
        description:
          status === "live"
            ? "Your promotion has been updated and will be reviewed again."
            : "Your promotion has been updated.",
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
                        className={category === cat ? "bg-[#6A0DAD] hover:bg-[#5a0b93]" : ""}
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

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

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
                  <Label>Promotion Image</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Promotion preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#6A0DAD]"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="text-sm text-gray-500">Upload a JPG or PNG image for your promotion</div>
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
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Promotion preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tag className="h-12 w-12 text-gray-400" />
                  )}
                </div>
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
                <p className="text-blue-700 text-sm">
                  {status === "live"
                    ? "Making significant changes will require re-approval of your promotion."
                    : "Your promotion will be reviewed before being published."}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status === "live"
                        ? "bg-green-100 text-green-800"
                        : status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {status === "live" ? "Live" : status === "pending" ? "Pending" : "Expired"}
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
