"use client"

import { useState } from "react"
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

export default function SettingsPage() {
  const { user, userProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [businessName, setBusinessName] = useState(userProfile?.businessName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState(userProfile?.phone || "")
  const [address, setAddress] = useState(userProfile?.address || "")
  const [bio, setBio] = useState(userProfile?.bio || "")
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || null)

  const handleSaveProfile = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleChangePassword = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
      setIsLoading(false)
    }, 1000)
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
                        onClick={() => setPhotoPreview(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#6A0DAD]">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">Upload a square image for best results</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Customer Interactions</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when customers interact with your promotions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Receive tips and best practices for promoting your business
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Important notifications about your account and billing
                    </p>
                  </div>
                  <Switch defaultChecked />
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
                        <p className="font-medium capitalize">{userProfile?.plan || "Free"} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {userProfile?.plan === "premium" ? "5 promotions allowed" : "2 promotions allowed"}
                        </p>
                      </div>
                      {userProfile?.plan === "premium" ? (
                        <div className="text-sm">
                          <p className="font-medium">$25/month</p>
                          <p className="text-muted-foreground">Next billing: Aug 15, 2023</p>
                        </div>
                      ) : (
                        <Button className="bg-[#6A0DAD] hover:bg-[#5a0b93]">Upgrade to Premium</Button>
                      )}
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
                    <p className="text-sm text-muted-foreground">No billing history available for free plan</p>
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
