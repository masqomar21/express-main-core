import db from '@/config/database'

export type Process = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT'

/**
 * Log user activity in the database
 * @param userId - The ID of the user performing the action
 * @param process - The type of action being logged (e.g., 'login', 'logout', 'create', 'update', 'delete', 'restore')
 * @param detail - Additional details about the action
 */
export const logActivity = async (userId: number, process: Process, detail: string) => {
  await db.orm.public.Loger.create({
    userId,
    process,
    detail,
  })
}
