import type { Metadata } from "next"
import Link from "next/link"

import { deleteOrder, getAllOrders } from "@/lib/actions/order.actions"
import { requireAdmin } from "@/lib/auth-guard"
import { getServerLocale } from "@/lib/i18n/locale"
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { TranslatedText } from "@/components/shared/translated-text"
import { DeleteDialog } from "@/components/shared/delete-dialog"
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
  title: "Admin Orders",
}

interface AdminOrdersPageProps {
  searchParams: Promise<{ page?: string; query?: string }>
}

export default async function AdminOrdersPage(props: AdminOrdersPageProps) {
  await requireAdmin()
  const locale = await getServerLocale()
  const { page = "1", query: searchText = "" } = await props.searchParams

  const orders = await getAllOrders({
    page: Number(page),
    query: searchText,
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h2 className="h2-bold"><TranslatedText text="Orders" /></h2>
        {searchText && (
          <div>
            <TranslatedText text="Filtered by" /> <i>&quot;{searchText}&quot;</i>{" "}
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <TranslatedText text="Remove Filter" />
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className="space-y-8 overflow-x-auto">
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><TranslatedText text="ID" /></TableHead>
                <TableHead><TranslatedText text="DATE" /></TableHead>
                <TableHead><TranslatedText text="BUYER" /></TableHead>
                <TableHead><TranslatedText text="TOTAL" /></TableHead>
                <TableHead><TranslatedText text="PAID" /></TableHead>
                <TableHead><TranslatedText text="DELIVERED" /></TableHead>
                <TableHead><TranslatedText text="ACTIONS" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatId(order.id)}</TableCell>
                  <TableCell>
                    {formatDateTime(order.createdAt).dateTime}
                  </TableCell>
                  <TableCell>{order.user.name}</TableCell>
                  <TableCell>
                    {formatCurrency(order.totalPrice, locale, "locale", 2)}
                  </TableCell>
                  <TableCell>
                    {order.isPaid && order.paidAt
                      ? formatDateTime(order.paidAt).dateTime
                      : <TranslatedText text="Not Paid" />}
                  </TableCell>
                  <TableCell>
                    {order.isDelivered && order.deliveredAt
                      ? formatDateTime(order.deliveredAt).dateTime
                      : <TranslatedText text="Not Delivered" />}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/order/${order.id}`}><TranslatedText text="Details" /></Link>
                    </Button>
                    <DeleteDialog action={deleteOrder} id={order.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {orders.totalPages > 1 && (
            <AppPagination
              page={Number(page) || 1}
              totalPages={orders?.totalPages}
            />
          )}
        </>
      </div>
    </div>
  )
}
