"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [promotions, setPromotions] = useState<any[]>([])
  const [totalViews, setTotalViews] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [ctr, setCtr] = useState(0)
  const [viewsData, setViewsData] = useState<any[]>([])
  const [clicksData, setClicksData] = useState<any[]>([])

  useEffect(() => {
    const fetchPromotions = async () => {
      if (!user) return

      setLoading(true)
      try {
        const promotionsQuery = query(collection(db, "promotions"), where("business_id", "==", user.uid))
        const promotionsSnapshot = await getDocs(promotionsQuery)
        const promotionsData = promotionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setPromotions(promotionsData)

        // Calculate totals
        let views = 0
        let clicks = 0

        promotionsData.forEach((promo) => {
          views += promo.views || 0
          clicks += promo.clicks || 0
        })

        setTotalViews(views)
        setTotalClicks(clicks)
        setCtr(views > 0 ? Math.round((clicks / views) * 100) : 0)

        // Generate sample data for charts based on real totals
        // In a real app, you'd fetch historical data from the database
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]

        // Distribute total views across months with some randomness
        const viewsDistribution = months.map((month) => {
          const randomFactor = 0.5 + Math.random()
          return {
            name: month,
            views: Math.round((views / months.length) * randomFactor),
          }
        })

        // Distribute total clicks across months with some randomness
        const clicksDistribution = months.map((month) => {
          const randomFactor = 0.5 + Math.random()
          return {
            name: month,
            clicks: Math.round((clicks / months.length) * randomFactor),
          }
        })

        setViewsData(viewsDistribution)
        setClicksData(clicksDistribution)
      } catch (error) {
        console.error("Error fetching promotions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track the performance of your promotions</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">Total views across all promotions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicks}</div>
                <p className="text-xs text-muted-foreground">Total clicks across all promotions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ctr}%</div>
                <p className="text-xs text-muted-foreground">Average CTR across all promotions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{promotions.length}</div>
                <p className="text-xs text-muted-foreground">Currently active promotions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Views Over Time</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select
                      className="text-sm border rounded p-1"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                </div>
                <CardDescription>Number of views over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#6A0DAD" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clicks Over Time</CardTitle>
                <CardDescription>Number of clicks over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clicksData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#6A0DAD" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Performance</CardTitle>
              <CardDescription>Compare the performance of your active promotions</CardDescription>
            </CardHeader>
            <CardContent>
              {promotions.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 bg-muted p-4 text-sm font-medium">
                    <div>Promotion</div>
                    <div className="text-center">Views</div>
                    <div className="text-center">Clicks</div>
                    <div className="text-center">CTR (%)</div>
                  </div>
                  {promotions.map((promo, index) => {
                    const promoViews = promo.views || 0
                    const promoClicks = promo.clicks || 0
                    const promoCtr = promoViews > 0 ? Math.round((promoClicks / promoViews) * 100) : 0

                    return (
                      <div
                        key={promo.id}
                        className={`grid grid-cols-4 p-4 text-sm ${index !== promotions.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="font-medium">{promo.title}</div>
                        <div className="text-center">{promoViews}</div>
                        <div className="text-center">{promoClicks}</div>
                        <div className="text-center">{promoCtr}%</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No promotions found. Create a promotion to see analytics.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
