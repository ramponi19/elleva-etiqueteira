"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS, type PlanId } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getOrg(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: orgId } = await supabase.rpc("my_org_id");
  if (!orgId) return null;
  const { data } = await supabase
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", orgId)
    .single();
  return data as {
    id: string;
    name: string;
    stripe_customer_id: string | null;
  } | null;
}

export async function createCheckoutSession(
  plan: Exclude<PlanId, "enterprise">,
  interval: "monthly" | "yearly"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const org = await getOrg(supabase);
  if (!org) {
    redirect("/dashboard/configuracoes?error=no_org");
  }

  const priceId = PLANS[plan][interval];
  if (!priceId) {
    redirect("/dashboard/configuracoes/billing?error=invalid_price");
  }

  // Reuse or create Stripe customer
  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { org_id: org.id, user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard/configuracoes/billing?success=true`,
    cancel_url: `${APP_URL}/dashboard/configuracoes/billing?canceled=true`,
    subscription_data: {
      metadata: { org_id: org.id },
    },
    metadata: { org_id: org.id, plan },
  });

  if (session.url) redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const org = await getOrg(supabase);

  if (!org?.stripe_customer_id) {
    redirect("/dashboard/configuracoes/billing?error=no_customer");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/configuracoes/billing`,
  });

  redirect(session.url);
}
