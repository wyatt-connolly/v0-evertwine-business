"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2,
  Search,
  QrCode,
  ChevronRight,
  MenuIcon as Restaurant,
  SpadeIcon as Spa,
  ShoppingBag,
  Music,
  Coffee,
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Category icon mapping
const categoryIcons: Record<string, any> = {
  Restaurant: Restaurant,
  Spa: Spa,
  Retail: ShoppingBag,
  Entertainment: Music,
  Other: Coffee,
}

export default function PromotionsPage() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<any[]>([])
  const [filteredPromotions, setFilteredPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const router = useRouter()

  const categories = ["All", "Restaurant", "Spa", "Retail", "Entertainment", "Other"]

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true)
      try {
        // Only fetch live promotions
        const promotionsQuery = query(collection(db, "promotions"), where("status", "==", "live"))
        const promotionsSnapshot = await getDocs(promotionsQuery)
        const promotionsData = promotionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setPromotions(promotionsData)
        setFilteredPromotions(promotionsData)
      } catch (error) {
        console.error("Error fetching promotions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  useEffect(() => {
    // Filter promotions based on search query and selected category
    let filtered = promotions

    if (searchQuery) {
      filtered = filtered.filter(
        (promo) =>
          promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          promo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          promo.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((promo) => promo.category === selectedCategory)
    }

    setFilteredPromotions(filtered)
  }, [searchQuery, selectedCategory, promotions])

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Promotions</h1>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => router.push("/my-qr-code")}>
              <QrCode className="h-4 w-4" />
              My QR Code
            </Button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search promotions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex space-x-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={selectedCategory === category ? "bg-[#6A0DAD] hover:bg-[#5a0b93]" : ""}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
          </div>
        ) : filteredPromotions.length > 0 ? (
          <div className="space-y-4">
            {filteredPromotions.map((promotion) => {
              const CategoryIcon = categoryIcons[promotion.category] || Coffee
              return (
                <Card
                  key={promotion.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/promotions/${promotion.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 flex-shrink-0">
                        {promotion.imageURL ? (
                          <img
                            src={promotion.imageURL || "/placeholder.svg"}
                            alt={promotion.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CategoryIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500">{promotion.category}</span>
                        </div>
                        <h3 className="font-medium mb-1">{promotion.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{promotion.description}</p>
                        {promotion.address && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>📍</span>
                            <span>{promotion.address}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center pr-4">
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <h3 className="text-lg font-medium mb-2">No promotions found</h3>
              <p className="text-gray-500 mb-4">
                {selectedCategory !== "All"
                  ? `There are no ${selectedCategory} promotions available at the moment.`
                  : "There are no promotions available at the moment."}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("All")
                  setSearchQuery("")
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
