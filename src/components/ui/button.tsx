import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-900 dark:focus-visible:ring-primary-400",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-900/90 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-100/90",
        destructive:
          "bg-red-500 text-white hover:bg-red-500/90 dark:bg-red-700 dark:text-white dark:hover:bg-red-700/90",
        outline:
          "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white",
        secondary:
          "bg-neutral-100 text-gray-900 hover:bg-neutral-100/80 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-700/80",
        ghost: "hover:bg-neutral-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white",
        link: "text-gray-900 underline-offset-4 hover:underline dark:text-white",
        primary: "bg-blue-600 text-white hover:bg-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };