"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  signUp,
  signInWithGoogle,
  signInWithFacebook,
  useAuthState,
  isPreviewEnvironment,
  handleAuthRedirect,
} from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, Info } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import FirestorePermissionError from "@/components/firestore-permission-error"
import FirebaseError from "@/components/firebase-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SignupPage() {
  const { firebaseInitialized, firebaseInitError, user, loading } = useAuthState()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState("")
  const [permissionError, setPermissionError] = useState(false)
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [error, setError] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check if we're in a preview environment
  useEffect(() => {
    // Only set preview mode if we're in a known preview environment
    setIsPreview(isPreviewEnvironment())
  }, [])

  // Handle redirect result from social login
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await handleAuthRedirect()
        if (user) {
          // If we got a user from the redirect, navigate to dashboard
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error handling redirect result:", error)
        setError(error.message || "Failed to complete social sign-in. Please try again.")
      }
    }

    if (!loading && !user) {
      checkRedirectResult()
    }
  }, [loading, router, user])

  // If Firebase is not initialized, show the error component
  if (!firebaseInitialized) {
    return <FirebaseError />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setPermissionError(false)
    setDuplicateEmail(false)
    setError("")

    try {
      await signUp(email, password, {
        name,
        phone,
      })

      toast({
        title: "Account created successfully",
        description: "Welcome to Evertwine Business Portal!",
      })

      router.push("/dashboard") // Redirect to dashboard instead of onboarding
    } catch (error) {
      console.error("Signup error:", error)

      // Check if it's a duplicate email error
      if (error.message === "EMAIL_ALREADY_EXISTS") {
        setDuplicateEmail(true)
      }
      // Check if it's a permission error
      else if (
        error.message &&
        (error.message.includes("Missing or insufficient permissions") ||
          error.message.includes("permission-denied") ||
          error.message.includes("security rules are preventing writes"))
      ) {
        setPermissionError(true)
      } else {
        setError(error.message || "Failed to create account. Please try again.")
      }
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
      await signInWithGoogle()
      // The redirect will happen automatically, so we don't need to do anything here
    } catch (error) {
      console.error("Google sign-in error:", error)
      setError(error.message || "Failed to sign in with Google. Please try again.")
      setSocialLoading("")
    }
  }

  const handleFacebookSignIn = async () => {
    if (isPreview) {
      setError(
        "Social login is not available in preview environments. Please use email/password login or access the application from an authorized domain.",
      )
      return
    }

    setSocialLoading("facebook")
    setError("")

    try {
      await signInWithFacebook()
      // The redirect will happen automatically, so we don't need to do anything here
    } catch (error) {
      console.error("Facebook sign-in error:", error)
      setError(error.message || "Failed to sign in with Facebook. Please try again.")
      setSocialLoading("")
    }
  }

  if (permissionError) {
    return <FirestorePermissionError />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create your Evertwine business account
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

          {duplicateEmail && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email already in use</AlertTitle>
              <AlertDescription>
                This email address is already registered. Please use a different email or try logging in.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@business.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setDuplicateEmail(false) // Clear duplicate email error when email changes
                }}
                required
                className={duplicateEmail ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="phone-input-container">
                <PhoneInput
                  country={"us"}
                  value={phone}
                  onChange={(phone) => setPhone(phone)}
                  inputStyle={{
                    width: "100%",
                    height: "40px",
                    fontSize: "16px",
                    borderRadius: "0.375rem",
                    border: "1px solid #e2e8f0",
                  }}
                  containerStyle={{
                    marginBottom: "0",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
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

          <div className="grid grid-cols-2 gap-4">
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
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFacebookSignIn}
              disabled={!!socialLoading || isPreview}
            >
              {socialLoading === "facebook" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"
                    fill="#1877F2"
                  />
                </svg>
              )}
              Facebook
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-[#6A0DAD] hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
