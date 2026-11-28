import type { AppRole } from "@/lib/auth-guard"

export const ROLE_RANK: Record<AppRole, number> = {
  customer: 1,
  seller: 2,
  admin: 3,
  super_admin: 4,
}

export const PERMISSION_MATRIX: Record<
  AppRole,
  ReadonlySet<string>
> = {
  customer: new Set([
    "order.place.own",
    "order.cancel.own",
    "review.create",
    "wishlist.view.own",
    "wishlist.remove.own",
  ]),
  seller: new Set([
    "product.create",
    "product.update.own",
    "product.delete.own",
    "product.history.view.own",
    "seller.products.manage",
    "seller.orders.view",
    "order.process.own",
  ]),
  admin: new Set([
    "dashboard.view",
    "products.manage",
    "product.create",
    "product.update.any",
    "product.delete",
    "product.history.view.latest",
    "orders.manage",
    "coupons.manage",
    "users.view",
    "users.manage",
    "user.status.view",
    "user.status.change",
    "user.activity.view",
    "user.loginhistory.view",
    "user.role.change",
    "user.delete",
    "sellerApplications.manage",
  ]),
  super_admin: new Set([
    "dashboard.view",
    "products.manage",
    "product.create",
    "product.update.any",
    "product.delete",
    "product.restore",
    "product.permanent",
    "product.ownership.change",
    "product.history.view",
    "orders.manage",
    "coupons.manage",
    "users.view",
    "users.manage",
    "user.status.view",
    "user.status.change",
    "user.activity.view",
    "user.loginhistory.view",
    "user.role.change",
    "user.role.admin",
    "user.delete",
    "user.restore",
    "user.permanent",
    "sellerApplications.manage",
    "wishlist.delete.any",
    "deleted.view",
    "deleted.restore",
    "deleted.status.change",
    "deleted.permanent",
    "audit.view",
    "settings.manage",
  ]),
}

export function roleHasPermission(role: AppRole, key: string): boolean {
  if (role === "super_admin") return true
  return PERMISSION_MATRIX[role]?.has(key) ?? false
}

export function canAssignRole(actor: AppRole, target: AppRole): boolean {
  if (actor === "super_admin") return true
  if (actor === "admin") {
    return target === "customer" || target === "seller"
  }
  return false
}

export function canManageUser(actor: AppRole, target: AppRole): boolean {
  if (actor === "super_admin") return true
  if (actor === "admin") {
    return target === "customer" || target === "seller"
  }
  return false
}