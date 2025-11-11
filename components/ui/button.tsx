import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[var(--brand-primary-strong)] hover:shadow-lg hover:shadow-[rgba(234,0,42,0.25)]",
        destructive:
          "bg-destructive text-white hover:bg-[#a5111a] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-[color:var(--brand-secondary)] text-[color:var(--brand-secondary)] bg-transparent hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,transparent)] hover:text-[color:var(--brand-secondary-strong)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color:var(--brand-secondary-strong)]",
        ghost:
          "text-[color:var(--brand-secondary)] hover:bg-[color-mix(in_srgb,var(--brand-secondary)_12%,transparent)]",
        link: "text-[color:var(--brand-primary)] underline-offset-4 hover:text-[color:var(--brand-primary-strong)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
