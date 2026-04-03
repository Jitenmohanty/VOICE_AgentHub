---
name: add-shadcn
description: "Use when adding a new shadcn/ui component to AgentHub. Covers the install command, where components land, and import patterns."
---

# Add a shadcn/ui Component

**When**: Need a new UI primitive not yet in `src/components/ui/`.

---

## Install Command

```bash
npx shadcn@latest add <component-name>
```

Examples:
```bash
npx shadcn@latest add tooltip
npx shadcn@latest add calendar
npx shadcn@latest add table
npx shadcn@latest add popover
npx shadcn@latest add command
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add accordion
```

Components land in `src/components/ui/` automatically.

---

## Import Pattern

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
```

Always use the `@/` alias — never relative paths.

---

## Already Installed

Check `src/components/ui/` before installing — these are already present:

- `avatar`, `badge`, `button`, `card`, `dialog`
- `dropdown-menu`, `input`, `label`, `select`
- `sheet`, `tabs`

---

## Notes

- shadcn components are copied into your repo — you own the code and can customize them
- They use Tailwind CSS 4 + Radix primitives under the hood
- `components.json` at the root controls shadcn configuration (path aliases, style, etc.)
