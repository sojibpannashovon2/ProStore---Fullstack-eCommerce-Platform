import { notFound, redirect } from "next/navigation"

import type { UpdateUser } from "@/types"

import { getUserById } from "@/lib/actions/users.actions"
import { requireAdmin } from "@/lib/auth-guard"

import { UpdateUserForm } from "../_components/update-user-form"
import { TranslatedText } from "@/components/shared/translated-text"

interface AdminUserUpdatePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminUserUpdatePage(
  props: AdminUserUpdatePageProps,
) {
  const actor = await requireAdmin()

  const { id } = await props.params

  const user = await getUserById(id)

  if (!user || user.role === "super_admin") notFound()
  if (user.role === "admin" && actor.role !== "super_admin") {
    redirect("/unauthorized")
  }
  const formUser: UpdateUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role:
      user.role === "admin"
        ? "admin"
        : user.role === "seller"
          ? "seller"
          : "customer",
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="h2-bold"><TranslatedText text="Update User" /></h1>
      <UpdateUserForm user={formUser} />
    </div>
  )
}
