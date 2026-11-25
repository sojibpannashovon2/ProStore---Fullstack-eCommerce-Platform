import type { Metadata } from "next"
import Link from "next/link"

import { deleteUser, getAllUsers } from "@/lib/actions/users.actions"
import { requireAdmin } from "@/lib/auth-guard"
import { formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { TranslatedText } from "@/components/shared/translated-text"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Admin Users",
}

interface AdminUsersPageProps {
  searchParams: Promise<{
    page?: string
    query?: string
  }>
}

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  await requireAdmin()

  const { page = "1", query: searchText = "" } = await props.searchParams

  const users = await getAllUsers({ page: Number(page), query: searchText })

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <h1 className="h2-bold"><TranslatedText text="Users" /></h1>
          {searchText && (
            <div>
              <TranslatedText text="Filtered by" /> <i>&quot;{searchText}&quot;</i>{" "}
              <Link href="/admin/users">
                <Button variant="outline" size="sm">
                  <TranslatedText text="Remove Filter" />
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild variant="default">
          <Link href="/admin/users/create"><TranslatedText text="Create User" /></Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><TranslatedText text="ID" /></TableHead>
              <TableHead><TranslatedText text="NAME" /></TableHead>
              <TableHead><TranslatedText text="EMAIL" /></TableHead>
              <TableHead><TranslatedText text="ROLE" /></TableHead>
              <TableHead><TranslatedText text="ACTIONS" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    <TranslatedText
                      text={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users/${user.id}`}><TranslatedText text="Edit" /></Link>
                  </Button>
                  <DeleteDialog id={user.id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.totalPages > 1 && (
          <AppPagination
            page={Number(page) || 1}
            totalPages={users?.totalPages}
          />
        )}
      </div>
    </div>
  )
}
