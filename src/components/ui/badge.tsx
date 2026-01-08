import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sage-100 text-sage-700",
        secondary: "border-transparent bg-warm-100 text-warm-700",
        destructive: "border-transparent bg-red-100 text-red-700",
        outline: "text-clinical-700 border-sage-200",
        // Medical theme variants
        sage: "border-transparent bg-sage-100 text-sage-700",
        warm: "border-transparent bg-warm-100 text-warm-700",
        success: "border-transparent bg-green-100 text-green-700",
        warning: "border-transparent bg-amber-100 text-amber-700",
        danger: "border-transparent bg-red-100 text-red-700",
        info: "border-transparent bg-blue-100 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
