"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function FirestorePermissionError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-4 text-center">Firestore Permission Error</h1>
        <p className="mb-6 text-gray-700">
          Your Firebase security rules are preventing write operations to the Firestore database. This is a common issue
          when setting up a new Firebase project.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">How to fix this:</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Go to your{" "}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6A0DAD] underline"
              >
                Firebase Console
              </a>
            </li>
            <li>
              Select your project: <span className="font-mono bg-gray-200 px-1 rounded">evertwine-qm8y7p</span>
            </li>
            <li>
              In the left sidebar, click on <span className="font-semibold">Firestore Database</span>
            </li>
            <li>
              Click on the <span className="font-semibold">Rules</span> tab
            </li>
            <li>Replace the current rules with the following:</li>
          </ol>

          <div className="bg-gray-800 text-white p-4 rounded mt-4 overflow-x-auto">
            <pre className="text-sm">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for the business_users collection
    match /business_users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read/write access to all users for the promotions collection
    match /promotions/{promotionId} {
      allow read: if true;  // Anyone can read promotions
      allow write: if request.auth != null && request.resource.data.businessId == request.auth.uid;
    }
  }
}`}
            </pre>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            <strong>Note:</strong> These rules allow users to read and write only their own business data and
            promotions. You may need to adjust them based on your specific security requirements.
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => (window.location.href = "/signup")} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
