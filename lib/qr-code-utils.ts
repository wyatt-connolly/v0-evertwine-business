import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Track QR code interactions
export async function trackQrCodeInteraction(businessId: string, action: "shown" | "redeemed", promotionId?: string) {
  try {
    await addDoc(collection(db, "qr_interactions"), {
      business_id: businessId,
      action,
      promotion_id: promotionId || null,
      timestamp: serverTimestamp(),
    })
    console.log(`QR code ${action} tracked successfully`)
    return true
  } catch (error) {
    console.error(`Error tracking QR code ${action}:`, error)
    return false
  }
}
