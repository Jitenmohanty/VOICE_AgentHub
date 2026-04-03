---
name: zustand-store
description: "Use when adding or modifying global client state in AgentHub using Zustand. Covers store creation, typed slices, and usage in client components."
---

# Add a Zustand Store

**When**: Adding new global client-side state that needs to be shared across components.

---

## Create a Store

```typescript
// src/stores/my-store.ts
import { create } from "zustand";

interface MyState {
  value: string;
  isLoading: boolean;
  setValue: (v: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  value: "",
  isLoading: false,
};

export const useMyStore = create<MyState>((set) => ({
  ...initialState,
  setValue: (value) => set({ value }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
```

---

## Use in a Client Component

```typescript
"use client";
import { useMyStore } from "@/stores/my-store";

export function MyComponent() {
  const { value, isLoading, setValue } = useMyStore();

  return <div>{value}</div>;
}
```

---

## Existing Stores

| Store | File | Purpose |
|-------|------|---------|
| `useSessionStore` | `src/stores/session-store.ts` | Voice call state: connection, transcript, speaking state |
| `useAgentStore` | `src/stores/agent-store.ts` | Agent config state for the dashboard |

**Extend these before creating a new store** if the state logically belongs to an existing domain.

---

## Rules

- Stores go in `src/stores/`
- Always export a named hook (`useMyStore`) — not the raw store
- Define an `initialState` object to make `reset()` easy to implement
- Only use stores in `"use client"` components — never in Server Components or API routes
- For server state (data from API), prefer `useState` + `useEffect` or server components with fetch — don't put server data in Zustand
