"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, TestTube, Database, CreditCard, Settings } from "lucide-react"

export default function TestEnvironmentPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [testEmail, setTestEmail] = useState(user?.email || "")

  const checkSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-firebase-setup")
      const data = await response.json()
      setSetupData(data)

      if (data.success) {
        toast({
          title: "Setup Check Complete",
          description: "Review the results below",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Setup Check Failed",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const seedTestData = async () => {
    if (!user || !testEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please ensure you're logged in and email is provided",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/seed-test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: testEmail,
          subscriptionType: "development",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Test Data Created",
          description: "Your account now has test subscription data",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Create Test Data",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const testSubscriptionCheck = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/debug-subscription?userId=${user.uid}`)
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Subscription Check Complete",
          description: `Status: ${data.debug.subscriptionAnalysis.finalResult ? "Active" : "Inactive"}`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subscription Check Failed",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          Test Environment
        </h1>
        <p className="text-muted-foreground mt-2">Set up and test your development environment with test keys</p>
      </div>

      {/* Current User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>User ID</Label>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">{user.uid}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Setup Check
          </CardTitle>
          <CardDescription>Verify your Firebase and Stripe test configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkSetup} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check Setup
          </Button>

          {setupData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(setupData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Data Seeding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create Test Subscription
          </CardTitle>
          <CardDescription>Add test subscription data to your account for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Email</Label>
            <Input
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <Button onClick={seedTestData} disabled={loading || !user} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Test Subscription Data
          </Button>
        </CardContent>
      </Card>

      {/* Test Subscription Check */}
      <Card>
        <CardHeader>
          <CardTitle>Test Subscription Check</CardTitle>
          <CardDescription>Verify that subscription checking is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testSubscriptionCheck} disabled={loading || !user} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Subscription Check
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href="/api/test-firebase-setup" target="_blank" rel="noreferrer">
                Firebase Setup Check
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/test-firebase-admin" target="_blank" rel="noreferrer">
                Firebase Admin Test
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/test-stripe" target="_blank" rel="noreferrer">
                Stripe Connection Test
              </a>
            </Button>
            {user && (
              <Button variant="outline" asChild>
                <a href={`/api/debug-subscription?userId=${user.uid}`} target="_blank" rel="noreferrer">
                  Debug Subscription
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
