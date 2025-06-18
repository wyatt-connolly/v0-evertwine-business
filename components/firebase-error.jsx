"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function FirebaseError() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Connection Error</AlertTitle>
        <AlertDescription>
          Unable to connect to Firebase services. Please check your internet connection and try again.
        </AlertDescription>
      </Alert>
    </div>
  )
}
