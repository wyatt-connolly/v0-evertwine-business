"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

// Sample data for demonstration
const viewsData = [
  { name: "Jan", views: 65 },
  { name: "Feb", views: 59 },
  { name: "Mar", views: 80 },
  { name: "Apr", views: 81 },
  { name: "May", views: 56 },
  { name: "Jun", views: 55 },
  { name: "Jul", views: 40 },
]

const clicksData = [
  { name: "Jan", clicks: 12 },
  { name: "Feb", clicks: 19 },
  { name: "Mar", clicks: 25 },
  { name: "Apr", clicks: 18 },
  { name: "May", clicks: 29 },
  { name: "Jun", clicks: 15 },
  { name: "Jul", clicks: 22 },
]

const promotionPerformance = [
  { name: "Summer Sale", views: 120, clicks: 45, ctr: 37.5 },
  { name: "Happy Hour", views: 98, clicks: 28, ctr: 28.6 },
  { name: "Weekend Special", views: 86, clicks: 32, ctr: 37.2 },
  { name: "Holiday Discount", views: 99, clicks: 41, ctr: 41.4 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d")

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
                <div className="text-2xl font-bold">436</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">140</div>
                <p className="text-xs text-muted-foreground">+15.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32.1%</div>
                <p className="text-xs text-muted-foreground">-3.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">2 pending approval</p>
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
              <div className="rounded-md border">
                <div className="grid grid-cols-4 bg-muted p-4 text-sm font-medium">
                  <div>Promotion</div>
                  <div className="text-center">Views</div>
                  <div className="text-center">Clicks</div>
                  <div className="text-center">CTR (%)</div>
                </div>
                {promotionPerformance.map((promo, index) => (
                  <div
                    key={promo.name}
                    className={`grid grid-cols-4 p-4 text-sm ${
                      index !== promotionPerformance.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="font-medium">{promo.name}</div>
                    <div className="text-center">{promo.views}</div>
                    <div className="text-center">{promo.clicks}</div>
                    <div className="text-center">{promo.ctr}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Coming Soon</CardTitle>
          <CardDescription>
            We're working on enhancing our analytics features to provide you with more detailed insights about your
            promotions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In the future, you'll be able to track detailed metrics such as:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Demographic information about users viewing your promotions</li>
            <li>Conversion tracking for promotion redemptions</li>
            <li>Geographic distribution of your audience</li>
            <li>Custom date range reporting</li>
            <li>Export capabilities for your analytics data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
