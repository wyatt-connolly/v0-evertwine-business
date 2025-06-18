"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  signUp as signUpFunction,
  signInWithGoogle,
  useAuthState,
  isPreviewEnvironment,
  handleAuthRedirect,
} from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, Info, Eye, EyeOff, CheckCircle, XCircle, Home } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import FirestorePermissionError from "@/components/firestore-permission-error"
import FirebaseError from "@/components/firebase-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SignupPage() {
  const { firebaseInitialized, user, loading } = useAuthState()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState("")
  const [permissionError, setPermissionError] = useState(false)
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [error, setError] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false,
  })
  const router = useRouter()
  const { toast } = useToast()

  // Check if we're in a preview environment
  useEffect(() => {
    setIsPreview(isPreviewEnvironment())
  }, [])

  // Password validation
  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      match: password === confirmPassword && password.length > 0 && confirmPassword.length > 0,
    })
  }, [password, confirmPassword])

  // Handle redirect result from social login
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await handleAuthRedirect()
        if (user) {
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

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setPermissionError(false)
    setDuplicateEmail(false)
    setError("")

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements and passwords match.")
      setIsLoading(false)
      return
    }

    try {
      await signUpFunction(email, password, {
        name,
        phone,
      })

      toast({
        title: "Account created successfully! 🎉",
        description: "Welcome to Evertwine Business Portal! You can now create promotions.",
        className: "bg-green-50 border-green-200",
        duration: 5000,
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Signup error:", error)

      let errorMessage = "Failed to create account. Please try again."

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        setDuplicateEmail(true)
        errorMessage = "This email address is already registered. Please use a different email or try logging in."
      } else if (
        error.message &&
        (error.message.includes("Missing or insufficient permissions") ||
          error.message.includes("permission-denied") ||
          error.message.includes("security rules are preventing writes"))
      ) {
        setPermissionError(true)
        return
      }

      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Account Creation Failed",
        description: errorMessage,
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
      console.log("🚀 Starting Google sign-up...")
      await signInWithGoogle()
      console.log("✅ Google sign-up successful")

      toast({
        title: "Account created successfully! 🎉",
        description: "Welcome to Evertwine Business Portal!",
        className: "bg-green-50 border-green-200",
      })
    } catch (error) {
      console.error("❌ Google sign-up error:", error)

      let errorMessage = "Failed to sign up with Google. Please try again."

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again."
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-up was cancelled. Please try again."
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized for Google sign-in. Please contact support."
      }

      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Google Sign-up Failed",
        description: errorMessage,
        duration: 5000,
      })

      setSocialLoading("")
    }
  }

  if (permissionError) {
    return <FirestorePermissionError />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Enhanced Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 hover:-translate-y-0.5"
      >
        <Home className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Home</span>
      </Link>

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
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-800 font-semibold">Email Already Registered</AlertTitle>
              <AlertDescription className="text-red-700">
                This email address is already registered. Please use a different email or{" "}
                <Link href="/login" className="underline font-medium">
                  try logging in
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

          {error && !duplicateEmail && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-800 font-semibold">Registration Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
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
                  setDuplicateEmail(false)
                  setError("")
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
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

              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.length ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordValidation.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    At least 8 characters
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.uppercase ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordValidation.uppercase ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    One uppercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.lowercase ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordValidation.lowercase ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    One lowercase letter
                  </div>
                  <div
                    className={`flex items-center gap-1 ${passwordValidation.number ? "text-green-600" : "text-gray-500"}`}
                  >
                    {passwordValidation.number ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    One number
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${passwordValidation.match ? "text-green-600" : "text-red-500"}`}
                >
                  {passwordValidation.match ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {passwordValidation.match ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6A0DAD] hover:bg-[#5a0b93]"
              disabled={isLoading || !isPasswordValid}
            >
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

          {/* Enhanced Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-6 py-1 text-sm font-medium text-gray-500 rounded-full border border-gray-200">
                or create account with
              </span>
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
