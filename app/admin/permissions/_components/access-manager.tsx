"use client"

import { useState, useTransition } from "react"

import {
  setAdminRolePermissions,
  setManagedUserRole,
} from "@/lib/actions/rbac.actions"

import { Button } from "@/components/ui/button"

type AccessManagerData = {
  permissions: Array<{ key: string; description: string }>
  adminPermissions: string[]
  users: Array<{
    id: string
    name: string
    email: string
    role: "super_admin" | "admin" | "seller" | "customer"
  }>
}

export function AccessManager({ data }: { data: AccessManagerData }) {
  const [selected, setSelected] = useState(() => new Set(data.adminPermissions))
  const [roles, setRoles] = useState(
    () => new Map(data.users.map((user) => [user.id, user.role])),
  )
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function savePermissions() {
    startTransition(async () => {
      const result = await setAdminRolePermissions([...selected])
      setMessage(result.message)
    })
  }

  function saveRole(userId: string) {
    const role = roles.get(userId)
    if (!role || role === "super_admin") return

    startTransition(async () => {
      const result = await setManagedUserRole({ userId, role })
      setMessage(result.message)
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="h3-bold">Administrator role permissions</h2>
          <p className="text-sm text-muted-foreground">
            These permissions apply to every administrator account. Super
            administrator access is reserved and cannot be granted here.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.permissions.map((permission) => (
            <label key={permission.key} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected.has(permission.key)}
                onChange={(event) =>
                  setSelected((current) => {
                    const next = new Set(current)
                    if (event.target.checked) next.add(permission.key)
                    else next.delete(permission.key)
                    return next
                  })
                }
              />
              <span>
                <span className="block font-medium">{permission.key}</span>
                <span className="text-sm text-muted-foreground">
                  {permission.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        <Button type="button" disabled={isPending} onClick={savePermissions}>
          Save administrator permissions
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="h3-bold">Manage accounts</h2>
        <div className="space-y-2">
          {data.users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Role for ${user.email}`}
                  value={roles.get(user.id)}
                  disabled={user.role === "super_admin"}
                  onChange={(event) =>
                    setRoles((current) => {
                      const next = new Map(current)
                      next.set(
                        user.id,
                        event.target.value === "admin" ||
                        event.target.value === "seller" ||
                        event.target.value === "customer"
                          ? event.target.value
                          : "customer",
                      )
                      return next
                    })
                  }
                >
                  <option value="customer">Customer</option>
                  <option value="seller" disabled>
                    Seller (verified workflow)
                  </option>
                  <option value="admin">Administrator</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || user.role === "super_admin"}
                  onClick={() => saveRole(user.id)}
                >
                  Save role
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {message && <p role="status">{message}</p>}
    </div>
  )
}
