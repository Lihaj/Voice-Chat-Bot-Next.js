import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground", // Keep text and placeholder colors
                "w-full min-w-0 bg-transparent px-3 py-1 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", // Basic layout, remove fixed height and border for full transparency
                "border-none outline-none ring-0 shadow-none", // Remove border, outline, ring, and shadow
                className
            )}
            {...props}
        />
    )
}

export { Input }