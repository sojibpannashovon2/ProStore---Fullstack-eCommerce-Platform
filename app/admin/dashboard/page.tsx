import type { Metadata } from "next"
import Link from "next/link"

import { Eye } from "lucide-react"

import { getOrderSummary } from "@/lib/actions/order.actions"
import { requirePermission } from "@/lib/auth-guard"
import { getServerLocale } from "@/lib/i18n/locale"
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Charts } from "./_components/charts"
import { DashboardCard } from "./_components/dashboard-card"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default async function AdminDashboardPage() {
  await requirePermission("dashboard.view")

  const locale = await getServerLocale()
  const summary = await getOrderSummary()

  return (
    <div className="space-y-4">
      <h1 className="h2-bold"><TranslatedText text="Dashboard" /></h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          icon={{ name: "BadgeDollarSign" }}
          value={formatCurrency(
            summary.totalSales._sum.totalPrice?.toString() || 0,
            locale,
            "locale",
            2,
          )}
        />
        <DashboardCard
          title="Sales"
          icon={{ name: "CreditCard" }}
          value={formatNumber(summary.ordersCount)}
        />
        <DashboardCard
          title="Customers"
          icon={{ name: "Users" }}
          value={formatNumber(summary.usersCount)}
        />
        <DashboardCard
          title="Products"
          icon={{ name: "Barcode" }}
          value={formatNumber(summary.productsCount)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full w-full md:col-span-4">
          <CardHeader>
            <CardTitle><TranslatedText text="Overview" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </CardContent>
        </Card>
        <Card className="col-span-full w-full md:col-span-3">
          <CardHeader>
            <CardTitle><TranslatedText text="Recent Sales" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><TranslatedText text="BUYER" /></TableHead>
                  <TableHead><TranslatedText text="DATE" /></TableHead>
                  <TableHead><TranslatedText text="TOTAL" /></TableHead>
                  <TableHead><TranslatedText text="ACTIONS" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      {order?.user?.name ? order.user.name : <TranslatedText text="Deleted User" />}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(order.createdAt).dateOnly}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(order.totalPrice, locale, "locale", 2)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/order/${order.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                        >
                          <Eye />
                          <span className="sr-only"><TranslatedText text="order details" /></span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
