"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"

const BUSINESS_CATEGORIES = ["Restaurant", "Spa", "Fitness", "Retail", "Entertainment", "Other"]

export default function BusinessInfoPage() {
  const { user, loading } = useAuthState()
  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [bio, setBio] = useState("")
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreview(e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to complete this step.",
      })
      return
    }

    if (!businessName || !category) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsLoading(true)

    try {
      let photoURL = ""

      if (photoFile) {
        const storageRef = ref(storage, `businesses/${user.uid}/profile`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }

      const businessData = {
        businessName,
        category,
        address,
        bio,
        ...(photoURL && { photoURL }),
        onboardingStep: 1,
      }

      await updateDoc(doc(db, "businesses", user.uid), businessData)

      toast({
        title: "Business information saved",
        description: "Let's continue with the next step.",
      })

      router.push("/onboarding/contact-plan")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save information",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Step 1: Business Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              Business Name <span className="text-red-500">*</span>
            </Label>
            <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_CATEGORIES.map((cat) => (
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Short Bio</Label>
              <span className="text-xs text-gray-500">{bio.length}/300</span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setBio(e.target.value)
                }
              }}
              placeholder="Tell us about your business..."
              className="resize-none"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Business Photo</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Business preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
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
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
              <div className="text-sm text-gray-500">Upload a square image for best results</div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <div className="text-sm text-gray-500">Step 1 of 3</div>
        <Button onClick={handleSubmit} className="bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
