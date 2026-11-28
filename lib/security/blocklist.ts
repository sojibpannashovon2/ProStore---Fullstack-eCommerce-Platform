import { prisma } from "@/db/prisma"

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false
  const block = await prisma.securityBlock.findFirst({
    where: { ip, isActive: true },
    select: { id: true },
  })
  return Boolean(block)
}

export async function blockIp(
  ip: string,
  reason: string,
  actorId: string | null,
): Promise<void> {
  await prisma.securityBlock.upsert({
    where: { ip },
    update: { isActive: true, reason },
    create: { ip, reason, isActive: true, createdBy: actorId },
  })
}

export async function unblockIp(ip: string): Promise<void> {
  await prisma.securityBlock.updateMany({
    where: { ip },
    data: { isActive: false },
  })
}