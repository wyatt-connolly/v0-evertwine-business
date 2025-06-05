"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function WebhookConfigPage() {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [customerId, setCustomerId] = useState("cus_SRZzpwhBQjHkgz")
  const [userId, setUserId] = useState("2Z7iimyArINI07VgX1wZBSxLMGq1")

  // The public webhook URL that doesn't require authentication
  const webhookUrl = "https://v0-business-evertwine-git-develop-wyattconnollys-projects.vercel.app/api/public-webhook"

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/configure-webhook")
      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (error) {
      console.error("Error loading webhooks:", error)
    }
    setLoading(false)
  }

  const createWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/configure-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      })
      const data = await response.json()
      setResult(data)
      await loadWebhooks()
    } catch (error) {
      console.error("Error creating webhook:", error)
    }
    setLoading(false)
  }

  const updateCustomerId = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/update-customer-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, customerId }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error updating customer ID:", error)
    }
    setLoading(false)
  }

  const testWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "customer.subscription.updated",
          customerId,
          userId,
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error testing webhook:", error)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Webhook Configuration</h1>
        <Button onClick={loadWebhooks} disabled={loading}>
          {loading ? "Loading..." : "Refresh Webhooks"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Webhook URL</CardTitle>
          <CardDescription>Use this URL for Stripe webhooks (no authentication required)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Webhook URL:</label>
            <Input value={webhookUrl} readOnly className="mt-1" />
          </div>

          <div className="flex gap-2">
            <Button onClick={createWebhook} disabled={loading}>
              Create Webhook
            </Button>
            <Button onClick={testWebhook} variant="outline" disabled={loading}>
              Test Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Customer ID</CardTitle>
          <CardDescription>Link a Stripe customer to a Firebase user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">User ID:</label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Customer ID:</label>
            <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={updateCustomerId} disabled={loading}>
            Update Customer ID
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto bg-gray-50 p-4 rounded-lg">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Webhooks</CardTitle>
          <CardDescription>Current webhook endpoints configured in Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-gray-500">No webhooks found. Click "Refresh Webhooks" to load.</p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook: any) => (
                <div key={webhook.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{webhook.url}</p>
                      <p className="text-sm text-gray-500">ID: {webhook.id}</p>
                      <p className="text-sm text-gray-500">Created: {webhook.created}</p>
                    </div>
                    <Badge variant={webhook.status === "enabled" ? "default" : "secondary"}>{webhook.status}</Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Events:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.enabled_events.map((event: string) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
