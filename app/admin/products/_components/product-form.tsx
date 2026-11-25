"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { type ChangeEvent, useState, useTransition } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { XIcon } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"
import slugify from "slugify"
import { toast } from "sonner"

import type { InsertProduct, Product, UpdateProduct } from "@/types"

import { createProduct, updateProduct } from "@/lib/actions/product.actions"
import { insertProductSchema, updateProductSchema } from "@/lib/validators"

import { productDefaultValues } from "@/constants"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TranslatedText } from "@/components/shared/translated-text"
import { translate, translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface ProductFormProps {
  type: "Create" | "Update"
  imageUploadsEnabled: boolean
  product?: Product
  productId?: string
  returnTo?: string
}

function isUploadThingImage(image: string) {
  try {
    const url = new URL(image)
    return url.protocol === "https:" && url.hostname === "utfs.io"
  } catch {
    return false
  }
}

function isNeonStorageImage(image: string) {
  try {
    const url = new URL(image)
    return (
      url.protocol === "https:" &&
      url.hostname.includes(".storage.") &&
      url.hostname.endsWith(".aws.neon.tech")
    )
  } catch {
    return false
  }
}

function isSupportedImageReference(image: string) {
  return (
    image.startsWith("/images/") ||
    isUploadThingImage(image) ||
    isNeonStorageImage(image)
  )
}

export function ProductForm({
  type,
  imageUploadsEnabled,
  product,
  productId,
  returnTo = "/admin/products",
}: ProductFormProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")

  const form = useForm<InsertProduct | UpdateProduct>({
    resolver: zodResolver(
      type === "Update" ? updateProductSchema : insertProductSchema,
    ),
    defaultValues: type === "Update" ? product : productDefaultValues,
  })

  const onSubmit: SubmitHandler<InsertProduct> = async (values) => {
    // On Create
    if (type === "Create") {
      const res = await createProduct(values)

      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
      } else {
        toast.success(translateMessage(locale, res.message))
        router.push(returnTo)
      }
    }

    // On Update
    if (type === "Update") {
      if (!productId) {
        router.push(returnTo)
        return
      }

      const res = await updateProduct({ ...values, id: productId })

      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
      } else {
        toast.success(translateMessage(locale, res.message))
        router.push(returnTo)
      }
    }
  }

  const images = form.watch("images")
  const isFeatured = form.watch("isFeatured")
  const banner = form.watch("banner")

  const addImageUrl = () => {
    const nextImage = imageUrl.trim()
    if (!isSupportedImageReference(nextImage)) {
      toast.error(translate(locale, "Enter a valid image URL or /images/ path."))
      return
    }

    const currentImages = form.getValues("images")
    if (!currentImages.includes(nextImage)) {
      form.setValue("images", [...currentImages, nextImage], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    setImageUrl("")
  }

  const addBannerUrl = () => {
    const nextBanner = bannerUrl.trim()
    if (!isSupportedImageReference(nextBanner)) {
      toast.error(translate(locale, "Enter a valid image URL or /images/ path."))
      return
    }

    form.setValue("banner", nextBanner, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setBannerUrl("")
  }

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
  ) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { data } = await axios.post<{
        uploadUrl: string
        imageUrl: string
      }>("/api/storage/upload", {
        contentType: file.type,
        fileSize: file.size,
      })

      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      })
      onUploaded(data.imageUrl)
      toast.success(translate(locale, "Image uploaded successfully"))
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error instanceof Error
          ? error.message
          : translate(locale, "Failed to upload image")
      toast.error(message)
    } finally {
      setIsUploading(false)
      input.value = ""
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Name" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter product name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Slug" /></FormLabel>
                <FormControl>
                  <div className="relative flex items-center justify-center gap-2">
                    <Input placeholder={translate(locale, "Enter slug")} {...field} />
                    <Button
                      type="button"
                      onClick={() => {
                        form.setValue(
                          "slug",
                          slugify(form.getValues("name"), { lower: true }),
                        )
                      }}
                    >
                      <TranslatedText text="Generate" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Category" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter category")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Brand */}
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Brand" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter brand")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Price" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter product price")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Stock */}
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Stock" /></FormLabel>
                <FormControl>
                  <Input placeholder={translate(locale, "Enter stock")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="upload-field flex flex-col gap-5 md:flex-row">
          {/* Images */}
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Images" /></FormLabel>
                <Card>
                  <CardContent className="mt-2 min-h-48 space-y-2">
                    <div className="flex-start space-x-2">
                      {images.map((image: string) => (
                        <div
                          key={image}
                          className="relative h-40 w-40 rounded-sm border object-cover object-center"
                        >
                          <Button
                            type="button"
                            disabled={isPending || isUploading}
                            variant="destructive"
                            className="absolute top-0 left-0 size-7 cursor-pointer"
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  if (isNeonStorageImage(image)) {
                                    await axios.delete("/api/storage/upload", {
                                      data: { url: image },
                                    })
                                  }
                                  // Remove image from form state
                                  form.setValue(
                                    "images",
                                    images.filter((img) => img !== image),
                                  )
                                  toast.success(translate(locale, "Image removed successfully"))
                                } catch (error) {
                                  console.error(error)
                                  toast.error(translate(locale, "Failed to remove image"))
                                }
                              })
                            }}
                          >
                            <XIcon />
                          </Button>
                          <Image
                            src={image}
                            alt="product image"
                            width={200}
                            height={200}
                          />
                        </div>
                      ))}
                      {imageUploadsEnabled && (
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                            disabled={isUploading}
                            aria-label={translate(locale, "Upload product image")}
                            onChange={(event) =>
                              void handleImageUpload(event, (uploadedImage) =>
                                form.setValue("images", [
                                  ...form.getValues("images"),
                                  uploadedImage,
                                ]),
                              )
                            }
                          />
                        </FormControl>
                      )}
                    </div>
                    <div className="flex w-full gap-2">
                      <Input
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        placeholder={translate(
                          locale,
                          "Image URL or /images/ path",
                        )}
                        aria-label={translate(locale, "Image URL")}
                      />
                      <Button type="button" onClick={addImageUrl}>
                        <TranslatedText text="Add image" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <TranslatedText text="Use a public HTTPS image from Neon Storage or utfs.io, or a path under /images/." />
                    </p>
                    {!imageUploadsEnabled && (
                      <p className="text-sm text-muted-foreground">
                        <TranslatedText text="Direct uploads are disabled. Configure Neon S3 storage to upload files." />
                      </p>
                    )}
                  </CardContent>
                </Card>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="upload-field">
          {/* isFeatured */}
          <TranslatedText text="Featured Product" />
          <Card>
            <CardContent className="mt-2 space-y-2">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel><TranslatedText text="Is Featured?" /></FormLabel>
                  </FormItem>
                )}
              />

              {isFeatured && banner && (
                <div className="relative w-full rounded-sm">
                  <Button
                    type="button"
                    disabled={isPending || isUploading}
                    variant="destructive"
                    className="absolute top-0 left-0 size-7 cursor-pointer"
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          if (isNeonStorageImage(banner)) {
                            await axios.delete("/api/storage/upload", {
                              data: { url: banner },
                            })
                          }
                          // Remove image from form state
                          form.setValue("banner", "")
                          toast.success(translate(locale, "Image removed successfully"))
                        } catch (error) {
                          console.error(error)
                          toast.error(translate(locale, "Failed to remove image"))
                        }
                      })
                    }}
                  >
                    <XIcon />
                  </Button>
                  <Image
                    src={banner}
                    alt="banner image"
                    className="w-full rounded-sm object-cover object-center"
                    width={1920}
                    height={680}
                  />
                </div>
              )}

              {isFeatured && !banner && (
                <div className="space-y-2">
                  {imageUploadsEnabled && (
                    <Input
                      type="file"
                      accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                      disabled={isUploading}
                      aria-label={translate(locale, "Upload banner image")}
                      onChange={(event) =>
                        void handleImageUpload(event, (uploadedBanner) =>
                          form.setValue("banner", uploadedBanner),
                        )
                      }
                    />
                  )}
                  <div className="flex w-full gap-2">
                    <Input
                      value={bannerUrl}
                      onChange={(event) => setBannerUrl(event.target.value)}
                      placeholder={translate(
                        locale,
                        "Image URL or /images/ path",
                      )}
                      aria-label={translate(locale, "Image URL")}
                    />
                    <Button type="button" onClick={addBannerUrl}>
                      <TranslatedText text="Add banner" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel><TranslatedText text="Description" /></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={translate(locale, "Enter product description")}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting || isUploading}
            className="button col-span-2 w-full"
          >
            {form.formState.isSubmitting
              ? translate(locale, "Submitting...")
              : translate(locale, `${type} Product`)}
          </Button>
        </div>
      </form>
    </Form>
  )
}
