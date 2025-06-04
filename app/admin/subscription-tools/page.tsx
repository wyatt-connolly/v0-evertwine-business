"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SubscriptionTools() {
  const [userId, setUserId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!userId) {
      setError("User ID is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/sync-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, customerId: customerId || undefined }),
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        setError(data.error || "Failed to sync subscription")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomerId = async () => {
    if (!userId || !customerId) {
      setError("Both User ID and Customer ID are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/update-customer-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, customerId }),
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        setError(data.error || "Failed to update customer ID")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Subscription Management Tools</h1>

      <Tabs defaultValue="sync">
        <TabsList className="mb-4">
          <TabsTrigger value="sync">Sync Subscription</TabsTrigger>
          <TabsTrigger value="update">Update Customer ID</TabsTrigger>
        </TabsList>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Sync User Subscription</CardTitle>
              <CardDescription>Sync a user's subscription status with Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Firebase User ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerId">Customer ID (Optional)</Label>
                  <Input
                    id="customerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Stripe Customer ID (optional)"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSync} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sync Subscription
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="update">
          <Card>
            <CardHeader>
              <CardTitle>Update Customer ID</CardTitle>
              <CardDescription>Update a user's Stripe customer ID and sync their subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="updateUserId">User ID</Label>
                  <Input
                    id="updateUserId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Firebase User ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="updateCustomerId">Customer ID</Label>
                  <Input
                    id="updateCustomerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="Stripe Customer ID"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateCustomerId} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Customer ID
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !error && (
        <Alert className="mt-6" variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
