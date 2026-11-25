INSERT INTO "Permission" ("id", "key", "description")
VALUES (gen_random_uuid(), 'coupons.manage', 'Create and manage customer coupons')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."key" IN ('admin', 'super_admin')
  AND permission."key" = 'coupons.manage'
ON CONFLICT DO NOTHING;
