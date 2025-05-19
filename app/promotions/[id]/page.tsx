"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, MapPin, Calendar, Share2 } from "lucide-react"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export default function PromotionDetailsPage({ params }: { params: { id: string } }) {
  const [promotion, setPromotion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPromotionDetails = async () => {
      if (params.id) {
        try {
          const docRef = doc(db, "promotions", params.id)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()

            // Only show live promotions
            if (data.status !== "live") {
              router.push("/promotions")
              return
            }

            setPromotion({
              id: docSnap.id,
              ...data,
            })

            // Increment view count
            await updateDoc(docRef, {
              views: increment(1),
            })
          } else {
            router.push("/promotions")
          }
        } catch (error) {
          console.error("Error fetching promotion details:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchPromotionDetails()
  }, [params.id, router])

  const handleOpenMap = () => {
    if (promotion?.address) {
      // Increment click count
      const incrementClicks = async () => {
        try {
          const docRef = doc(db, "promotions", promotion.id)
          await updateDoc(docRef, {
            clicks: increment(1),
          })
        } catch (error) {
          console.error("Error incrementing clicks:", error)
        }
      }

      incrementClicks()

      // Open map in new tab
      window.open(`https://maps.google.com/?q=${encodeURIComponent(promotion.address)}`, "_blank")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: promotion.title,
          text: promotion.description,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Promotion not found</h2>
          <p className="text-gray-500 mb-4">The promotion you're looking for doesn't exist or has expired.</p>
          <Button onClick={() => router.push("/promotions")} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
            Back to Promotions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push("/promotions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to promotions
        </Button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {promotion.imageURL ? (
            <div className="aspect-video w-full">
              <img
                src={promotion.imageURL || "/placeholder.svg"}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No image available</span>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#6A0DAD] bg-opacity-10 text-[#6A0DAD] text-xs font-medium rounded-full">
                {promotion.category}
              </span>
              {promotion.expirationDate && (
                <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Expires {format(new Date(promotion.expirationDate), "MMM d, yyyy")}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-4">{promotion.title}</h1>

            <p className="text-gray-700 mb-6">{promotion.description}</p>

            <div className="space-y-4">
              {promotion.address && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-[#6A0DAD] mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Location</h3>
                        <p className="text-gray-600">{promotion.address}</p>
                        <Button variant="link" className="px-0 h-auto text-[#6A0DAD]" onClick={handleOpenMap}>
                          View on map
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {promotion.expirationDate && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[#6A0DAD] mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Valid Until</h3>
                        <p className="text-gray-600">{format(new Date(promotion.expirationDate), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                className="flex-1 bg-[#6A0DAD] hover:bg-[#5a0b93]"
                onClick={() => window.open(`tel:${promotion.phone || ""}`, "_blank")}
              >
                Contact Business
              </Button>
              <Button variant="outline" className="w-10 h-10 p-0" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
