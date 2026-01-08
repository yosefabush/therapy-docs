import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const input = (
      <input
        type={type}
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-clinical-900 placeholder:text-clinical-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-400 focus-visible:ring-red-500" : "border-sage-200 focus-visible:ring-sage-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (label || error || helperText) {
      return (
        <div className="space-y-1.5">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-clinical-700"
            >
              {label}
            </label>
          )}
          {input}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {helperText && !error && <p className="text-sm text-clinical-500">{helperText}</p>}
        </div>
      )
    }

    return input
  }
)
Input.displayName = "Input"

export { Input }
