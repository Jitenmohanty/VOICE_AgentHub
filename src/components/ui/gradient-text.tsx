import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Render as a different element (default span). Use "h1"/"h2" inline. */
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
}

/**
 * Brand gradient text wrapper. Pure CSS — no JS — and inherits font sizing
 * from its parent so it composes inside any heading.
 *
 *   <h1>Never miss a <GradientText>customer</GradientText></h1>
 */
export function GradientText({ as = "span", className, children, ...rest }: GradientTextProps) {
  const Component = as as React.ElementType;
  return (
    <Component {...rest} className={cn("ah-gradient-text", className)}>
      {children}
    </Component>
  );
}
