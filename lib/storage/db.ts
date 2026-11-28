import "server-only"

import { prisma } from "@/db/prisma"

const PREFIX = "/api/storage/images/"

export function isDbImageUrl(url: string): boolean {
  return url.startsWith(PREFIX)
}

export function dbImageKeyFromUrl(url: string): string {
  return decodeURIComponent(url.slice(PREFIX.length))
}

export async function saveDbImage(
  fileName: string,
  contentType: string,
  data: Uint8Array<ArrayBuffer>,
  createdBy: string,
): Promise<string> {
  await prisma.storedImage.create({
    data: {
      key: fileName,
      contentType,
      size: data.byteLength,
      data,
      createdBy,
    },
  })
  return `${PREFIX}${fileName}`
}

export async function getDbImage(key: string) {
  return prisma.storedImage.findUnique({
    where: { key },
    select: { contentType: true, data: true, size: true },
  })
}

export async function deleteDbImage(key: string): Promise<void> {
  await prisma.storedImage.deleteMany({ where: { key } })
}