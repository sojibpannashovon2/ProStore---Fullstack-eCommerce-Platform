"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import {
  permanentDeleteProduct,
  permanentDeleteUser,
  permanentDeleteWishlistItem,
  restoreProduct,
  restoreUser,
  updateUserStatus,
} from "@/lib/actions/admin-rbac.actions"

import { Button } from "@/components/ui/button"

interface Props {
  kind: "user" | "product" | "wishlist"
  id: string
  status?: string
}

export function DeletedActions({ kind, id, status }: Props) {
  const [pending, startTransition] = useTransition()

  const restore = () => {
    startTransition(async () => {
      const res =
        kind === "user"
          ? await restoreUser(id)
          : kind === "product"
            ? await restoreProduct(id)
            : { success: false, message: "Restore not supported for wishlist items" }
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const changeStatus = (value: string) => {
    startTransition(async () => {
      const res = await updateUserStatus(id, value)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const permanent = () => {
    const reason = window.prompt("Reason for permanent deletion (required):")
    if (!reason || reason.trim().length < 3) {
      toast.error("A reason of at least 3 characters is required")
      return
    }
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) {
      return
    }
    startTransition(async () => {
      const res =
        kind === "user"
          ? await permanentDeleteUser(id, reason)
          : kind === "product"
            ? await permanentDeleteProduct(id, reason)
            : await permanentDeleteWishlistItem(id, reason)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {kind !== "wishlist" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={restore}>
          Restore
        </Button>
      )}
      {kind === "user" && (
        <select
          defaultValue={status ?? "active"}
          disabled={pending}
          onChange={(e) => changeStatus(e.target.value)}
          className="h-8 rounded-md border px-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={permanent}>
        Permanent delete
      </Button>
    </div>
  )
}