"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, TrendingUp, Settings, Calendar } from "lucide-react"

export default function Dashboard() {
  const [activePromotions, setActivePromotions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        // Count active promotions
        try {
          const promotionsQuery = query(
            collection(db, "promotions"),
            where("business_id", "==", user.uid),
            where("status", "==", "live"),
          )
          const promotionsSnapshot = await getDocs(promotionsQuery)
          setActivePromotions(promotionsSnapshot.size)
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#6A0DAD]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Evertwine Business!</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/promotions/new">
            <Button className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Promotion
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromotions}</div>
            <p className="text-xs text-muted-foreground">
              {activePromotions === 0 ? "Create your first promotion!" : "Promotions currently active"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Stats</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/analytics" className="text-[#6A0DAD] hover:underline">
                Check your promotion performance
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Profile</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/settings" className="text-[#6A0DAD] hover:underline">
                Update your business information
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent business activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activePromotions === 0
                      ? "No recent activity"
                      : `You have ${activePromotions} active promotion${activePromotions === 1 ? "" : "s"}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activePromotions === 0
                      ? "Create your first promotion to get started"
                      : "Check your dashboard for details"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard/promotions/new">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Promotion
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
