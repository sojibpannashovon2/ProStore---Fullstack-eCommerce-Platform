import { TranslatedText } from "@/components/shared/translated-text"

import { DollarSign, Headset, ShoppingBag, WalletCards } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function IconBoxes() {
  return (
    <div>
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <div className="space-y-2">
            <ShoppingBag />
            <div className="text-sm font-bold">
              <TranslatedText text="Free Shipping" />
            </div>
            <div className="text-muted-foreground text-sm">
              <TranslatedText text="Free shipping on orders above $100" />
            </div>
          </div>
          <div className="space-y-2">
            <DollarSign />
            <div className="text-sm font-bold">
              <TranslatedText text="Money Back Guarantee" />
            </div>
            <div className="text-muted-foreground text-sm">
              <TranslatedText text="Within 30 days of purchase" />
            </div>
          </div>
          <div className="space-y-2">
            <WalletCards />
            <div className="text-sm font-bold">
              <TranslatedText text="Flexible Payment" />
            </div>
            <div className="text-muted-foreground text-sm">
              <TranslatedText text="Pay with credit card, PayPal or COD" />
            </div>
          </div>
          <div className="space-y-2">
            <Headset />
            <div className="text-sm font-bold">
              <TranslatedText text="24/7 Support" />
            </div>
            <div className="text-muted-foreground text-sm">
              <TranslatedText text="Get support at any time" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
