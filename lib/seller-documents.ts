import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto"

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error("ENCRYPTION_KEY must contain at least 32 characters")
  }

  return createHmac("sha256", secret)
    .update("prostore-seller-document-encryption")
    .digest()
}

export function encryptSellerDocument(content: Buffer) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encryptedContent = Buffer.concat([
    cipher.update(content),
    cipher.final(),
  ])

  return { encryptedContent, iv, authTag: cipher.getAuthTag() }
}

export function decryptSellerDocument({
  content,
  iv,
  authTag,
}: {
  content: Buffer
  iv: Buffer
  authTag: Buffer
}) {
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(content), decipher.final()])
}
