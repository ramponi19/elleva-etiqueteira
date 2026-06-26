import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily instantiated Stripe client — avoids build-time errors when the
 *  secret key isn't present (e.g. during `next build` page-data collection). */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
        apiVersion: "2026-06-24.dahlia",
        typescript: true,
        appInfo: { name: "Elleva", version: "0.1.0" },
      });
    }
    return Reflect.get(_stripe, prop, _stripe);
  },
});

export type PlanId = "starter" | "pro" | "enterprise";

export const PLANS: Record<
  Exclude<PlanId, "enterprise">,
  { monthly: string; yearly: string; name: string }
> = {
  starter: {
    name: "Starter",
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID ?? "",
  },
  pro: {
    name: "Pro",
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  },
};

/** Mapeia um price ID de volta para o plano interno. */
export function planFromPriceId(priceId: string): PlanId {
  if (
    priceId === PLANS.pro.monthly ||
    priceId === PLANS.pro.yearly
  ) {
    return "pro";
  }
  if (
    priceId === PLANS.starter.monthly ||
    priceId === PLANS.starter.yearly
  ) {
    return "starter";
  }
  return "starter";
}
