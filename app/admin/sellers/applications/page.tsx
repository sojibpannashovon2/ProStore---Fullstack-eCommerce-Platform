import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"

import { getPendingSellerApplications } from "@/lib/actions/seller-application.actions"
import { requirePermission } from "@/lib/auth-guard"

import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewControls } from "./_components/review-controls"

export const metadata: Metadata = {
  title: "Seller Applications",
}

export default async function SellerApplicationsPage() {
  await requirePermission("sellerApplications.manage")
  const applications = await getPendingSellerApplications()

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Seller applications</h1>
      {applications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="No pending seller applications"
          description="New applications will appear here for administrator review."
          actionLabel="View dashboard"
          actionHref="/admin/dashboard"
        />
      ) : (
        applications.map((application) => (
          <Card key={application.id}>
            <CardHeader>
              <CardTitle>{application.storeName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {application.user.name} · {application.user.email} ·{" "}
                {application.submittedAt.toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap">{application.description}</p>
              <ul className="space-y-1">
                {application.documents.map((document) => (
                  <li key={document.id} className="text-sm">
                    {document.type.replaceAll("_", " ")} — {document.fileName}{" "}
                    <a
                      className="underline"
                      href={`/api/admin/seller-documents/${document.id}`}
                    >
                      Download securely
                    </a>
                  </li>
                ))}
              </ul>
              <ReviewControls applicationId={application.id} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
