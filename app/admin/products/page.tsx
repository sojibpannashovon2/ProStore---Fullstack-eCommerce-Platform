import type { Metadata } from "next"
import Link from "next/link"

import {
  deleteProduct,
  getAdminProducts,
} from "@/lib/actions/product.actions"
import { requireAdmin } from "@/lib/auth-guard"
import { formatCurrency, formatId } from "@/lib/utils"

import { AppPagination } from "@/components/shared/app-pagination"
import { TranslatedText } from "@/components/shared/translated-text"
import { DeleteDialog } from "@/components/shared/delete-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ApprovalButton } from "./_components/approval-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Admin Products",
}

interface AdminProductsPageProps {
  searchParams: Promise<{
    page: string
    query: string
    category: string
  }>
}

export default async function AdminProductsPage(props: AdminProductsPageProps) {
  await requireAdmin()

  const searchParams = await props.searchParams

  const page = Number(searchParams.page) || 1
  const searchText = searchParams.query || ""
  const category = searchParams.category || ""

  const products = await getAdminProducts({
    query: searchText,
    page,
    category,
  })

  return (
    <div className="space-y-4">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <h1 className="h2-bold"><TranslatedText text="Products" /></h1>
          {searchText && (
            <div>
              <TranslatedText text="Filtered by" /> <i>&quot;{searchText}&quot;</i>{" "}
              <Link href="/admin/products">
                <Button variant="outline" size="sm">
                  <TranslatedText text="Remove Filter" />
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button asChild variant="default">
          <Link href="/admin/products/create"><TranslatedText text="Create Product" /></Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><TranslatedText text="ID" /></TableHead>
            <TableHead><TranslatedText text="NAME" /></TableHead>
            <TableHead className="text-right"><TranslatedText text="PRICE" /></TableHead>
            <TableHead><TranslatedText text="CATEGORY" /></TableHead>
            <TableHead><TranslatedText text="STOCK" /></TableHead>
            <TableHead><TranslatedText text="RATING" /></TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]"><TranslatedText text="ACTIONS" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{formatId(product.id)}</TableCell>
              <TableCell>
                <TranslatedText text={product.name} kind="productName" />
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(product.price, "en", "USD", 2)}
              </TableCell>
              <TableCell><TranslatedText text={product.category} /></TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.rating}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.isArchived
                      ? "destructive"
                      : product.isApproved
                        ? "default"
                        : "secondary"
                  }
                >
                  {product.isArchived
                    ? "Archived"
                    : product.isApproved
                      ? "Approved"
                      : "Pending review"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-1">
                {!product.isApproved && !product.isArchived && (
                  <ApprovalButton productId={product.id} />
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/products/${product.id}`}><TranslatedText text="Edit" /></Link>
                </Button>
                <DeleteDialog id={product.id} action={deleteProduct} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {products.totalPages > 1 && (
        <AppPagination page={page} totalPages={products.totalPages} />
      )}
    </div>
  )
}
