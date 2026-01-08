import * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-clinical-300 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-clinical-900 mb-1">{title}</h3>
      {description && (
        <p className="text-clinical-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  )
}

export { EmptyState }
