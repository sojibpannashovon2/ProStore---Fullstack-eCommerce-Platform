import "server-only"

import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"

/**
 * Fallback image storage used when no S3-compatible backend is configured.
 * Files are written to public/images/uploads and served as /images/uploads/... URLs.
 */
export const localUploadsDir = path.join(
  process.cwd(),
  "public",
  "images",
  "uploads",
)

export const localUploadsUrlPrefix = "/images/uploads/"

const localFileNamePattern = /^[0-9a-f-]{36}\.(avif|gif|jpg|png|webp)$/i

export function isLocalUploadUrl(url: string) {
  try {
    const parsed = new URL(url, "http://localhost")
    return (
      parsed.origin === "http://localhost" &&
      parsed.pathname.startsWith(localUploadsUrlPrefix) &&
      localFileNamePattern.test(
        decodeURIComponent(parsed.pathname.slice(localUploadsUrlPrefix.length)),
      )
    )
  } catch {
    return false
  }
}

export function localUploadKeyFromUrl(url: string) {
  return decodeURIComponent(
    new URL(url, "http://localhost").pathname.slice(
      localUploadsUrlPrefix.length,
    ),
  )
}

export function validateLocalUploadFileName(fileName: string) {
  if (!localFileNamePattern.test(fileName)) {
    throw new Error("Invalid upload file name")
  }
  return fileName
}

export async function saveLocalUpload(fileName: string, data: Buffer) {
  validateLocalUploadFileName(fileName)
  await mkdir(localUploadsDir, { recursive: true })
  await writeFile(path.join(localUploadsDir, fileName), data)
}

export async function deleteLocalUpload(fileName: string) {
  validateLocalUploadFileName(fileName)
  await unlink(path.join(localUploadsDir, fileName)).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  })
}
