"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  getUserLoginHistory,
  updateUserStatus,
} from "@/lib/actions/admin-rbac.actions"
import { formatDateTime } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  userId: string
  status: string
  canChangeStatus: boolean
}

type LoginRow = {
  id: string
  loginAt: string | Date
  logoutAt: string | Date | null
  ipAddress: string | null
  device: string | null
  browser: string | null
  location: string | null
  success: boolean
}

export function AdminUserActions({ userId, status, canChangeStatus }: Props) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [logins, setLogins] = useState<LoginRow[] | null>(null)

  const onStatus = (value: string) => {
    startTransition(async () => {
      const res = await updateUserStatus(userId, value)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  const loadActivity = () => {
    setOpen(true)
    setLogins(null)
    startTransition(async () => {
      try {
        const rows = await getUserLoginHistory(userId)
        setLogins(rows as unknown as LoginRow[])
      } catch {
        toast.error("Failed to load activity")
        setLogins([])
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {canChangeStatus && (
        <Select value={status} onValueChange={onStatus} disabled={pending}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={loadActivity}>
            Activity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Login history</DialogTitle>
          </DialogHeader>
          {logins === null ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : logins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No login history.</p>
          ) : (
            <div className="space-y-2">
              {logins.map((l) => (
                <div key={l.id} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={l.success ? "text-emerald-600" : "text-red-600"}>
                      {l.success ? "Success" : "Failed"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateTime(new Date(l.loginAt)).dateTime}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {l.browser ?? "?"} · {l.device ?? "?"} · {l.ipAddress ?? "?"} ·{" "}
                    {l.location ?? "?"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}