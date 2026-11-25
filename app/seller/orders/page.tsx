import type { Metadata } from "next"
import { cookies } from "next/headers"

import { getSellerOrders } from "@/lib/actions/order.actions"
import { formatCurrency, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { TranslatedText } from "@/components/shared/translated-text"
import { FulfillmentActions } from "./_components/fulfillment-actions"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Seller Orders",
}

interface SellerOrdersPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function SellerOrdersPage({
  searchParams,
}: SellerOrdersPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const locale =
    (await cookies()).get("locale")?.value === "en" ? "en" : "bn"
  const orders = await getSellerOrders({ page })

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">
        <TranslatedText text="Seller Orders" />
      </h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><TranslatedText text="ORDER" /></TableHead>
              <TableHead><TranslatedText text="DATE" /></TableHead>
              <TableHead><TranslatedText text="Your items" /></TableHead>
              <TableHead className="text-right"><TranslatedText text="Your items subtotal" /></TableHead>
              <TableHead><TranslatedText text="Payment" /></TableHead>
              <TableHead><TranslatedText text="Delivery" /></TableHead>
              <TableHead><TranslatedText text="Fulfillment" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <TranslatedText text="No orders found" />
                </TableCell>
              </TableRow>
            ) : (
              orders.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatId(order.id)}</TableCell>
                  <TableCell>
                    {order.createdAt.toLocaleDateString(
                      locale === "bn" ? "bn-BD" : "en-US",
                    )}
                  </TableCell>
                  <TableCell>
                    <ul className="space-y-1">
                      {order.orderitems.map((item) => (
                        <li key={item.productId}>
                          <TranslatedText text={item.name} kind="productName" /> ×{" "}
                          {item.qty}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.sellerItemsTotal, locale, "USD", 2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.isPaid ? "default" : "secondary"}>
                      <TranslatedText text={order.isPaid ? "Paid" : "Not paid"} />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.isDelivered ? "default" : "secondary"}>
                      <TranslatedText
                        text={order.isDelivered ? "Delivered" : "Not delivered"}
                      />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <FulfillmentActions
                      sellerOrderId={order.sellerOrderId}
                      status={order.status}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {orders.totalPages > 1 && (
          <AppPagination page={page} totalPages={orders.totalPages} />
        )}
      </div>
    </div>
  )
}
