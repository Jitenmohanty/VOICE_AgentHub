"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  businessId: string;
  planId: string;
  isCurrent: boolean;
  isFree: boolean;
  stripeReady: boolean;
  hasSubscription: boolean;
}

export function BillingActions({ businessId, planId, isCurrent, isFree, stripeReady, hasSubscription }: Props) {
  const [busy, setBusy] = useState(false);

  if (isCurrent) {
    if (isFree) {
      return <p className="text-xs text-center text-[#666680]">You&apos;re on the free plan</p>;
    }
    return (
      <Button
        variant="outline"
        className="w-full border-[#2A2A3E] text-white"
        disabled={busy || !hasSubscription}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await fetch("/api/billing/portal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Portal failed");
            window.location.href = data.url;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Portal failed");
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening..." : "Manage subscription"}
      </Button>
    );
  }

  if (isFree) {
    // Downgrading to free isn't a checkout action — direct to portal where
    // the user cancels their paid subscription. Disabled if no portal yet.
    return (
      <p className="text-xs text-center text-[#666680]">Cancel a paid plan from its &ldquo;Manage&rdquo; button</p>
    );
  }

  if (!stripeReady) {
    return (
      <Button disabled className="w-full" variant="outline">
        Not available
      </Button>
    );
  }

  return (
    <Button
      className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, planId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Checkout failed");
          window.location.href = data.url;
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Checkout failed");
          setBusy(false);
        }
      }}
    >
      {busy ? "Loading..." : "Upgrade"}
    </Button>
  );
}
