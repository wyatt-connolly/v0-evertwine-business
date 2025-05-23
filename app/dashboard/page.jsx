"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  PlusCircle,
  TrendingUp,
  Settings,
  Calendar,
  Eye,
  MousePointerClick,
  Users,
  Target,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const [activePromotions, setActivePromotions] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        // Count active promotions and get stats
        try {
          const promotionsQuery = query(
            collection(db, "promotions"),
            where("business_id", "==", user.uid),
            where("status", "==", "live"),
          )
          const promotionsSnapshot = await getDocs(promotionsQuery)
          const promotions = promotionsSnapshot.docs.map((doc) => doc.data())

          setActivePromotions(promotions.length)

          // Calculate total views and clicks
          const views = promotions.reduce((sum, promo) => sum + (promo.views || 0), 0)
          const clicks = promotions.reduce((sum, promo) => sum + (promo.clicks || 0), 0)

          setTotalViews(views)
          setTotalClicks(clicks)
        } catch (error) {
          console.error("Error fetching promotions count:", error)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching business data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    )
  }

  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back!</h1>
              <p className="text-indigo-100">Ready to grow your business today?</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/dashboard/promotions/new">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Promotion
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Promotions</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activePromotions}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {activePromotions === 0 ? "Create your first promotion!" : "Promotions currently live"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Views</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">People who viewed your promotions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Clicks</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <MousePointerClick className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Engagement with your promotions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Click Rate</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{ctr}%</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Average click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest business updates</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
              >
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePromotions > 0 ? (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      You have {activePromotions} active promotion{activePromotions === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Reaching customers and driving engagement
                    </p>
                  </div>
                  <Link href="/dashboard/promotions">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                    >
                      View All
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Ready to create your first promotion?
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Start reaching more customers today</p>
                  </div>
                  <Link href="/dashboard/promotions/new">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Get Started
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Analytics insights available
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Track your promotion performance</p>
                </div>
                <Link href="/dashboard/analytics">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-300 bg-white/80 text-purple-700 hover:bg-purple-100 dark:bg-transparent dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30"
                  >
                    View Analytics
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks to grow your business</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/dashboard/promotions/new">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950/30 dark:hover:to-purple-950/30 transition-all duration-200"
                  data-walkthrough="create-promotion"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <PlusCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Create New Promotion</div>
                      <div className="text-xs text-muted-foreground">Attract more customers</div>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View Analytics</div>
                      <div className="text-xs text-muted-foreground">Track performance</div>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>

              <Link href="/dashboard/settings">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 dark:hover:from-purple-950/30 dark:hover:to-violet-950/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Update Profile</div>
                      <div className="text-xs text-muted-foreground">Manage your account</div>
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
