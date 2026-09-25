import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

const bubbleVariants = cva(
  "relative flex max-w-sm flex-col gap-2 rounded-2xl px-4 py-3 text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface text-foreground border border-surface-outline",
        muted: "bg-surface-muted text-foreground border border-surface-outline",
        outline: "bg-transparent text-foreground border border-surface-outline",
      },
      align: {
        start: "self-start rounded-tl-sm",
        end: "self-end rounded-tr-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  }
)

export interface BubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bubbleVariants> {
  asChild?: boolean
}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant, align, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        className={cn(bubbleVariants({ variant, align, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Bubble.displayName = "Bubble"

const BubbleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return <Comp className={cn("leading-relaxed", className)} ref={ref} {...props} />
})
BubbleContent.displayName = "BubbleContent"

export { Bubble, BubbleContent, bubbleVariants }
