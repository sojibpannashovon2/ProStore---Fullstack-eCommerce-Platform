import { prisma } from "@/db/prisma"
import { getRequestMeta } from "@/lib/security/request-meta"

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
  if (!user) return
  const meta = await getRequestMeta()
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
}