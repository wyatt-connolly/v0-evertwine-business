"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Tag,
  Plus,
  Edit,
  Trash2,
  MenuIcon as Restaurant,
  SpadeIcon as Spa,
  ShoppingBag,
  Music,
  Coffee,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore"
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
  const { user, userProfile } = useAuth()
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchPromotions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const promotionsQuery = query(collection(db, "promotions"), where("businessId", "==", user.uid))
      const promotionsSnapshot = await getDocs(promotionsQuery)
      const promotionsData = promotionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPromotions(promotionsData)
    } catch (error: any) {
      console.error("Error fetching promotions:", error)
      setError(error.message || "Failed to load promotions")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load promotions. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [user])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, "promotions", id))
      setPromotions(promotions.filter((promo) => promo.id !== id))
      toast({
        title: "Promotion deleted",
        description: "The promotion has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete promotion. Please try again.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const canCreatePromotion = () => {
    if (!userProfile) return false
    return (userProfile.promotions_used || 0) < (userProfile.promotions_limit || 2)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">Error Loading Promotions</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchPromotions} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
          Try Again
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Promotions</h1>
          <p className="text-muted-foreground">Create and manage your business promotions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            Plan: <span className="font-medium capitalize">{userProfile?.plan || "Free"}</span> (
            {userProfile?.promotions_used || 0} of {userProfile?.promotions_limit || 2} used)
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={() => router.push("/dashboard/promotions/new")}
                    className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
                    disabled={!canCreatePromotion()}
                    data-walkthrough="create-promotion"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Promotion
                  </Button>
                </div>
              </TooltipTrigger>
              {!canCreatePromotion() && (
                <TooltipContent>
                  <p>Upgrade to Premium to create more promotions</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {promotions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => {
            const CategoryIcon = categoryIcons[promotion.category] || Tag
            return (
              <Card key={promotion.id} className="overflow-hidden">
                <div className="aspect-video w-full relative">
                  {promotion.imageURL ? (
                    <img
                      src={promotion.imageURL || "/placeholder.svg"}
                      alt={promotion.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <CategoryIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promotion.status === "live"
                          ? "bg-green-100 text-green-800"
                          : promotion.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {promotion.status === "live" ? "Live" : promotion.status === "pending" ? "Pending" : "Expired"}
                    </span>
                  </div>
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    <CardDescription>{promotion.category}</CardDescription>
                  </div>
                  <CardTitle className="text-lg">{promotion.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{promotion.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {promotion.address ? <span>{promotion.address}</span> : <span>No address</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/dashboard/promotions/${promotion.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the promotion.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(promotion.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deletingId === promotion.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No promotions yet</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Create your first promotion to attract more customers to your business.
            </p>
            <Button
              onClick={() => router.push("/dashboard/promotions/new")}
              className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
              disabled={!canCreatePromotion()}
              data-walkthrough="create-promotion"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Promotion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
