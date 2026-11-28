import type { Metadata } from "next"
import Link from "next/link"

import {
  getDeletedProducts,
  getDeletedUsers,
  getDeletedWishlists,
} from "@/lib/actions/admin-rbac.actions"
import { assertSuperAdmin } from "@/lib/auth-guard"
import { formatCurrency, formatDateTime } from "@/lib/utils"

import { DeletedActions } from "@/components/admin/deleted-actions"
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
  title: "Deleted Items",
}

interface Props {
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { key: "users", label: "Deleted Users" },
  { key: "products", label: "Deleted Products" },
  { key: "wishlists", label: "Deleted Wishlists" },
]

export default async function DeletedItemsPage({ searchParams }: Props) {
  await assertSuperAdmin()
  const { tab = "users" } = await searchParams

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Deleted Items</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/deleted?tab=${t.key}`}>
            <Button variant={tab === t.key ? "default" : "outline"} size="sm">
              {t.label}
            </Button>
          </Link>
        ))}
      </div>

      {tab === "users" && <DeletedUsers />}
      {tab === "products" && <DeletedProducts />}
      {tab === "wishlists" && <DeletedWishlists />}
    </div>
  )
}

async function DeletedUsers() {
  const users = await getDeletedUsers()
  if (users.length === 0) return <p className="text-muted-foreground">No deleted users.</p>
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Prev role</TableHead>
            <TableHead>Prev status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Last login</TableHead>
            <TableHead>Deleted at</TableHead>
            <TableHead>Deleted by</TableHead>
            <TableHead>IP / Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.status}</TableCell>
              <TableCell>{formatDateTime(u.createdAt).dateOnly}</TableCell>
              <TableCell>{u.lastLoginAt ? formatDateTime(u.lastLoginAt).dateTime : "—"}</TableCell>
              <TableCell>{u.deletedAt ? formatDateTime(u.deletedAt).dateTime : "—"}</TableCell>
              <TableCell>
                {u.deletedByActor
                  ? `${u.deletedByActor.name} (${u.deletedByActor.role})`
                  : "—"}
              </TableCell>
              <TableCell className="text-xs">
                {u.deletedIp ?? "—"}<br />
                {u.deletedLocation ?? "—"}
              </TableCell>
              <TableCell>
                <DeletedActions kind="user" id={u.id} status={u.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

async function DeletedProducts() {
  const products = await getDeletedProducts()
  if (products.length === 0) return <p className="text-muted-foreground">No deleted products.</p>
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Deleted at</TableHead>
            <TableHead>Deleted by</TableHead>
            <TableHead>IP / Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{formatCurrency(p.price, "en", "USD", 2)}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>{p.category}</TableCell>
              <TableCell>{formatDateTime(p.createdAt).dateOnly}</TableCell>
              <TableCell>{formatDateTime(p.updatedAt).dateTime}</TableCell>
              <TableCell>{p.deletedAt ? formatDateTime(p.deletedAt).dateTime : "—"}</TableCell>
              <TableCell className="text-xs">
                {p.deletedBy ?? "—"}
                <br />
                {p.deletedIp ?? "—"} · {p.deletedLocation ?? "—"}
              </TableCell>
              <TableCell>
                <DeletedActions kind="product" id={p.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

async function DeletedWishlists() {
  const items = await getDeletedWishlists()
  if (items.length === 0) return <p className="text-muted-foreground">No deleted wishlist items.</p>
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Owner</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Deleted at</TableHead>
            <TableHead>IP / Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                {i.ownerName}
                <br />
                <span className="text-muted-foreground text-xs">{i.ownerEmail}</span>
              </TableCell>
              <TableCell>{i.productName}</TableCell>
              <TableCell>{formatCurrency(i.price, "en", "USD", 2)}</TableCell>
              <TableCell>{formatDateTime(i.addedAt).dateTime}</TableCell>
              <TableCell>{i.deletedAt ? formatDateTime(i.deletedAt).dateTime : "—"}</TableCell>
              <TableCell className="text-xs">
                {i.deletedIp ?? "—"} · {i.deletedLocation ?? "—"}
              </TableCell>
              <TableCell>
                <DeletedActions kind="wishlist" id={i.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}