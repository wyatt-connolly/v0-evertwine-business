"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db, storage } from "@/lib/firebase"
import { doc, getDoc, updateDoc, GeoPoint } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Bell, Shield, Building } from "lucide-react"
import { AddressAutocomplete } from "@/components/address-autocomplete"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState({
    business_name: "",
    contact_email: "",
    bio: "",
    photo_url: "",
    address: "",
  })
  const [notifications, setNotifications] = useState({
    new_followers: true,
    promotion_reminders: true,
    weekly_summary: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const userDocRef = doc(db, "business_users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          setProfile({
            business_name: data.business_name || "",
            contact_email: data.contact_email || user.email || "",
            bio: data.bio || "",
            photo_url: data.photo_url || "",
            address: data.address || "",
          })
          setNotifications({
            new_followers: data.notifications?.new_followers ?? true,
            promotion_reminders: data.notifications?.promotion_reminders ?? true,
            weekly_summary: data.notifications?.weekly_summary ?? false,
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "Could not retrieve your settings. Please try again later.",
        })
      }
      setIsLoading(false)
    }
    fetchUserData()
  }, [user, toast])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = (address: string, place?: any) => {
    const updatedProfile: any = { ...profile, address }
    if (place && place.lat && place.lng) {
      updatedProfile.location = new GeoPoint(place.lat, place.lng)
    }
    setProfile(updatedProfile)
  }

  const handleNotificationChange = (name: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const storageRef = ref(storage, `business_photos/${user.uid}/${file.name}`)
    setIsSaving(true)
    try {
      await uploadBytes(storageRef, file)
      const photo_url = await getDownloadURL(storageRef)
      setProfile((prev) => ({ ...prev, photo_url }))
      toast({ title: "Success", description: "Profile photo updated." })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your photo." })
    }
    setIsSaving(false)
  }

  const handleSaveChanges = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const userDocRef = doc(db, "business_users", user.uid)
      await updateDoc(userDocRef, {
        ...profile,
        notifications,
      })
      toast({ title: "Success", description: "Your settings have been saved." })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your settings." })
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile, notifications, and security.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          {/* Business Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Profile
              </CardTitle>
              <CardDescription>Update your business's public information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.photo_url || "/placeholder.svg"} alt={profile.business_name} />
                  <AvatarFallback>
                    {profile.business_name
                      ? profile.business_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "B"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button as="span" variant="outline">
                      Upload Photo
                    </Button>
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 400x400px, JPG or PNG</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={profile.business_name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={profile.contact_email}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Business Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell customers about your business..."
                  className="resize-none"
                />
              </div>
              <AddressAutocomplete
                label="Business Address"
                value={profile.address}
                onChange={handleAddressChange}
                placeholder="Search for your business address"
              />
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                new_followers: "New Followers",
                promotion_reminders: "Promotion Reminders",
                weekly_summary: "Weekly Summary Email",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor={key} className="font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={notifications[key as keyof typeof notifications]}
                    onCheckedChange={() => handleNotificationChange(key as keyof typeof notifications)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Security Card */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled>
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
