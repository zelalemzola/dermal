"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import convertToSubcurrency from "@/lib/convertToSubcurrency";
import CheckoutPage from "@/components/payment/CheckoutPage";
import { Header } from "@/components/dermal/Header";
import { Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!,
);

function PaymentContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const amountParam = searchParams.get("amount");
  const amount = useMemo(() => {
    const n = amountParam ? parseFloat(amountParam) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountParam]);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (amount === null) return;
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: convertToSubcurrency(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setFetchError(data.error);
          return;
        }
        setClientSecret(data.clientSecret ?? null);
      })
      .catch(() => setFetchError("Failed to load checkout"));
  }, [amount]);

  if (amount === null) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-28 px-6 max-w-xl mx-auto text-center">
          <h1 className="text-xl font-bold text-[#0f172a] mb-2">
            Invalid payment details
          </h1>
          <p className="text-gray-600 mb-6">
            Please choose a plan from your report to continue.
          </p>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/report">Back to report</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-28 px-6 max-w-xl mx-auto text-center">
          <p className="text-red-600 mb-6">{fetchError}</p>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/report">Back to report</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Header />
        <div className="flex items-center gap-2 text-gray-500 mt-24">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading checkout…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24 px-4 pb-16 max-w-xl mx-auto">
        <div className="flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-medium text-[#3b82f6] w-fit mb-6">
          <Shield className="h-3.5 w-3.5" />
          Secure checkout
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-1">
          Complete your purchase
        </h1>
        <p className="text-gray-600 mb-8">
          {plan ? (
            <>
              <span className="font-medium text-[#3b82f6]">{plan}</span> — $
              {amount.toFixed(2)} one-time
            </>
          ) : (
            <>${amount.toFixed(2)} one-time</>
          )}
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutPage
              amount={amount}
              plan={plan}
              clientSecret={clientSecret}
            />
          </Elements>
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/report"
            className="text-sm text-gray-500 hover:text-[#0f172a]"
          >
            ← Back to report
          </Link>
        </p>
      </main>
    </div>
  );
}

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Header />
      <div className="flex items-center gap-2 text-gray-500 mt-24">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading checkout…</span>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
