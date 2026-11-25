import Image from "next/image"
import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import type { Cart } from "@/types"

import { CartActionButton } from "@/components/shared/cart-action-button"
import { CurrencyText } from "@/components/shared/currency-text"
import { EmptyState } from "@/components/shared/empty-state"
import { TranslatedText } from "@/components/shared/translated-text"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SubtotalCard } from "./subtotal-card"

interface CartTable {
  cart?: Cart
}

export function CartTable({ cart }: CartTable) {
  return (
    <>
      <h1 className="h2-bold py-4">
        <TranslatedText text="Shopping Cart" />
      </h1>
      {!cart || cart.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon className="size-6" />}
          title="Cart is empty."
          description="Add a few items to your cart and they will appear here."
          actionLabel="Go Shopping"
          actionHref="/"
        />
      ) : (
        <div className="grid md:grid-cols-4 md:gap-5">
          <div className="overflow-x-auto md:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><TranslatedText text="Item" /></TableHead>
                  <TableHead className="text-center"><TranslatedText text="Quantity" /></TableHead>
                  <TableHead className="text-right"><TranslatedText text="Price" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className="flex items-center"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        />
                        <span className="px-2">
                          <TranslatedText text={item.name} kind="productName" />
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="flex-center gap-3">
                      <CartActionButton item={item} actionType="remove" />
                      <span>{item.qty}</span>
                      <CartActionButton item={item} actionType="add" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText value={item.price} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <SubtotalCard cart={cart} />
        </div>
      )}
    </>
  )
}
