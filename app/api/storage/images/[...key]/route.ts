import { getDbImage } from "@/lib/storage/db"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params
  const keyString = key.map(decodeURIComponent).join("/")

  const image = await getDbImage(keyString)
  if (!image) {
    return new Response("Not found", { status: 404 })
  }

  const bytes = new Uint8Array(image.data)
  return new Response(bytes, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}