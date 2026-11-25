import { z } from "zod"

import { prisma } from "@/db/prisma"
import { assertPermission } from "@/lib/auth-guard"
import { decryptSellerDocument } from "@/lib/seller-documents"

export const runtime = "nodejs"

interface SellerDocumentRouteProps {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: Request,
  { params }: SellerDocumentRouteProps,
) {
  let actor
  try {
    actor = await assertPermission("sellerApplications.manage")
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized action") {
      return Response.json({ message: "Forbidden" }, { status: 403 })
    }
    throw error
  }

  const { id } = await params
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) {
    return Response.json({ message: "Document not found" }, { status: 404 })
  }

  const document = await prisma.sellerDocument.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      fileName: true,
      contentType: true,
      encryptedContent: true,
      encryptionIv: true,
      authTag: true,
      applicationId: true,
    },
  })
  if (!document) {
    return Response.json({ message: "Document not found" }, { status: 404 })
  }

  const content = decryptSellerDocument({
    content: Buffer.from(document.encryptedContent),
    iv: Buffer.from(document.encryptionIv),
    authTag: Buffer.from(document.authTag),
  })
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "seller.document.downloaded",
      targetType: "SellerDocument",
      targetId: document.id,
      metadata: { applicationId: document.applicationId },
    },
  })

  return new Response(content, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${document.fileName}"`,
      "Content-Security-Policy": "default-src 'none'",
      "Content-Type": document.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
