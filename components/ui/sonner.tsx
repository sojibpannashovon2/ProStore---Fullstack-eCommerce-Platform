"use client"

import { useTheme } from "next-themes"
import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, XCircleIcon } from "lucide-react"
import { Toaster as Sonner, ToasterProps, toast as sonnerToast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand
      richColors
      closeButton
      icons={{
        success: <CheckCircle2Icon className="size-4 text-emerald-500" />,
        error: <XCircleIcon className="size-4 text-red-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        info: <InfoIcon className="size-4 text-sky-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:rounded-xl group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md group-[.toaster]:border group-[.toaster]:px-4 group-[.toaster]:py-3",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[15px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          success:
            "group-[.toast]:border-emerald-500/40 group-[.toast]:bg-emerald-50/95 dark:group-[.toast]:bg-emerald-950/80",
          error:
            "group-[.toast]:border-red-500/40 group-[.toast]:bg-red-50/95 dark:group-[.toast]:bg-red-950/80",
          warning:
            "group-[.toast]:border-amber-500/40 group-[.toast]:bg-amber-50/95 dark:group-[.toast]:bg-amber-950/80",
          info: "group-[.toast]:border-sky-500/40 group-[.toast]:bg-sky-50/95 dark:group-[.toast]:bg-sky-950/80",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

/**
 * Show a beautiful animated success notification for any completed action
 * (account creation, role change, product added, coupon added, wishlist add,
 * review added, order placed, etc.).
 *
 * Usage: showSuccessToast("Product created successfully")
 */
export function showSuccessToast(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 4000,
  })
}

export { Toaster }
