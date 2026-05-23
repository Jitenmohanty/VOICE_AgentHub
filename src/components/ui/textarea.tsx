"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        "w-full min-w-0 rounded-xl px-3.5 py-3 text-base resize-none",
        "bg-white/4 border border-white/10 text-white placeholder:text-white/30",
        "transition-[border-color,box-shadow,background-color] duration-200 outline-none",
        "hover:bg-white/6 hover:border-white/14",
        "focus-visible:border-violet-300/55 focus-visible:bg-white/6",
        "focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-rose-400/60 aria-invalid:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
