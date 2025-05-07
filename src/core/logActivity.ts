import { prisma } from '../config/database'


export const logActivity = async (
  userId: number,
  process: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'restore',
  detail: string,
) => {
  await prisma.loger.create({
    data: {
      userId,
      process,
      detail,
    },
  })
}