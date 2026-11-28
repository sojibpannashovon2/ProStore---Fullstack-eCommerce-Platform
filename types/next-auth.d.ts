import { DefaultSession } from "next-auth"

declare module "next-auth" {
  export interface Session {
    user: {
      id: string
      role: string
      tokenVersion: number
    } & DefaultSession["user"]
  }

  export interface User {
    tokenVersion?: number
  }
}

declare module "next-auth/jwt" {
  export interface JWT {
    id?: string
    role?: string
    tokenVersion?: number
  }
}