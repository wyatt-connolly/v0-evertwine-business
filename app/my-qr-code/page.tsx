"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Share2, ArrowLeft } from "lucide-react"
import { trackQrCodeInteraction } from "@/lib/qr-code-utils"

export default function MyQrCodePage() {
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const router = useRouter()

  useEffect(() => {
    const generateQrCode = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Generate QR code URL - in a real app, this would be a unique code
        // Here we're just using a placeholder with the user ID
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=evertwine-business-${user.uid}`
        setQrCodeUrl(qrUrl)

        // Track that QR code was shown
        await trackQrCodeInteraction(user.uid, "shown")
      } catch (error) {
        console.error("Error generating QR code:", error)
      } finally {
        setLoading(false)
      }
    }

    generateQrCode()
  }, [user])

  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = "evertwine-qr-code.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Evertwine Business QR Code",
          text: "Scan this QR code to view my business promotions",
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleRedeemDemo = async () => {
    if (!user) return

    // Track redemption for demo purposes
    await trackQrCodeInteraction(user.uid, "redeemed")
    alert("QR code redemption simulated successfully!")
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="text-xl">Your Business QR Code</CardTitle>
            <CardDescription className="text-indigo-100">
              Share this QR code with your customers to let them access your promotions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="Business QR Code" className="w-[250px] h-[250px]" />
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-medium text-lg mb-1">
                    {userProfile?.business_name || userProfile?.name || "Your Business"}
                  </h3>
                  <p className="text-gray-500 text-sm">Scan to view all active promotions</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={handleDownload} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-dashed border-indigo-300 text-indigo-600"
                    onClick={handleRedeemDemo}
                  >
                    Simulate QR Code Redemption (Demo)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Display this QR code in your business location or share it digitally</li>
              <li>Customers scan the code with their smartphone camera</li>
              <li>They instantly see all your active promotions</li>
              <li>Track engagement in the Analytics section</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
