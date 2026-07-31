import { isStripeConfigured, isStripeTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isStripeConfigured()) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-sm text-red-800">
        Stripe is not configured. Set the publishable key to enable checkout.
      </div>
    );
  }
  if (isStripeTestMode()) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
        All payments made in the preview are in test mode.
      </div>
    );
  }
  return null;
}
