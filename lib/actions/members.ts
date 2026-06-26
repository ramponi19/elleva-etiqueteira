"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InvitationEmail } from "@/lib/email/templates/invitation";
import { z } from "zod";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const InviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "member", "viewer"]),
});

export type InviteFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function inviteMember(
  _prev: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Não autenticado." };

  const parsed = InviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { data: orgId } = await supabase.rpc("my_org_id");
  if (!orgId) return { message: "Configure sua organização primeiro." };

  // Org name + inviter name for the email
  const [{ data: orgRaw }, { data: profileRaw }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", orgId).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);
  const orgName = (orgRaw as { name: string } | null)?.name ?? "sua organização";
  const inviterName =
    (profileRaw as { full_name: string | null } | null)?.full_name ??
    user.email ??
    "Um colega";

  // Upsert invitation (re-invite overwrites previous pending one)
  const { data: invRaw, error } = await supabase
    .from("invitations")
    .upsert(
      {
        org_id: orgId,
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: user.id,
        status: "pending",
      },
      { onConflict: "org_id,email" }
    )
    .select("token")
    .single();

  if (error) {
    return {
      message: error.message.includes("duplicate")
        ? "Este email já foi convidado."
        : error.message,
    };
  }

  const token = (invRaw as { token: string }).token;
  const acceptUrl = `${APP_URL}/dashboard/convite?token=${token}`;

  // Send email (non-blocking failure — invitation persists either way)
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: parsed.data.email,
      subject: `Convite para ${orgName} no Elleva`,
      react: InvitationEmail({
        orgName,
        inviterName,
        acceptUrl,
        role: parsed.data.role,
      }),
    });
  } catch {
    // Email failed — still return success, admin can resend
    revalidatePath("/dashboard/configuracoes/membros");
    return {
      success: true,
      message: "Convite criado, mas o email falhou. Tente reenviar.",
    };
  }

  revalidatePath("/dashboard/configuracoes/membros");
  return { success: true };
}

export async function revokeInvitation(id: string) {
  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id);
  revalidatePath("/dashboard/configuracoes/membros");
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });
  if (error) return { error: error.message };
  return data as { success?: boolean; error?: string; org_id?: string };
}
