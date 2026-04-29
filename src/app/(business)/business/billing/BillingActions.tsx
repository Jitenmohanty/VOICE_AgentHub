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
  razorpayReady: boolean;
  hasSubscription: boolean;
  /** "stripe" | "razorpay" | null — used to route the Manage button correctly */
  paymentProvider: string | null;
}

type Provider = "stripe" | "razorpay";

export function BillingActions({
  businessId,
  planId,
  isCurrent,
  isFree,
  stripeReady,
  razorpayReady,
  hasSubscription,
  paymentProvider,
}: Props) {
  const [busy, setBusy] = useState<Provider | "portal" | null>(null);

  // ── Current plan ────────────────────────────────────────────────────
  if (isCurrent) {
    if (isFree) {
      return <p className="text-xs text-center text-[#666680]">You&apos;re on the free plan</p>;
    }
    // Stripe has a customer portal we can redirect to. Razorpay does not —
    // owners manage Razorpay subscriptions from the email confirmation or
    // their Razorpay-side account. Surface a hint instead of a broken button.
    if (paymentProvider !== "stripe") {
      return (
        <p className="text-xs text-center text-[#666680]">
          Active on Razorpay — manage from your Razorpay account
        </p>
      );
    }
    return (
      <Button
        variant="outline"
        className="w-full border-[#2A2A3E] text-white"
        disabled={busy !== null || !hasSubscription}
        onClick={async () => {
          setBusy("portal");
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
            setBusy(null);
          }
        }}
      >
        {busy === "portal" ? "Opening..." : "Manage subscription"}
      </Button>
    );
  }

  // ── Free plan card (when on a paid plan) ────────────────────────────
  if (isFree) {
    return (
      <p className="text-xs text-center text-[#666680]">
        Cancel a paid plan from its &ldquo;Manage&rdquo; button
      </p>
    );
  }

  // ── Paid plan, neither provider configured ─────────────────────────
  if (!stripeReady && !razorpayReady) {
    return (
      <Button disabled className="w-full" variant="outline">
        Not available
      </Button>
    );
  }

  const startCheckout = async (provider: Provider) => {
    setBusy(provider);
    try {
      const url =
        provider === "stripe"
          ? "/api/billing/checkout"
          : "/api/billing/razorpay/checkout";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setBusy(null);
    }
  };

  // ── Paid plan, providers available ─────────────────────────────────
  return (
    <>
      {stripeReady && (
        <Button
          className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
          disabled={busy !== null}
          onClick={() => startCheckout("stripe")}
        >
          {busy === "stripe"
            ? "Loading..."
            : razorpayReady
              ? "Pay with Stripe (USD)"
              : "Upgrade"}
        </Button>
      )}
      {razorpayReady && (
        <Button
          className="w-full bg-linear-to-r from-[#0B5CFF] to-[#3395FF] text-white border-0 hover:opacity-90"
          disabled={busy !== null}
          onClick={() => startCheckout("razorpay")}
        >
          {busy === "razorpay"
            ? "Loading..."
            : stripeReady
              ? "Pay with Razorpay (INR)"
              : "Upgrade with Razorpay"}
        </Button>
      )}
    </>
  );
}
