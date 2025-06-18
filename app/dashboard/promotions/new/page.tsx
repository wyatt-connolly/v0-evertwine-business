"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreatePromotionForm } from "./components/create-promotion-form"

export default function NewPromotionPage() {
  return (
    <div className="container max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Promotion</CardTitle>
          <CardDescription>Craft a compelling promotion to boost your sales.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePromotionForm />
        </CardContent>
      </Card>
    </div>
  )
}
