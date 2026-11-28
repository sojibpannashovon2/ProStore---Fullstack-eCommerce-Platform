import { prisma } from "@/db/prisma"
import { getRequestMeta } from "@/lib/security/request-meta"

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "role_change"
  | "status_change"
  | "ownership_change"
  | "permanent_delete"

export interface AuditInput {
  actorId?: string | null
  actorRole?: string | null
  action: AuditAction | string
  targetType: "user" | "product" | "wishlist" | "wishlist_item" | string
  targetId?: string | null
  oldValue?: unknown
  newValue?: unknown
  reason?: string | null
}

export async function writeAudit(input: AuditInput) {
  const meta = await getRequestMeta()
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      oldValue: (input.oldValue ?? undefined) as object | undefined,
      newValue: (input.newValue ?? undefined) as object | undefined,
      reason: input.reason ?? null,
      ipAddress: meta.ip,
      location: meta.location,
    },
  })
}