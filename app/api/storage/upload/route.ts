import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { z } from "zod"

import { assertPermission, assertRole, isAdminRole } from "@/lib/auth-guard"
import {
  createS3Client,
  getPublicObjectUrl,
  getS3StorageConfig,
  isS3StorageConfigured,
} from "@/lib/storage/s3"

export const runtime = "nodejs"

const maxImageSize = 4 * 1024 * 1024
const imageTypes = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const uploadRequestSchema = z.object({
  contentType: z.enum([
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  fileSize: z.number().int().positive().max(maxImageSize),
})

async function getUploader() {
  const actor = await assertRole("admin", "seller")
  await assertPermission(
    actor.role === "seller" ? "seller.products.manage" : "products.manage",
  )
  return actor
}

export async function POST(request: Request) {
  if (!isS3StorageConfigured()) {
    return Response.json(
      { error: "Image storage is not configured on the server" },
      { status: 503 },
    )
  }

  try {
    const actor = await getUploader()
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return Response.json({ error: "Invalid upload request" }, { status: 400 })
    }

    const parsedRequest = uploadRequestSchema.safeParse(requestBody)
    if (!parsedRequest.success) {
      return Response.json(
        { error: "Choose an image up to 4 MB" },
        { status: 400 },
      )
    }

    const { contentType } = parsedRequest.data
    const config = getS3StorageConfig()
    const key = `${actor.id}/${crypto.randomUUID()}.${imageTypes[contentType]}`
    const uploadUrl = await getSignedUrl(
      createS3Client(),
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 60 },
    )

    return Response.json({
      uploadUrl,
      imageUrl: getPublicObjectUrl(key),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized action") {
      return Response.json({ error: "You cannot upload product images" }, { status: 403 })
    }
    console.error("Failed to prepare product image upload", error)
    return Response.json(
      { error: "Could not prepare image upload" },
      { status: 500 },
    )
  }
}

const deleteRequestSchema = z.object({
  url: z.string().url(),
})

export async function DELETE(request: Request) {
  if (!isS3StorageConfigured()) {
    return Response.json(
      { error: "Image storage is not configured on the server" },
      { status: 503 },
    )
  }

  try {
    const actor = await getUploader()
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return Response.json({ error: "Invalid delete request" }, { status: 400 })
    }

    const parsedRequest = deleteRequestSchema.safeParse(requestBody)
    if (!parsedRequest.success) {
      return Response.json({ error: "Invalid image URL" }, { status: 400 })
    }

    const config = getS3StorageConfig()
    const imageUrl = new URL(parsedRequest.data.url)
    const expectedPrefix = `/${encodeURIComponent(config.bucket)}/`
    if (
      imageUrl.origin !== new URL(config.endpoint).origin ||
      !imageUrl.pathname.startsWith(expectedPrefix)
    ) {
      return Response.json({ error: "Image is not in product storage" }, { status: 400 })
    }

    const key = imageUrl.pathname
      .slice(expectedPrefix.length)
      .split("/")
      .map(decodeURIComponent)
      .join("/")
    const [ownerId, fileName, ...extraSegments] = key.split("/")
    if (
      extraSegments.length > 0 ||
      !/^[0-9a-f-]{36}$/i.test(ownerId) ||
      !/^[0-9a-f-]{36}\.(avif|gif|jpg|png|webp)$/i.test(fileName) ||
      (!isAdminRole(actor.role) && ownerId !== actor.id)
    ) {
      return Response.json({ error: "You cannot delete this image" }, { status: 403 })
    }

    await createS3Client().send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    )
    return Response.json({ message: "Image deleted" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized action") {
      return Response.json({ error: "You cannot delete product images" }, { status: 403 })
    }
    console.error("Failed to delete product image", error)
    return Response.json(
      { error: "Could not delete image" },
      { status: 500 },
    )
  }
}
