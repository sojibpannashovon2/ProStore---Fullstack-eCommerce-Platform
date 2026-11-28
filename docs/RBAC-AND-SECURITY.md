# RBAC & Security

## Roles
`customer` (User), `seller`, `admin`, `super_admin`. Hierarchy rank: customer < seller < admin < super_admin.

## Permission enforcement
- Server-side via `lib/auth-guard.ts` (`requireRole`, `requirePermission`, `assertSuperAdmin`) and `lib/rbac.ts` (`roleHasPermission`, `canAssignRole`, `canManageUser`).
- Named permissions (examples): `product.create`, `product.update.own`, `product.update.any`, `product.delete`, `product.restore`, `product.permanent`, `product.ownership.change`, `product.history.view`, `user.status.change`, `user.role.change`, `user.role.admin`, `user.delete`, `user.restore`, `wishlist.delete.any`, `deleted.view`, `deleted.restore`, `deleted.permanent`, `audit.view`, `settings.manage`.

## Role-change rules
- Anyone can register as a User.
- User applies for Seller; Admin/SuperAdmin approves.
- Admin/SuperAdmin can change User ↔ Seller.
- Only SuperAdmin can create/promote/demote/remove Admins and SuperAdmins.
- A role can only assign roles below its own.
- Every role/status change writes `audit_logs` and invalidates sessions (`tokenVersion`).

## Account status & activity
- `status`: active / inactive / pending / blocked (Admin/SuperAdmin set; Admin only for users/sellers).
- Live presence: Online if `last_active_at` within 5 minutes (throttled update ≤1/min).
- Fields: `last_login_at`, `last_active_at`, `last_login_ip`, `last_login_location`, full `login_history`.
- Blocked/inactive users cannot log in; existing sessions invalidated via `tokenVersion` + status re-check in `getCurrentUser()`.

## Audit logging
`audit_logs` stores actor, actorRole, action (create/update/delete/restore/role_change/status_change/ownership_change/permanent_delete), targetType, targetId, oldValue, newValue, reason, IP, location, createdAt.

## Soft delete
- `is_deleted / deleted_at / deleted_by` on users, products, wishlist items.
- Default queries hide deleted; only SuperAdmin bypasses (Deleted Items page).
- Permanent delete is SuperAdmin-only with reason + confirmation.

## Wishlist privacy
- Only the owner can view/remove; SuperAdmin can delete; Admin/Seller cannot view. IDOR-safe.

## Threat protection
- bcrypt password hashing; no password in any response.
- IP blocking (`SecurityBlock`) enforced at sign-in.
- Brute-force: 5+ failed logins / 15 min → audit + SuperAdmin notification + email.
- Rate limits: sign-in 10/15 min, AI 20/min.
- Input validation (Zod) and IDOR checks on every mutation.

## Email alerts
Set `RESEND_API_KEY` (and optionally `SUPER_ADMIN_ALERT_EMAIL`, `ALERT_FROM_EMAIL`). Alerts go to SuperAdmin emails; without the key, alerts are recorded in-app only.