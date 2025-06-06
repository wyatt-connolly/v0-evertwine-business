"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageCarousel } from "@/components/image-carousel"
import { Calendar, MapPin, Eye, Edit, Trash2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromotionCardProps {
  promotion: {
    id: string
    title: string
    description: string
    images: string[]
    status: "active" | "inactive" | "expired" | "scheduled"
    startDate: string
    endDate: string
    location?: string
    views?: number
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  onShare?: (id: string) => void
  className?: string
}

const statusConfig = {
  active: { label: "Active", variant: "default" as const, color: "bg-green-500" },
  inactive: { label: "Inactive", variant: "secondary" as const, color: "bg-gray-500" },
  expired: { label: "Expired", variant: "destructive" as const, color: "bg-red-500" },
  scheduled: { label: "Scheduled", variant: "outline" as const, color: "bg-blue-500" },
}

export function PromotionCard({ promotion, onEdit, onDelete, onView, onShare, className }: PromotionCardProps) {
  const status = statusConfig[promotion.status]

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative">
        <ImageCarousel images={promotion.images} />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant={status.variant} className="shadow-sm">
            <div className={cn("w-2 h-2 rounded-full mr-1.5", status.color)} />
            {status.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {promotion.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{promotion.description}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(promotion.startDate).toLocaleDateString()}</span>
          </div>
          {promotion.views !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{promotion.views} views</span>
            </div>
          )}
        </div>

        {promotion.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{promotion.location}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(promotion.id)} className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(promotion.id)} className="flex-1">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        {onShare && (
          <Button variant="outline" size="sm" onClick={() => onShare(promotion.id)}>
            <Share2 className="w-4 h-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(promotion.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
