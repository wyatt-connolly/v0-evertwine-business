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
  Eye,
  MousePointerClick,
  Target,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Zap,
  Activity,
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
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-evertwine-200 border-t-evertwine-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto pt-20 sm:pt-24 md:pt-28">
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 lg:p-12">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Welcome back!</h1>
                  <p className="text-lg text-purple-100 font-medium">Ready to grow your business today?</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard/promotions/new">
                  <Button
                    size="lg"
                    className="bg-purple-600 text-white hover:bg-purple-700 font-semibold shadow-xl border-0 rounded-xl px-8 py-4 text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <PlusCircle className="mr-3 h-5 w-5" />
                    Create New Promotion
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button
                    size="lg"
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 font-semibold shadow-xl border border-white/30 rounded-xl px-8 py-4 text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    View Analytics
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats preview in hero */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{activePromotions}</div>
                <div className="text-sm text-purple-100">Active Promotions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
                <div className="text-sm text-purple-100">Total Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Active Promotions</CardTitle>
            <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">{activePromotions}</div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {activePromotions === 0 ? "Create your first promotion!" : "Promotions currently live"}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Views</CardTitle>
            <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              People who viewed your promotions
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Total Clicks</CardTitle>
            <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <MousePointerClick className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Engagement with your promotions</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">Click Rate</CardTitle>
            <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">{ctr}%</div>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Average click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Activity Section */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                    Your latest business updates
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePromotions > 0 ? (
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-6 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                      You have {activePromotions} active promotion{activePromotions === 1 ? "" : "s"}
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      Reaching customers and driving engagement
                    </p>
                  </div>
                  <Link href="/dashboard/promotions">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 border-0 rounded-xl px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      View All
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <PlusCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Ready to create your first promotion?
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Start reaching more customers today
                    </p>
                  </div>
                  <Link href="/dashboard/promotions/new">
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700 border-0 rounded-xl px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Get Started
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 p-6 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Analytics insights available
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Track your promotion performance
                  </p>
                </div>
                <Link href="/dashboard/analytics">
                  <Button
                    size="sm"
                    className="bg-purple-600 text-white hover:bg-purple-700 border-0 rounded-xl px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    View Analytics
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                  Common tasks to grow your business
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/promotions/new">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-6 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <PlusCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Create New Promotion
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        Attract more customers
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/analytics">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 p-6 border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                        View Analytics
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        Track performance
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/settings">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 p-6 border border-amber-200/50 dark:border-amber-700/50 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        Update Profile
                      </div>
                      <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Manage your account</div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
