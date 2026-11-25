import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"

import { deleteProduct, getSellerProducts } from "@/lib/actions/product.actions"
import { formatCurrency, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { DeleteDialog } from "@/components/shared/delete-dialog"
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

export const metadata: Metadata = {
  title: "Seller Products",
}

interface SellerProductsPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function SellerProductsPage({
  searchParams,
}: SellerProductsPageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const locale =
    (await cookies()).get("locale")?.value === "en" ? "en" : "bn"
  const products = await getSellerProducts(page)

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <h1 className="h2-bold">
          <TranslatedText text="Seller Products" />
        </h1>
        <Button asChild>
          <Link href="/seller/products/create">
            <TranslatedText text="Create Product" />
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><TranslatedText text="ID" /></TableHead>
              <TableHead><TranslatedText text="NAME" /></TableHead>
              <TableHead className="text-right"><TranslatedText text="PRICE" /></TableHead>
              <TableHead><TranslatedText text="STOCK" /></TableHead>
              <TableHead>Status</TableHead>
              <TableHead><TranslatedText text="ACTIONS" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <TranslatedText text="No products found" />
                </TableCell>
              </TableRow>
            ) : (
              products.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{formatId(product.id)}</TableCell>
                  <TableCell>
                    <TranslatedText text={product.name} kind="productName" />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.price, locale, "USD", 2)}
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <TranslatedText
                      text={product.isApproved ? "Approved" : "Pending review"}
                    />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/seller/products/${product.id}`}>
                        <TranslatedText text="Edit" />
                      </Link>
                    </Button>
                    <DeleteDialog id={product.id} action={deleteProduct} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {products.totalPages > 1 && (
          <AppPagination page={page} totalPages={products.totalPages} />
        )}
      </div>
    </div>
  )
}
