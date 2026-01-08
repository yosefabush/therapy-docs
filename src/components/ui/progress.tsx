"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    showLabel?: boolean
  }
>(({ className, value, showLabel, ...props }, ref) => {
  const percentage = Math.min(value || 0, 100)

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ProgressPrimitive.Root
        ref={ref}
        className="relative flex-1 h-2 w-full overflow-hidden rounded-full bg-sage-100"
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-sage-500 transition-all duration-500 rounded-full"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showLabel && (
        <span className="text-sm text-clinical-600 font-medium w-12 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Legacy ProgressBar alias for backward compatibility
const ProgressBar = Progress

export { Progress, ProgressBar }
