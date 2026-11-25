import { createHmac, timingSafeEqual } from "node:crypto"

import {
  compare as compareBcrypt,
  hash as hashBcrypt,
} from "bcrypt-ts-edge"

export const hash = async (plainPassword: string): Promise<string> => {
  return hashBcrypt(plainPassword, 12)
}

export const compare = async (
  plainPassword: string,
  encryptedPassword: string,
): Promise<boolean> => {
  if (encryptedPassword.startsWith("$2")) {
    return compareBcrypt(plainPassword, encryptedPassword)
  }

  const legacyHash = createHmac(
    "sha256",
    process.env.ENCRYPTION_KEY ?? "",
  ).update(plainPassword).digest()
  const storedHash = Buffer.from(encryptedPassword, "hex")

  return (
    storedHash.length === legacyHash.length &&
    timingSafeEqual(storedHash, legacyHash)
  )
}
