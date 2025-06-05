"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, signInWithGoogle, useAuthState, isPreviewEnvironment } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Info, Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react"
import FirebaseError from "@/components/firebase-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState("")
  const [error, setError] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading, firebaseInitialized } = useAuthState()

  // Check if we're in a preview environment
  useEffect(() => {
    setIsPreview(isPreviewEnvironment())
  }, [])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log("✅ User authenticated, redirecting to dashboard:", user.email)
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // If Firebase is not initialized, show the error component
  if (!firebaseInitialized) {
    return <FirebaseError />
  }

  const getErrorMessage = (error) => {
    const errorCode = error.code || error.message

    switch (errorCode) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password. Please check your credentials and try again."
      case "auth/invalid-email":
        return "Please enter a valid email address."
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support for assistance."
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later or reset your password."
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await signIn(email, password)

      // Show success toast
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
        className: "bg-green-50 border-green-200",
      })
    } catch (error) {
      console.error("Login error:", error)
      const friendlyMessage = getErrorMessage(error)
      setError(friendlyMessage)

      // Show enhanced error toast
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: friendlyMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isPreview) {
      setError(
        "Social login is not available in preview environments. Please use email/password login or access the application from an authorized domain.",
      )
      return
    }

    setSocialLoading("google")
    setError("")

    try {
      console.log("🚀 Starting Google sign-in...")
      const user = await signInWithGoogle()
      console.log("✅ Google sign-in successful:", user.email)

      toast({
        title: "Welcome back!",
        description: `Successfully signed in with Google as ${user.email}`,
        className: "bg-green-50 border-green-200",
      })
    } catch (error) {
      console.error("❌ Google sign-in error:", error)

      let errorMessage = "Failed to sign in with Google. Please try again."

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again."
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again."
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for Google sign-in. Please contact support."
      }

      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Google Sign-in Failed",
        description: errorMessage,
        duration: 5000,
      })

      setSocialLoading("")
    }
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD] mx-auto mb-4" />
          <p className="text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center text-sm text-gray-600 hover:text-[#6A0DAD] transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in to Evertwine</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your business portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPreview && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Development Environment Detected</AlertTitle>
              <AlertDescription>
                Social login may not work in this development environment. If you encounter errors, please use
                email/password login instead.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-red-800 font-semibold">Authentication Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("") // Clear error when user starts typing
                }}
                required
                className={error ? "border-red-300 focus-visible:ring-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-[#6A0DAD] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("") // Clear error when user starts typing
                  }}
                  required
                  className={error ? "border-red-300 focus-visible:ring-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={!!socialLoading || isPreview}
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#6A0DAD] hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
