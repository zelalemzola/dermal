"use client";

import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CheckoutPageProps {
  amount: number;
  plan?: string;
  clientSecret: string;
}

export default function CheckoutPage({
  amount,
  plan = "",
  clientSecret,
}: CheckoutPageProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMessage(undefined);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "Validation failed");
      setLoading(false);
      return;
    }

    const returnUrl = new URL("/payment-sucess", window.location.origin);
    returnUrl.searchParams.set("amount", String(amount));
    if (plan) returnUrl.searchParams.set("plan", plan);
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl.toString(),
      },
    });
    if (error) {
      setErrorMessage(error.message ?? "Payment failed");
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading checkout…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-base font-semibold bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processing…
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}
