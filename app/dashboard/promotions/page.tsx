import PromotionTable from "@/app/ui/promotions/promotion-table"
import { CreatePromotion } from "@/app/ui/promotions/buttons"
import { lusitana } from "@/app/ui/fonts"
import { Suspense } from "react"
import { PromotionsTableSkeleton } from "@/app/ui/skeletons"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promotions",
}

export default async function Page() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Promotions</h1>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <CreatePromotion />
      </div>
      <Suspense fallback={<PromotionsTableSkeleton />}>
        <PromotionTable />
      </Suspense>
    </div>
  )
}
