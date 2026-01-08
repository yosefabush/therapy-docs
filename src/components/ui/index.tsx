'use client';

// Re-export all shadcn-based UI components
// This file maintains backward compatibility with existing imports

// Button
export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'

// Card
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'

// Badge
export { Badge, badgeVariants } from './badge'
export type { BadgeProps } from './badge'

// Dialog (Modal)
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Modal,
} from './dialog'

// Tabs - LegacyTabs is exported as 'Tabs' for backward compatibility
// Use ShadcnTabs for the new Radix-based tabs
export {
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  LegacyTabs,
  LegacyTabs as Tabs  // Default Tabs export uses legacy interface for backward compatibility
} from './tabs'

// Avatar - AvatarWithName is exported as 'Avatar' for backward compatibility
// Use ShadcnAvatar for the Radix-based avatar
export {
  Avatar as ShadcnAvatar,
  AvatarImage,
  AvatarFallback,
  AvatarWithName,
  AvatarWithName as Avatar  // Default Avatar export uses AvatarWithName for backward compatibility
} from './avatar'

// Progress
export { Progress, ProgressBar } from './progress'

// Input
export { Input } from './input'
export type { InputProps } from './input'

// Textarea
export { Textarea } from './textarea'
export type { TextareaProps } from './textarea'

// Label
export { Label } from './label'

// Checkbox
export { Checkbox } from './checkbox'

// Select - LegacySelect is exported as 'Select' for backward compatibility
// Use ShadcnSelect for the Radix-based select
export {
  Select as ShadcnSelect,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  LegacySelect,
  LegacySelect as Select  // Default Select export uses legacy interface for backward compatibility
} from './select'

// Alert
export { Alert, AlertTitle, AlertDescription } from './alert'

// Empty State
export { EmptyState } from './empty-state'

// Loading Spinner
export { LoadingSpinner } from './LoadingSpinner'

// Error Message
export { ErrorMessage } from './ErrorMessage'
