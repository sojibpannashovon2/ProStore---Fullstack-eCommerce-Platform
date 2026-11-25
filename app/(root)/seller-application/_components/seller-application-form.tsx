"use client"

import { useState, useTransition } from "react"

import {
  createSellerApplication,
} from "@/lib/actions/seller-application.actions"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ApplicationData = {
  id: string
  storeName: string
  description: string
  status: string
  rejectionReason: string | null
  documents: Array<{
    id: string
    type: string
    status: string
    fileName: string
    uploadedAt: Date
  }>
} | null

const documentTypes = [
  ["business_license", "Business license"],
  ["government_id", "Government-issued ID"],
  ["tax_document", "Tax document"],
] as const

export function SellerApplicationForm({
  initialApplication,
}: {
  initialApplication: ApplicationData
}) {
  const [application, setApplication] = useState(initialApplication)
  const [storeName, setStoreName] = useState(initialApplication?.storeName ?? "")
  const [description, setDescription] = useState(
    initialApplication?.description ?? "",
  )
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createSellerApplication({ storeName, description })
      setMessage(result.message)
      if (result.success && result.applicationId) {
        setApplication({
          id: result.applicationId,
          storeName,
          description,
          status: "pending",
          rejectionReason: null,
          documents: [],
        })
      }
    })
  }

  async function uploadDocument(type: string, file?: File) {
    if (!application || !file) return
    setMessage("")
    const formData = new FormData()
    formData.set("applicationId", application.id)
    formData.set("type", type)
    formData.set("file", file)

    try {
      const response = await fetch("/api/seller/documents", {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as {
        message?: string
        documentId?: string
      }
      if (!response.ok) {
        setMessage(result.message ?? "Document upload failed")
        return
      }

      setMessage("Document uploaded securely")
      setApplication((current) =>
        current
          ? {
              ...current,
              documents: [
                ...current.documents.filter((document) => document.type !== type),
                {
                  id: result.documentId ?? "",
                  type,
                  status: "pending",
                  fileName: file.name,
                  uploadedAt: new Date(),
                },
              ],
            }
          : current,
      )
    } catch {
      setMessage("Document upload failed. Please try again.")
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Apply to become a seller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!application || application.status === "rejected" ? (
          <form onSubmit={submitApplication} className="space-y-4">
            {application?.rejectionReason && (
              <p role="alert" className="text-sm text-destructive">
                Previous application rejected: {application.rejectionReason}
              </p>
            )}
            <label className="block space-y-2">
              <span>Store name</span>
              <Input
                required
                minLength={3}
                maxLength={100}
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span>Describe your business</span>
              <Textarea
                required
                minLength={20}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <Button disabled={isPending} type="submit">
              Submit application
            </Button>
          </form>
        ) : (
          <>
            <p>
              Application status: <strong>{application.status}</strong>
            </p>
            <p>{application.storeName}</p>
            {application.status === "pending" && (
              <div className="space-y-4">
                <p>
                  Upload each required document. Files are encrypted before
                  being stored and are only available to authorized reviewers.
                </p>
                {documentTypes.map(([type, label]) => {
                  const uploaded = application.documents.find(
                    (document) => document.type === type,
                  )
                  return (
                    <label
                      key={type}
                      className="block space-y-2 rounded-md border p-3"
                    >
                      <span>
                        {label}
                        {uploaded && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({uploaded.status})
                          </span>
                        )}
                      </span>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(event) =>
                          uploadDocument(type, event.target.files?.[0])
                        }
                      />
                    </label>
                  )
                })}
              </div>
            )}
          </>
        )}
        {message && <p role="status" className="text-sm">{message}</p>}
      </CardContent>
    </Card>
  )
}
