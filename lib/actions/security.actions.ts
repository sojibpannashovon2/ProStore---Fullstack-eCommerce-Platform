"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import { assertPermission } from "@/lib/auth-guard"
import { blockIp, unblockIp } from "@/lib/security/blocklist"
import { sendSecurityAlert } from "@/lib/security/notify"
import { formatError } from "@/lib/utils"
import type { ActionReturn } from "@/types"

export async function getSecurityOverview() {
  await assertPermission("users.manage")

  const [blocked, failedLogins, alerts] = await prisma.$transaction([
    prisma.securityBlock.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, ip: true, reason: true, createdAt: true },
    }),
    prisma.loginHistory.findMany({
      where: { success: false },
      orderBy: { loginAt: "desc" },
      take: 50,
      select: {
        id: true,
        loginAt: true,
        ipAddress: true,
        device: true,
        browser: true,
        location: true,
        user: { select: { email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { action: { startsWith: "security." } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        ipAddress: true,
        location: true,
        reason: true,
        createdAt: true,
      },
    }),
  ])

  return { blocked, failedLogins, alerts }
}

export async function blockIpAction(ip: string, reason: string): ActionReturn {
  try {
    const actor = await assertPermission("users.manage")
    const safeIp = z.string().min(3).max(64).parse(ip)
    const safeReason = z
      .string()
      .min(3)
      .max(300)
      .parse(reason || "Blocked from Security page")

    await blockIp(safeIp, safeReason, actor.id)
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "security.ip_blocked",
        targetType: "security",
        ipAddress: safeIp,
        reason: safeReason,
      },
    })
    await sendSecurityAlert(
      "Kinora: IP blocked",
      `IP ${safeIp} was blocked by ${actor.role}.\nReason: ${safeReason}`,
    )
    revalidatePath("/admin/security")
    return { success: true, message: `Blocked ${safeIp}` }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function unblockIpAction(ip: string): ActionReturn {
  try {
    const actor = await assertPermission("users.manage")
    const safeIp = z.string().min(3).max(64).parse(ip)
    await unblockIp(safeIp)
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        action: "security.ip_unblocked",
        targetType: "security",
        ipAddress: safeIp,
      },
    })
    revalidatePath("/admin/security")
    return { success: true, message: `Unblocked ${safeIp}` }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}