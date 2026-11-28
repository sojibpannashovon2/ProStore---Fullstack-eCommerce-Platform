import { prisma } from "@/db/prisma"
import { getRequestMeta } from "@/lib/security/request-meta"
import { sendSecurityAlert } from "@/lib/security/notify"

const ONLINE_WINDOW_MS = 5 * 60 * 1000
const THROTTLE_MS = 60 * 1000

export function msAgo(ms: number): Date {
  return new Date(Date.now() - ms)
}

export function isOnline(lastActiveAt: Date | null | undefined): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() <= ONLINE_WINDOW_MS
}

export async function touchLastActive(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true, status: true, isDeleted: true },
  })
  if (!user || user.isDeleted || user.status === "blocked") return

  const last = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0
  if (Date.now() - last < THROTTLE_MS) return

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  })
}

export async function recordLoginSuccess(userId: string) {
  const meta = await getRequestMeta()
  const now = new Date()
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: now,
        lastActiveAt: now,
        lastLoginIp: meta.ip,
        lastLoginLocation: meta.location,
      },
    }),
    prisma.loginHistory.create({
      data: {
        userId,
        loginAt: now,
        ipAddress: meta.ip,
        device: meta.device,
        browser: meta.browser,
        location: meta.location,
        success: true,
      },
    }),
  ])
}

export async function recordLoginFailure(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  const meta = await getRequestMeta()
  if (!user) {
    await prisma.auditLog.create({
      data: {
        action: "security.login_failed",
        targetType: "user",
        ipAddress: meta.ip,
        location: meta.location,
        reason: `Unknown email: ${email}`,
      },
    })
    return
  }
  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      ipAddress: meta.ip,
      device: meta.device,
      browser: meta.browser,
      location: meta.location,
      success: false,
    },
  })

  const since = new Date(Date.now() - 15 * 60 * 1000)
  const recentFailures = await prisma.loginHistory.count({
    where: { ipAddress: meta.ip, success: false, loginAt: { gte: since } },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "security.login_failed",
      targetType: "user",
      targetId: user.id,
      ipAddress: meta.ip,
      location: meta.location,
    },
  })

  if (recentFailures >= 5) {
    const admins = await prisma.user.findMany({
      where: { role: "super_admin", isDeleted: false, status: "active" },
      select: { id: true },
    })
    await prisma.auditLog.create({
      data: {
        action: "security.bruteforce_suspected",
        targetType: "user",
        targetId: user.id,
        ipAddress: meta.ip,
        location: meta.location,
        reason: `${recentFailures} failed attempts in 15 minutes`,
      },
    })
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title: "Suspicious login activity",
          message: `${recentFailures}+ failed logins from ${meta.ip} (${meta.location}). Review and block in Security.`,
        })),
      })
    }

    await sendSecurityAlert(
      "Kinora: suspicious login activity",
      `${recentFailures}+ failed login attempts in 15 minutes.\nIP: ${meta.ip}\nLocation: ${meta.location}\nAccount: ${email}\n\nReview and block this IP from the Security page.`,
    )
  }
}