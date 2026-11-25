"use server"

import { revalidatePath } from "next/cache"
import { SellerApplicationStatus, SellerDocumentType } from "@prisma/client"
import { z } from "zod"

import { prisma } from "@/db/prisma"
import {
  assertPermission,
  assertRole,
} from "@/lib/auth-guard"
import { formatError } from "@/lib/utils"

const sellerApplicationSchema = z.object({
  storeName: z.string().trim().min(3).max(100),
  description: z.string().trim().min(20).max(2000),
})

const requiredDocumentTypes = [
  SellerDocumentType.business_license,
  SellerDocumentType.government_id,
  SellerDocumentType.tax_document,
]

export async function createSellerApplication(input: {
  storeName: string
  description: string
}) {
  try {
    const applicant = await assertRole("customer")
    const data = sellerApplicationSchema.parse(input)
    const existing = await prisma.sellerApplication.findUnique({
      where: { userId: applicant.id },
    })

    if (existing?.status === SellerApplicationStatus.approved) {
      throw new Error("Your seller application is already approved")
    }
    if (existing?.status === SellerApplicationStatus.pending) {
      return {
        success: true,
        message: "Your application is already pending",
        applicationId: existing.id,
      }
    }

    const application = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.sellerDocument.deleteMany({
          where: { applicationId: existing.id },
        })
      }

      const savedApplication = existing
        ? await tx.sellerApplication.update({
          where: { id: existing.id },
          data: {
            ...data,
            status: SellerApplicationStatus.pending,
            rejectionReason: null,
            reviewedById: null,
            reviewedAt: null,
            submittedAt: new Date(),
          },
        })
        : await tx.sellerApplication.create({
            data: { ...data, userId: applicant.id },
          })

      await tx.auditLog.create({
        data: {
          actorId: applicant.id,
          action: "seller.application.submitted",
          targetType: "SellerApplication",
          targetId: savedApplication.id,
        },
      })
      return savedApplication
    })

    revalidatePath("/seller-application")
    revalidatePath("/admin/sellers/applications")

    return {
      success: true,
      message: "Application created. Upload all three verification documents.",
      applicationId: application.id,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getMySellerApplication() {
  const applicant = await assertRole("customer")
  return prisma.sellerApplication.findUnique({
    where: { userId: applicant.id },
    select: {
      id: true,
      storeName: true,
      description: true,
      status: true,
      rejectionReason: true,
      documents: {
        select: {
          id: true,
          type: true,
          status: true,
          fileName: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: "desc" },
      },
    },
  })
}

export async function getPendingSellerApplications() {
  await assertPermission("sellerApplications.manage")
  return prisma.sellerApplication.findMany({
    where: { status: SellerApplicationStatus.pending },
    orderBy: { submittedAt: "asc" },
    take: 100,
    select: {
      id: true,
      storeName: true,
      description: true,
      submittedAt: true,
      user: { select: { name: true, email: true } },
      documents: {
        select: { id: true, type: true, status: true, fileName: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  })
}

export async function reviewSellerApplication(
  applicationId: string,
  decision: "approve" | "reject",
  rejectionReason = "",
) {
  try {
    const reviewer = await assertPermission("sellerApplications.manage")
    const id = z.string().uuid().parse(applicationId)
    const parsedDecision = z.enum(["approve", "reject"]).parse(decision)
    const reason = z.string().trim().max(1000).parse(rejectionReason)
    const application = await prisma.sellerApplication.findUnique({
      where: { id },
      include: { documents: { select: { type: true } } },
    })
    if (!application) throw new Error("Seller application not found")
    if (application.status !== SellerApplicationStatus.pending) {
      throw new Error("This application has already been reviewed")
    }

    if (parsedDecision === "approve") {
      const providedTypes = new Set(application.documents.map((doc) => doc.type))
      if (requiredDocumentTypes.some((type) => !providedTypes.has(type))) {
        throw new Error("All three verification documents are required")
      }
    } else if (reason.length < 10) {
      throw new Error("Provide a rejection reason of at least 10 characters")
    }

    await prisma.$transaction(async (tx) => {
      const status =
        parsedDecision === "approve"
          ? SellerApplicationStatus.approved
          : SellerApplicationStatus.rejected

      await tx.sellerApplication.update({
        where: { id },
        data: {
          status,
          rejectionReason: parsedDecision === "reject" ? reason : null,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
      })
      await tx.sellerDocument.updateMany({
        where: { applicationId: id },
        data: {
          status: parsedDecision === "approve" ? "approved" : "rejected",
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
      })

      if (parsedDecision === "approve") {
        const slugBase =
          application.storeName
            .normalize("NFKD")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "store"
        const slug = `${slugBase}-${application.userId.slice(0, 8)}`

        await tx.user.update({
          where: { id: application.userId },
          data: { role: "seller" },
        })
        await tx.store.create({
          data: {
            sellerId: application.userId,
            name: application.storeName,
            slug,
            description: application.description,
          },
        })
      }

      await tx.auditLog.create({
        data: {
          actorId: reviewer.id,
          action:
            parsedDecision === "approve"
              ? "seller.application.approved"
              : "seller.application.rejected",
          targetType: "SellerApplication",
          targetId: id,
          metadata:
            parsedDecision === "reject"
              ? { rejectionReason: reason }
              : undefined,
        },
      })
    })

    revalidatePath("/admin/sellers/applications")
    revalidatePath("/admin/users")
    revalidatePath("/seller-application")
    revalidatePath("/seller")

    return {
      success: true,
      message: `Seller application ${parsedDecision}d`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
