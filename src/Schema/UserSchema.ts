import { z } from 'zod'

export const UserSchemaForCreate = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  roleId: z.number(),
})


export const UserSchemaForUpdate = z.object({
  name: z.string(),
  //   email: z.string().email(),
  roleId: z.number(),
})

