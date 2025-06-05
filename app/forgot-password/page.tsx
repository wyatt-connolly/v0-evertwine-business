"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resetPassword } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSubmitted(true)

      toast({
        title: "Password reset email sent! 📧",
        description: "Check your inbox for instructions to reset your password.",
        className: "bg-green-50 border-green-200",
        duration: 6000,
      })
    } catch (error: any) {
      let errorMessage = "Please check your email address and try again."

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address. Please check your email or create a new account."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many password reset attempts. Please try again later."
      }

      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSignIn = () => {
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            {isSubmitted
              ? "We've sent you a password reset link"
              : "Enter your email address and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Email sent successfully!</h3>
                <p className="text-green-700 text-sm mb-4">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <div className="bg-white p-3 rounded border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                    <Mail className="h-4 w-4" />
                    Check your email inbox
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full bg-[#6A0DAD] hover:bg-[#5a0b93]" onClick={handleBackToSignIn}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>

                <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                  Send another email
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Didn't receive the email?</p>
                <ul className="list-disc list-inside text-left space-y-1">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes for delivery</li>
                </ul>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-center"
                />
              </div>
              <Button type="submit" className="w-full bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-[#6A0DAD] hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
