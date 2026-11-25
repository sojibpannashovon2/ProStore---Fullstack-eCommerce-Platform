"use client"

import { useState } from "react"
import { useTransition } from "react"

import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface DeleteDialogProps {
  id: string
  action: (id: string) => Promise<{ success: boolean; message: string }>
}

export function DeleteDialog({ id, action }: DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { locale } = useLocale()

  const handleDeleteClick = () => {
    startTransition(async () => {
      const res = await action(id)

      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
      } else {
        setOpen(false)
        toast.success(translateMessage(locale, res.message))
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" className="ml-2 cursor-pointer">
          <TranslatedText text="Delete" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <TranslatedText text="Are you absolutely sure?" />
          </AlertDialogTitle>
          <AlertDialogDescription>
            <TranslatedText text="This action cannot be undone" />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel><TranslatedText text="Cancel" /></AlertDialogCancel>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDeleteClick}
          >
            {isPending
              ? <TranslatedText text="Deleting..." />
              : <TranslatedText text="Delete" />}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
