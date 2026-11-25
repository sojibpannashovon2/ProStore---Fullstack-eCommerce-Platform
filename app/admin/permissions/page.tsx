import type { Metadata } from "next"

import { getAdminRoleConfiguration } from "@/lib/actions/rbac.actions"
import { assertSuperAdmin } from "@/lib/auth-guard"

import { AccessManager } from "./_components/access-manager"

export const metadata: Metadata = {
  title: "Access Control",
  robots: { index: false, follow: false },
}

export default async function AccessControlPage() {
  await assertSuperAdmin()
  const data = await getAdminRoleConfiguration()
  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Access control</h1>
      <AccessManager data={data} />
    </div>
  )
}
