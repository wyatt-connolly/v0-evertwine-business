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
  AlertCircle,
  Eye,
  MousePointerClick,
  CreditCard,
  Calendar,
  MapPin,
} from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Category icon mapping
const categoryIcons: Record<string, any> = {
  Restaurant: Restaurant,
  Spa: Spa,
  Retail: ShoppingBag,
  Entertainment: Music,
  Health: Coffee,
  Other: Coffee,
}

// Category placeholder images
const categoryPlaceholders: Record<string, string> = {
  Restaurant: "/placeholder.svg?height=200&width=300&text=Restaurant",
  Spa: "/placeholder.svg?height=200&width=300&text=Spa",
  Retail: "/placeholder.svg?height=200&width=300&text=Retail",
  Entertainment: "/placeholder.svg?height=200&width=300&text=Entertainment",
  Health: "/placeholder.svg?height=200&width=300&text=Health",
  Other: "/placeholder.svg?height=200&width=300&text=Business",
}

const MAX_PROMOTIONS = 2

export default function PromotionsPage() {
  const { user, hasActiveSubscription, loading: authLoading } = useAuth()
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
      const promotionsQuery = query(collection(db, "promotions"), where("business_id", "==", user.uid))
      const promotionsSnapshot = await getDocs(promotionsQuery)

      const promotionsData = promotionsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((promo) => promo.status === "live")

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
    if (!authLoading && user) {
      fetchPromotions()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, "promotions", id))
      setPromotions(promotions.filter((promo) => promo.id !== id))
      toast({
        title: "Success",
        description: "Promotion deleted successfully.",
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

  const handleCreatePromotion = () => {
    if (!hasActiveSubscription) {
      router.push("/dashboard/billing")
      return
    }
    router.push("/dashboard/promotions/new")
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Error Loading Promotions</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={fetchPromotions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading promotions...</p>
          </div>
        </div>
      </div>
    )
  }

  const reachedLimit = promotions.length >= MAX_PROMOTIONS

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground">Create and manage your business promotions</p>
        </div>
        <Button
          onClick={handleCreatePromotion}
          className="w-full sm:w-auto"
          disabled={reachedLimit && hasActiveSubscription}
        >
          {!hasActiveSubscription ? (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe to Create
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Promotion
            </>
          )}
        </Button>
      </div>

      {/* Subscription Alert */}
      {!hasActiveSubscription && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Subscription Required:</strong> You need an active subscription ($35/month) to create and manage
            promotions.{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-amber-800 dark:text-amber-200 underline font-medium"
              onClick={() => router.push("/dashboard/billing")}
            >
              Subscribe now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold">Promotion Usage</h3>
              <p className="text-sm text-muted-foreground">
                {promotions.length} of {MAX_PROMOTIONS} promotions used
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(promotions.length / MAX_PROMOTIONS) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{Math.round((promotions.length / MAX_PROMOTIONS) * 100)}%</span>
            </div>
          </div>
          {reachedLimit && hasActiveSubscription && (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You've reached your limit of {MAX_PROMOTIONS} promotions. Delete an existing promotion to create a new
                one.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Promotions Grid */}
      {promotions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => {
            const CategoryIcon = categoryIcons[promotion.category] || Tag
            const placeholderImage = categoryPlaceholders[promotion.category] || categoryPlaceholders.Other
            return (
              <Card key={promotion.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-video w-full relative">
                  {promotion.image_url ? (
                    <img
                      src={promotion.image_url || "/placeholder.svg"}
                      alt={promotion.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={placeholderImage || "/placeholder.svg"}
                      alt={`${promotion.category} placeholder`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-foreground">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {promotion.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-1">{promotion.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{promotion.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Location and Date Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {promotion.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{promotion.address}</span>
                      </div>
                    )}
                    {promotion.expiration_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Expires {format(new Date(promotion.expiration_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{promotion.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4" />
                        <span>{promotion.clicks || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/promotions/edit/${promotion.id}`)}
                        disabled={!hasActiveSubscription}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!hasActiveSubscription}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{promotion.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(promotion.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No promotions yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {hasActiveSubscription
                ? "Create your first promotion to attract more customers to your business."
                : "Subscribe to start creating promotions and attract more customers to your business."}
            </p>
            <Button onClick={handleCreatePromotion}>
              {!hasActiveSubscription ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe to Create
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Promotion
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
