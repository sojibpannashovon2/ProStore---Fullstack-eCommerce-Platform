import { Resend } from "resend"

import { prisma } from "@/db/prisma"

async function getSuperAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "super_admin", isDeleted: false, status: "active" },
    select: { email: true },
  })
  return admins.map((a) => a.email).filter(Boolean)
}

export async function sendSecurityAlert(
  subject: string,
  message: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" }

  const explicit = process.env.SUPER_ADMIN_ALERT_EMAIL?.trim()
  const recipients = explicit ? [explicit] : await getSuperAdminEmails()
  if (recipients.length === 0) return { sent: false, reason: "no super admin email" }

  const resend = new Resend(apiKey)
  try {
    await resend.emails.send({
      from: process.env.ALERT_FROM_EMAIL || "Kinora Security <onboarding@resend.dev>",
      to: recipients,
      subject,
      text: message,
    })
    return { sent: true }
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : String(error) }
  }
}