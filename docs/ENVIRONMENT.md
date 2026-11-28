# Environment Variables

Copy `.env.example` → `.env`. Values marked public are exposed to the browser.

## General
| Variable | Public | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | ✓ | App name (Kinora) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | ✓ | App description |
| `NEXT_PUBLIC_SERVER_URL` | ✓ | Base URL |
| `NEXT_PUBLIC_TARGET_DATE` | ✓ | Optional countdown/promo date |

## Auth & Security
| Variable | Description |
|---|---|
| `AUTH_SECRET` | Token signing secret |
| `AUTH_TRUST_HOST` | `true` to trust host (Vercel) |
| `ENCRYPTION_KEY` | ≥32-char secret for encryption |
| `SUPER_ADMIN_EMAIL` | Account to promote via `db:promote-super-admin` |
| `SUPER_ADMIN_ALERT_EMAIL` | Optional explicit security-alert recipient |
| `ALERT_FROM_EMAIL` | Optional alert sender (Resend) |

## Database
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon) connection string |

## Payments
| Variable | Description |
|---|---|
| `PAYMENT_METHODS` | Comma list (PayPal,Stripe,SSLCOMMERZ,CashOnDelivery) |
| `DEFAULT_PAYMENT_METHOD` | Default gateway (SSLCOMMERZ) |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` / `SSLCOMMERZ_SANDBOX` | SSLCommerz |
| `PAYPAL_API_URL` / `PAYPAL_CLIENT_ID` / `PAYPAL_APP_SECRET` | PayPal |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |

## Currency
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_USD_TO_BDT_RATE` | USD→BDT rate (default 123) |

## Storage (images)
Product images are stored in the database (`StoredImage` table) by default and served from `/api/storage/images/...` — no configuration required, works on serverless.

Optional: set the S3-compatible Neon Object Storage vars below to store images in a bucket instead. If unset, uploads fall back to database storage, then local disk (dev only).
| Variable | Description |
|---|---|
| `AWS_ENDPOINT_URL_S3` | S3 endpoint (HTTPS) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credentials |
| `AWS_REGION` | Region |
| `AWS_BUCKET_NAME` | Bucket (e.g. product-images) |
| `UPLOADTHING_TOKEN` | Optional legacy upload token |

## AI (optional local)
| Variable | Description |
|---|---|
| `OLLAMA_BASE_URL` | e.g. http://127.0.0.1:11434 |
| `OLLAMA_MODEL` | e.g. qwen2.5:3b |

## Email
| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key (receipts + security alerts) |
| `SENDER_EMAIL` | Sender address |