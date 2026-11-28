import type { Metadata } from "next"
import Link from "next/link"

import type { Prisma } from "@prisma/client"

import { deleteUser } from "@/lib/actions/users.actions"
import { getActivitySummary } from "@/lib/actions/admin-rbac.actions"
import { requireAdmin } from "@/lib/auth-guard"
import { isOnline, msAgo } from "@/lib/activity"
import { canManageUser } from "@/lib/rbac"
import { formatDateTime, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { TranslatedText } from "@/components/shared/translated-text"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { AdminUserActions } from "@/components/admin/admin-user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { prisma } from "@/db/prisma"

export const metadata: Metadata = {
  title: "Admin Users",
}

interface AdminUsersPageProps {
  searchParams: Promise<{
    page?: string
    query?: string
    status?: string
    presence?: string
    inactive?: string
  }>
}

const PAGE_SIZE = 20

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const actor = await requireAdmin()
  const sp = await props.searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const query = sp.query?.trim() || ""
  const status = sp.status || "all"
  const presence = sp.presence || "all"
  const inactive = sp.inactive || "all"

  const summary = await getActivitySummary()

  const where: Prisma.UserWhereInput = { isDeleted: false }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ]
  }
  if (status !== "all") where.status = status as never
  if (presence === "online") {
    where.lastActiveAt = { gte: msAgo(5 * 60 * 1000) }
  } else if (presence === "offline") {
    where.OR = [
      ...(where.OR as Prisma.UserWhereInput[] | undefined) ?? [],
      { lastActiveAt: null },
      { lastActiveAt: { lt: msAgo(5 * 60 * 1000) } },
    ]
  }
  if (inactive !== "all") {
    const days = Number(inactive)
    if (Number.isFinite(days) && days > 0) {
      where.lastActiveAt = { lt: msAgo(days * 24 * 60 * 60 * 1000) }
    }
  }

  const [users, count] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        lastLoginIp: true,
        lastLoginLocation: true,
      },
    }),
    prisma.user.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const stats = [
    { label: "Total active", value: summary.total },
    { label: "Online now", value: summary.online },
    { label: "Inactive", value: summary.inactive },
    { label: "Blocked", value: summary.blocked },
    { label: "New this week", value: summary.newThisWeek },
  ]

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h1 className="h2-bold"><TranslatedText text="Users" /></h1>
        <Button asChild variant="default">
          <Link href="/admin/users/create"><TranslatedText text="Create User" /></Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs">{s.label}</div>
            <div className="text-xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-2" method="get">
        <div className="flex-1">
          <Input name="query" defaultValue={query} placeholder="Search name or email" />
        </div>
        <select name="status" defaultValue={status} className="h-9 rounded-md border px-2">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
        <select name="presence" defaultValue={presence} className="h-9 rounded-md border px-2">
          <option value="all">Any presence</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select name="inactive" defaultValue={inactive} className="h-9 rounded-md border px-2">
          <option value="all">Any activity</option>
          <option value="30">Inactive 30d+</option>
          <option value="60">Inactive 60d+</option>
          <option value="90">Inactive 90d+</option>
        </select>
        <Button type="submit" variant="outline">Filter</Button>
        <Link href="/admin/users"><Button variant="ghost">Reset</Button></Link>
      </form>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><TranslatedText text="NAME" /></TableHead>
              <TableHead><TranslatedText text="EMAIL" /></TableHead>
              <TableHead><TranslatedText text="ROLE" /></TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Presence</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>IP / Location</TableHead>
              <TableHead><TranslatedText text="ACTIONS" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const online = isOnline(user.lastActiveAt)
              const manageable = canManageUser(actor.role, user.role) && actor.id !== user.id
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "active"
                          ? "default"
                          : user.status === "blocked"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={online ? "text-emerald-600" : "text-muted-foreground"}>
                      {online ? "● Online" : "○ Offline"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt).dateTime : "—"}
                  </TableCell>
                  <TableCell>
                    {user.lastActiveAt ? formatDateTime(user.lastActiveAt).dateTime : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {user.lastLoginIp ?? "—"}
                    <br />
                    {user.lastLoginLocation ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AdminUserActions
                        userId={user.id}
                        status={user.status}
                        canChangeStatus={manageable}
                      />
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${user.id}`}>Edit</Link>
                      </Button>
                      {manageable && <DeleteDialog id={user.id} action={deleteUser} />}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <AppPagination page={page} totalPages={totalPages} />
        )}
      </div>
    </div>
  )
}