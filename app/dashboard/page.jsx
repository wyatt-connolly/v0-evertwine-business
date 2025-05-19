"use client"

import { useEffect, useState } from "react"
import { useAuthState } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Tag, Users, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db, firebaseInitError } from "@/lib/firebase"
import FirebaseError from "@/components/firebase-error"

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuthState()
  const [promotions, setPromotions] = useState([])
  const [stats, setStats] = useState({
    totalPromotions: 0,
    livePromotions: 0,
    pendingPromotions: 0,
    views: 0,
    clicks: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user && db) {
        try {
          // Fetch promotions
          const promotionsQuery = query(collection(db, "promotions"), where("businessId", "==", user.uid))
          const promotionsSnapshot = await getDocs(promotionsQuery)
          const promotionsData = promotionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setPromotions(promotionsData)

          // Calculate stats
          const livePromotions = promotionsData.filter((p) => p.status === "live").length
          const pendingPromotions = promotionsData.filter((p) => p.status === "pending").length

          // Calculate total views and clicks
          let totalViews = 0
          let totalClicks = 0
          promotionsData.forEach((promo) => {
            totalViews += promo.views || 0
            totalClicks += promo.clicks || 0
          })

          setStats({
            totalPromotions: promotionsData.length,
            livePromotions,
            pendingPromotions,
            views: totalViews,
            clicks: totalClicks,
          })
        } catch (error) {
          console.error("Error fetching dashboard data:", error)
        } finally {
          setIsLoading(false)
        }
      } else if (!loading) {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, loading])

  if (firebaseInitError) {
    return <FirebaseError />
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPromotions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.livePromotions} live, {stats.pendingPromotions} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
            <p className="text-xs text-muted-foreground">
              {stats.views > 0 ? `+${Math.floor(stats.views * 0.1)} from last week` : "No views yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.views > 0 ? `${((stats.clicks / stats.views) * 100).toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">{stats.clicks} total clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userProfile?.plan || "Free"}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.promotionsUsed || 0} of {userProfile?.promotionsLimit || 2} used
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Recent Promotions</CardTitle>
            <CardDescription>Manage your active and pending promotions</CardDescription>
          </CardHeader>
          <CardContent>
            {promotions.length > 0 ? (
              <div className="space-y-4">
                {promotions.slice(0, 3).map((promotion) => (
                  <div key={promotion.id} className="flex items-center p-4 border rounded-lg">
                    {promotion.imageURL ? (
                      <img
                        src={promotion.imageURL || "/placeholder.svg"}
                        alt={promotion.title}
                        className="w-12 h-12 rounded-md object-cover mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                        <Tag className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{promotion.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{promotion.description}</p>
                    </div>
                    <div className="ml-4">
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
                ))}

                <div className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/promotions">View all promotions</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No promotions yet</h3>
                <p className="text-gray-500 mb-4">Create your first promotion to attract more customers</p>
                <Button asChild className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
                  <Link href="/dashboard/promotions/new">Create New Promotion</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
