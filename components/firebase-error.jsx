"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { firebaseInitError } from "@/lib/firebase"

export default function FirebaseError() {
  // Get the specific error message
  const errorMessage = firebaseInitError
    ? firebaseInitError.message || "Unknown Firebase initialization error"
    : "Unknown Firebase initialization error"

  const errorCode = firebaseInitError?.code || "unknown"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Firebase Connection Error</h1>
        <p className="mb-6 text-gray-700">
          There was an error connecting to Firebase. This could be due to network issues or Firebase configuration.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
          <p className="text-sm font-mono mb-2">Error details:</p>
          <p className="text-sm font-mono text-red-500">{errorMessage}</p>
          {errorCode !== "unknown" && <p className="text-sm font-mono text-red-500 mt-1">Code: {errorCode}</p>}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg text-left mb-6">
          <p className="text-sm font-mono mb-2">Troubleshooting steps:</p>
          <ul className="text-sm space-y-1 text-gray-600 list-disc pl-5">
            <li>Check your internet connection</li>
            <li>Clear your browser cache and cookies</li>
            <li>Try using a different browser</li>
            <li>Verify that your Firebase project is properly set up</li>
            <li>Make sure Firebase services (Auth, Firestore) are enabled in your project</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
            Retry Connection
          </Button>
          <Button onClick={() => (window.location.href = "/login")} variant="outline">
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}
