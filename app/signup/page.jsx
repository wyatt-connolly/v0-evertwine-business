"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp, useAuthState } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import FirestorePermissionError from "@/components/firestore-permission-error"
import FirebaseError from "@/components/firebase-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SignupPage() {
  const { firebaseInitialized, firebaseInitError } = useAuthState()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [permissionError, setPermissionError] = useState(false)
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // If Firebase is not initialized, show the error component
  if (!firebaseInitialized) {
    return <FirebaseError />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setPermissionError(false)
    setDuplicateEmail(false)

    try {
      await signUp(email, password, {
        name,
        phone,
        onboardingComplete: false,
      })

      toast({
        title: "Account created successfully",
        description: "Welcome to Evertwine Business Portal!",
      })

      router.push("/onboarding/business-info")
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
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "Failed to create account. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
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
          {duplicateEmail && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email already in use</AlertTitle>
              <AlertDescription>
                This email address is already registered. Please use a different email or try logging in.
              </AlertDescription>
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
            <Button variant="outline" className="w-full">
              Google
            </Button>
            <Button variant="outline" className="w-full">
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
