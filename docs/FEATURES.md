# Features

## Storefront
- Search, category/brand/price/rating filters, sorting, pagination.
- Product pages with galleries, reviews, stock, seller.
- Guest cart → user cart merge on login; live totals.
- 3-step checkout (Shipping → Payment → Review) and order tracking.
- Private wishlist with soft-delete awareness.

## Payments
- PayPal, Stripe, SSLCommerz (default; bKash/Nagad), Cash on Delivery.
- Server-validated coupons.

## Localization
- English / Bangla UI switch (locale cookie).
- Currency: Bangla → ৳ BDT, English → $ USD (storefront + admin), using `NEXT_PUBLIC_USD_TO_BDT_RATE`.

## Admin Dashboard
- Analytics cards + sales chart; recent sales.
- Products: create/edit/soft-delete, approval; SuperAdmin sees created/updated metadata.
- Orders, coupons, categories, seller applications.
- Users: activity summary (total/online/inactive/blocked/new this week), filters (status, presence, inactive 30/60/90), status change, login-history viewer.
- Deleted Items (SuperAdmin): users/products/wishlists with restore, status change, permanent delete.
- Security: blocked IPs, failed logins, alerts; block/unblock with reasons.

## Seller Dashboard
- Own products only; stock/price; own orders; own sales.
- Onboarding application with encrypted documents.

## AI Shopping Agent
Bilingual, deterministic agent in `lib/ai/custom-shopping-agent.ts` (optional Ollama). Intents include:
- Greeting, help, thanks.
- Recommendations, comparisons (2–3), budget (under X), price range (X–Y).
- Category browse, brand search, category+price multi-filter.
- Top-rated, rating threshold (e.g. "4 star+"), newest arrivals.
- In-stock, out-of-stock, stock availability.
- Product detail, similar/related, surprise/random.
- Deals/offers, gift finder, category counts.
- Shipping/returns, support contact, order status, sort-by-name, cheapest-per-brand, care/how-to.
- Fallback.

## Notifications & Toasts
- All actions show success/error toasts (`sonner`).
- Security alerts create in-app notifications for SuperAdmins and email (Resend) when configured.