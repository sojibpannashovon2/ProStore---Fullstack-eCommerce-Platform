import { SellerApplicationStatus, SellerDocumentType } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/auth"
import { prisma } from "@/db/prisma"
import { encryptSellerDocument } from "@/lib/seller-documents"

export const runtime = "nodejs"

const documentTypeSchema = z.nativeEnum(SellerDocumentType)
const maximumSize = 5 * 1024 * 1024
const supportedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

function matchesFileSignature(type: string, content: Buffer) {
  if (type === "application/pdf") {
    return content.subarray(0, 5).toString("ascii") === "%PDF-"
  }
  if (type === "image/jpeg") {
    return content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff
  }
  if (type === "image/png") {
    return content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  }
  return (
    type === "image/webp" &&
    content.subarray(0, 4).toString("ascii") === "RIFF" &&
    content.subarray(8, 12).toString("ascii") === "WEBP"
  )
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  let validOrigin = false
  try {
    validOrigin = !!origin && new URL(origin).origin === new URL(request.url).origin
  } catch {
    validOrigin = false
  }
  if (!validOrigin) {
    return Response.json({ message: "Invalid request origin" }, { status: 403 })
  }

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return Response.json({ message: "Authentication required" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user || user.role !== "customer") {
    return Response.json({ message: "Seller application is not available" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const applicationId = z.string().uuid().parse(formData.get("applicationId"))
    const type = documentTypeSchema.parse(formData.get("type"))
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return Response.json({ message: "Choose a document file" }, { status: 400 })
    }
    if (file.size < 1 || file.size > maximumSize) {
      return Response.json({ message: "Documents must be 5 MB or smaller" }, { status: 400 })
    }
    if (!supportedTypes.has(file.type)) {
      return Response.json({ message: "Upload a PDF, JPEG, PNG, or WebP file" }, { status: 400 })
    }

    const application = await prisma.sellerApplication.findFirst({
      where: {
        id: applicationId,
        userId,
        status: SellerApplicationStatus.pending,
      },
      select: { id: true },
    })
    if (!application) {
      return Response.json({ message: "Pending seller application not found" }, { status: 404 })
    }

    const content = Buffer.from(await file.arrayBuffer())
    if (!matchesFileSignature(file.type, content)) {
      return Response.json({ message: "The file content does not match its type" }, { status: 400 })
    }
    const encrypted = encryptSellerDocument(content)
    const fileName = file.name
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^\w.-]/g, "_")
      .slice(0, 120)
    if (!fileName) {
      return Response.json({ message: "Invalid file name" }, { status: 400 })
    }

    const document = await prisma.$transaction(async (tx) => {
      await tx.sellerDocument.deleteMany({
        where: { applicationId, type },
      })
      const created = await tx.sellerDocument.create({
        data: {
          applicationId,
          type,
          fileName,
          contentType: file.type,
          fileSize: content.byteLength,
          encryptedContent: encrypted.encryptedContent,
          encryptionIv: encrypted.iv,
          authTag: encrypted.authTag,
        },
        select: { id: true },
      })
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: "seller.document.uploaded",
          targetType: "SellerDocument",
          targetId: created.id,
          metadata: { type },
        },
      })
      return created
    })

    return Response.json(
      { success: true, documentId: document.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ message: "Invalid application or document type" }, { status: 400 })
    }
    console.error("Seller document upload failed", error)
    return Response.json({ message: "Unable to upload the document" }, { status: 500 })
  }
}
