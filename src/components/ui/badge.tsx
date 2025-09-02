import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white/10 backdrop-blur-xl text-white hover:bg-white/20",
        secondary:
          "border-transparent bg-white/5 backdrop-blur-xl text-white/70 hover:bg-white/10",
        destructive:
          "border-transparent bg-red-500/20 backdrop-blur-xl text-red-300 hover:bg-red-500/30",
        outline: "text-white border-white/20",
        success:
          "border-transparent bg-emerald-500/20 backdrop-blur-xl text-emerald-300 hover:bg-emerald-500/30",
        warning:
          "border-transparent bg-yellow-500/20 backdrop-blur-xl text-yellow-300 hover:bg-yellow-500/30",
        info:
          "border-transparent bg-blue-500/20 backdrop-blur-xl text-blue-300 hover:bg-blue-500/30",
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
