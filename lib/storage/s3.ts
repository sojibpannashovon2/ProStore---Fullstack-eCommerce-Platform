import "server-only"

import { S3Client } from "@aws-sdk/client-s3"

const storageEnvKeys = [
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
] as const

export function isS3StorageConfigured() {
  return storageEnvKeys.every((key) => Boolean(process.env[key]?.trim()))
}

export function getS3StorageConfig() {
  const missingKeys = storageEnvKeys.filter(
    (key) => !process.env[key]?.trim(),
  )
  if (missingKeys.length > 0) {
    throw new Error(`Missing S3 storage configuration: ${missingKeys.join(", ")}`)
  }

  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.trim()
  const endpointUrl = new URL(endpoint)
  if (endpointUrl.protocol !== "https:") {
    throw new Error("AWS_ENDPOINT_URL_S3 must use HTTPS")
  }

  return {
    endpoint: endpointUrl.toString().replace(/\/+$/, ""),
    region: process.env.AWS_REGION!.trim(),
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
    bucket: process.env.AWS_BUCKET_NAME!.trim(),
  }
}

export function createS3Client() {
  const config = getS3StorageConfig()
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export function getPublicObjectUrl(key: string) {
  const { endpoint, bucket } = getS3StorageConfig()
  const encodedKey = key.split("/").map(encodeURIComponent).join("/")
  return `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`
}
