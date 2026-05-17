import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl px-3.5 py-2 text-sm",
        "bg-white/4 border border-white/10 text-white placeholder:text-white/30",
        "transition-[border-color,box-shadow,background-color] duration-200 outline-none",
        "hover:bg-white/6 hover:border-white/14",
        "focus-visible:border-violet-300/55 focus-visible:bg-white/6",
        "focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-rose-400/60 aria-invalid:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
