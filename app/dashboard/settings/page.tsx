"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, auth, storage } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"

export default function SettingsPage() {
  const { user, userProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [bio, setBio] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [showImageWarning, setShowImageWarning] = useState(false)

  // Notification settings
  const [promotionUpdates, setPromotionUpdates] = useState(true)
  const [customerInteractions, setCustomerInteractions] = useState(true)
  const [marketingUpdates, setMarketingUpdates] = useState(false)
  const [accountAlerts, setAccountAlerts] = useState(true)

  useEffect(() => {
    if (userProfile) {
      // Handle both camelCase and snake_case field names
      setBusinessName(userProfile.business_name || userProfile.businessName || "")
      setEmail(user?.email || "")
      setPhone(userProfile.phone || "")
      setAddress(userProfile.address || "")
      setBio(userProfile.bio || "")
      setPhotoPreview(userProfile.photo_url || userProfile.photoURL || null)

      // Set notification preferences
      setPromotionUpdates(userProfile.notification_promotion_updates !== false)
      setCustomerInteractions(userProfile.notification_customer_interactions !== false)
      setMarketingUpdates(userProfile.notification_marketing_updates === true)
      setAccountAlerts(userProfile.notification_account_alerts !== false)
    }
  }, [userProfile, user])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to update your profile.",
      })
      return
    }

    setIsLoading(true)

    let photoURL = userProfile?.photo_url || userProfile?.photoURL || null

    try {
      // Upload image if a new one is selected
      if (photoFile) {
        try {
          const storageRef = ref(
            storage,
            `business_users/${user.uid}/profile_photo/${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
          )
          await uploadBytes(storageRef, photoFile)
          photoURL = await getDownloadURL(storageRef)
        } catch (uploadError: any) {
          console.error("Error uploading image:", uploadError)
          toast({
            variant: "destructive",
            title: "Image upload failed",
            description: "Your profile will be updated without the new image. Please try again later.",
          })
          // Continue without updating the image
        }
      }

      const profileData = {
        business_name: businessName,
        phone: phone,
        address: address,
        bio: bio,
        updated_at: new Date().toISOString(),
        ...(photoURL && { photo_url: photoURL, business_photo: photoURL }), // Add both fields for compatibility
      }

      // Only update in business_users collection
      const userRef = doc(db, "business_users", user.uid)
      const docSnap = await getDoc(userRef)

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(userRef, profileData)
        toast({
          title: "Profile updated",
          description: "Your business profile has been updated successfully.",
        })
      } else {
        // Create new document
        await setDoc(userRef, {
          ...profileData,
          created_at: new Date().toISOString(),
          email: user.email,
          user_id: user.uid,
        })
        toast({
          title: "Profile created",
          description: "Your business profile has been created successfully.",
        })
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to update your notification preferences.",
      })
      return
    }

    setIsLoading(true)

    try {
      const notificationData = {
        notification_promotion_updates: promotionUpdates,
        notification_customer_interactions: customerInteractions,
        notification_marketing_updates: marketingUpdates,
        notification_account_alerts: accountAlerts,
        updated_at: new Date().toISOString(),
      }

      // Only update in business_users collection
      const userRef = doc(db, "business_users", user.uid)
      const docSnap = await getDoc(userRef)

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(userRef, notificationData)
        toast({
          title: "Notification preferences updated",
          description: "Your notification settings have been saved.",
        })
      } else {
        // Create new document
        await setDoc(userRef, {
          ...notificationData,
          created_at: new Date().toISOString(),
          email: user.email,
          user_id: user.uid,
        })
        toast({
          title: "Notification preferences created",
          description: "Your notification settings have been saved.",
        })
      }
    } catch (error: any) {
      console.error("Error updating notification preferences:", error)
      toast({
        variant: "destructive",
        title: "Failed to update notification preferences",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in with an email to reset your password.",
      })
      return
    }

    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, user.email)
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
    } catch (error: any) {
      console.error("Error sending password reset email:", error)
      toast({
        variant: "destructive",
        title: "Failed to send password reset email",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Update your business information and how it appears to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* {showImageWarning && (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Image Upload Limitation</AlertTitle>
                  <AlertDescription>
                    Due to current system limitations, profile images cannot be updated at this time. Your other profile
                    information will still be saved.
                  </AlertDescription>
                </Alert>
              )} */}

              <div className="space-y-2">
                <Label htmlFor="photo">Business Photo</Label>
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
                        onClick={() => {
                          // Only reset the new photo file and preview if it's a new upload
                          // Keep the existing photo from userProfile
                          if (photoFile) {
                            setPhotoPreview(userProfile?.photo_url || userProfile?.photoURL || null)
                            setPhotoFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#6A0DAD]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="photo"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <div className="text-sm text-gray-500">
                    <p>Upload a square image for best results</p>
                    <p className="text-xs text-gray-500">JPG, PNG or GIF up to 2MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support for assistance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Business Bio</Label>
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
                  placeholder="Tell customers about your business..."
                  className="resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveProfile} className="bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Promotion Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when your promotions are approved or rejected
                    </p>
                  </div>
                  <Switch checked={promotionUpdates} onCheckedChange={setPromotionUpdates} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Customer Interactions</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when customers interact with your promotions
                    </p>
                  </div>
                  <Switch checked={customerInteractions} onCheckedChange={setCustomerInteractions} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Receive tips and best practices for promoting your business
                    </p>
                  </div>
                  <Switch checked={marketingUpdates} onCheckedChange={setMarketingUpdates} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Important notifications about your account and billing
                    </p>
                  </div>
                  <Switch checked={accountAlerts} onCheckedChange={setAccountAlerts} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveNotifications}
                className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Change Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We'll send you an email with instructions to reset your password
                  </p>
                  <Button onClick={handleChangePassword} variant="outline" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Password Reset Email"
                    )}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Two-factor authentication is currently disabled</p>
                    <Button variant="outline">Enable</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription plan and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Current Plan</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Business Plan</p>
                        <p className="text-sm text-muted-foreground">2 promotions allowed</p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">Business Plan</p>
                      </div>
                    </div>
                  </div>
                </div>

                {userProfile?.plan === "premium" && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded mr-3">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="24" height="24" rx="4" fill="#EEF2FF" />
                            <path d="M5 9H19V15H5V9Z" fill="#818CF8" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/24</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Billing History</h3>
                  {userProfile?.plan === "premium" ? (
                    <div className="rounded-md border">
                      <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium">
                        <div>Date</div>
                        <div>Amount</div>
                        <div className="text-right">Receipt</div>
                      </div>
                      <div className="grid grid-cols-3 p-3 text-sm border-t">
                        <div>Jul 15, 2023</div>
                        <div>$25.00</div>
                        <div className="text-right">
                          <Button variant="link" className="p-0 h-auto text-[#6A0DAD]">
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 p-3 text-sm border-t">
                        <div>Jun 15, 2023</div>
                        <div>$25.00</div>
                        <div className="text-right">
                          <Button variant="link" className="p-0 h-auto text-[#6A0DAD]">
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No billing history available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
