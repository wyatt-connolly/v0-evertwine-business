"use client"

import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PromotionFormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  required?: boolean
  description?: string
  className?: string
}

export function PromotionFormField({
  label,
  children,
  error,
  required = false,
  description,
  className,
}: PromotionFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  )
}

interface PromotionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  description?: string
}

export function PromotionInput({ label, error, description, className, ...props }: PromotionInputProps) {
  return (
    <PromotionFormField label={label} error={error} description={description} required={props.required}>
      <Input
        className={cn(
          "transition-all duration-200 focus:ring-2 focus:ring-primary/20",
          error && "border-destructive focus:border-destructive",
          className,
        )}
        {...props}
      />
    </PromotionFormField>
  )
}

interface PromotionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  description?: string
}

export function PromotionTextarea({ label, error, description, className, ...props }: PromotionTextareaProps) {
  return (
    <PromotionFormField label={label} error={error} description={description} required={props.required}>
      <Textarea
        className={cn(
          "transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]",
          error && "border-destructive focus:border-destructive",
          className,
        )}
        {...props}
      />
    </PromotionFormField>
  )
}
