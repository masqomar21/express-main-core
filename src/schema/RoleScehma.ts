import z from 'zod'

export const RoleSchema =z.object({
  name : z.string().min(3, 'Role name must be at least 3 characters long'),
  permissions : z.array(
    z.object({
      id : z.number().nullable().optional(),
      permissionId : z.number().int('Permission ID must be an integer'),
      canRead: z.boolean().default(false),
      canWrite: z.boolean().default(false),
      canRestore: z.boolean().default(false),
      canUpdate: z.boolean().default(false),
      canDelete: z.boolean().default(false),
    }),
  ),
})