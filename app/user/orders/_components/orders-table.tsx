import Link from "next/link"

import { getMyOrders } from "@/lib/actions/order.actions"
import { formatDateTime, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { CurrencyText } from "@/components/shared/currency-text"
import { TranslatedText } from "@/components/shared/translated-text"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrdersTableProps {
  searchParams: Promise<{ page: string }>
}

export async function OrdersTable({ searchParams }: OrdersTableProps) {
  const { page } = await searchParams

  const orders = await getMyOrders({
    page: Number(page) || 1,
  })

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><TranslatedText text="ID" /></TableHead>
            <TableHead><TranslatedText text="DATE" /></TableHead>
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
              <TableCell>{formatDateTime(order.createdAt).dateTime}</TableCell>
              <TableCell>
                <CurrencyText
                  value={String(order.totalPrice)}
                  currency={
                    ["PayPal", "Stripe"].includes(order.paymentMethod)
                      ? "USD"
                      : "BDT"
                  }
                />
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
                  <Link href={`/order/${order.id}`}>
                    <TranslatedText text="Details" />
                  </Link>
                </Button>
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
  )
}
