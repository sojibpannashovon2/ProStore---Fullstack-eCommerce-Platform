import { z } from "zod"

import { assertPermission, assertRole } from "@/lib/auth-guard"
import {
  deleteLocalUpload,
  isLocalUploadUrl,
  localUploadKeyFromUrl,
  saveLocalUpload,
} from "@/lib/storage/local"

export const runtime = "nodejs"

const maxImageSize = 4 * 1024 * 1024
const allowedTypes: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

async function getUploader() {
  const actor = await assertRole("admin", "seller")
  await assertPermission(
    actor.role === "seller" ? "seller.products.manage" : "products.manage",
  )
  return actor
}

export async function PUT(request: Request) {
  try {
    await getUploader()

    const contentType = request.headers.get("content-type") ?? ""
    const extension = allowedTypes[contentType]
    if (!extension) {
      return Response.json({ error: "Unsupported image type" }, { status: 400 })
    }

    const body = await request.arrayBuffer()
    if (body.byteLength === 0 || body.byteLength > maxImageSize) {
      return Response.json(
        { error: "Choose an image up to 4 MB" },
        { status: 400 },
      )
    }

    const fileName = `${crypto.randomUUID()}.${extension}`
    await saveLocalUpload(fileName, Buffer.from(body))

    return Response.json({
      message: "Image uploaded",
      imageUrl: `/images/uploads/${fileName}`,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized action") {
      return Response.json(
        { error: "You cannot upload product images" },
        { status: 403 },
      )
    }
    console.error("Failed to store product image locally", error)
    return Response.json({ error: "Could not store image" }, { status: 500 })
  }
}

const deleteRequestSchema = z.object({ url: z.string() })

export async function DELETE(request: Request) {
  try {
    await getUploader()
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return Response.json({ error: "Invalid delete request" }, { status: 400 })
    }

    const parsed = deleteRequestSchema.safeParse(requestBody)
    if (!parsed.success || !isLocalUploadUrl(parsed.data.url)) {
      return Response.json({ error: "Invalid image URL" }, { status: 400 })
    }

    const fileName = localUploadKeyFromUrl(parsed.data.url)
    await deleteLocalUpload(fileName)
    return Response.json({ message: "Image deleted" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized action") {
      return Response.json(
        { error: "You cannot delete product images" },
        { status: 403 },
      )
    }
    console.error("Failed to delete local product image", error)
    return Response.json({ error: "Could not delete image" }, { status: 500 })
  }
}
