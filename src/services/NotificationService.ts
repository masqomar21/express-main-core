import { Socket } from 'socket.io'
import prisma from '../config/database'
import { getIO } from '../config/socket'
import logger from '@/utilities/Log'
import { webpush } from '@/config/webPush'
import { CONFIG } from '@/config'

export type NotificationKind =
  | 'user'
  | 'admin'
  | 'other'
  | 'messageFormDeveloper'
  // adjust as needed


const notificationKindText: Record<NotificationKind, string> = {
  user: 'User Notification',
  admin: 'Admin Notification',
  other: 'General Notification',
  messageFormDeveloper: 'Form Pesan dari Pengembang',
}

/**
 * Get all web push subscriptions for a list of user IDs
 * @param userIds Array of user IDs
 * @returns Array of web push subscriptions
 */
async function getSubscriptionsByUserIds(userIds: number[]) {
  return prisma.webPushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, endpoint: true, p256dh: true, auth: true, userId: true },
  })
}

/**
 * Send a push notification to a specific subscription
 * @param sub The web push subscription
 * @param payload The notification payload
 * @returns A promise that resolves to a boolean indicating success or failure
 */
async function sendPushToSubscription(sub: {
  endpoint: string; p256dh: string; auth: string;
}, payload: any, config: { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }| undefined = undefined): Promise<boolean> {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }
  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: config?.TTL || 60,          // detik
      urgency: config?.urgency || 'normal', // 'very-low'|'low'|'normal'|'high'
    })
    return true
  } catch (err: any) {
    // 404/410 biasanya subscription sudah invalid → hapus
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await prisma.webPushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => null)
    }
    logger.error('Failed to send push notification', err)
    return false
  }
}


const NotificationServices = {
  /**
   * Join a user to their personal socket room
   * @param socket The socket instance
   * @param userId The ID of the user
   * @returns The name of the room joined
   */
  joinRoom:(socket: Socket, userId: number) => {
    // Room personal per user
    const roomName = `user-${userId}`
    socket.join(roomName)
    console.log(`📥 User ${userId} joined room ${roomName}`)

    return roomName
  },

  /**
   * Send a notification to a list of users
   * @param targetUserIds The IDs of the target users
   * @param data The notification data
   * @returns The created notification
   */
  sendNotification: async (
    targetUserIds: number[],
    data: {
      message: string
      type: NotificationKind
      refId?: string | number
      title?: string
    },
    config: { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }| undefined = undefined,
  ) => {
    const io = getIO()
    if (!io) {
      console.error('Socket.io is not initialized!')
      return
    }

    try {
      const notif = await prisma.notification.create({
        data: {
          type: data.type,
          refId: data.refId ? String(data.refId) : null,
          message: data.message,
          recipients: {
            createMany: {
              data: targetUserIds.map((uid) => ({
                userId: uid,
                deliveredAt: new Date(),
              })),
              skipDuplicates: true,
            },
          },
        },
        select: { id: true, type: true, message: true, refId: true, createdAt: true },
      })

      // Emit ke setiap room user
      targetUserIds.forEach((uid) => {
        io.to(`user-${uid}`).emit('receive_notification', {
          id: notif.id,
          type: notif.type,
          message: notif.message,
          refId: notif.refId,
          createdAt: notif.createdAt,
        })
      })

      if (CONFIG.pushNotif) {
        const subs = await getSubscriptionsByUserIds(targetUserIds)
        const payload = {
          id: notif.id,
          title: data.title || `${notificationKindText[notif.type as NotificationKind]}`,
          body: notif.message,
          data: {
            refId: notif.refId,
            type: notif.type,
            createdAt: notif.createdAt,
          },
          // icon, badge bisa ditambah di SW
        }
        await Promise.all(subs.map((s) => sendPushToSubscription(s, payload, config )))
      }

      // Paralel & cleanup invalid sub

      return notif
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to send notification')
    }
  },

  // === Tandai satu notif sebagai sudah dibaca ===
  readNotification: async (userId: number, notificationId: number) => {
    try {
      return await prisma.notificationUser.update({
        where: { userId_notificationId: { userId, notificationId } },
        data: { readStatus: true, readAt: new Date() },
      })
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to read notification')
    }
  },

  // === Tandai semua notif user sebagai dibaca ===
  readAllNotifications: async (userId: number) => {
    try {
      await prisma.notificationUser.updateMany({
        where: { userId, readStatus: false },
        data: { readStatus: true, readAt: new Date() },
      })
      return { ok: true }
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to mark all notifications as read')
    }
  },

  // === Ambil daftar notif untuk user ===
  getNotifications: async (
    userId: number,
    option?: { limit?: number; offset?: number },
    whereCondition?: {
      readStatus?: boolean
      type?: NotificationKind
      search?: string
      since?: Date
    },
  ) => {
    try {
      const size = option?.limit ?? 10
      const skip = option?.offset ?? 0

      const whereReceipt: any = { userId }
      if (typeof whereCondition?.readStatus === 'boolean') {
        whereReceipt.readStatus = whereCondition.readStatus
      }

      const [rows, total] = await prisma.$transaction([
        prisma.notificationUser.findMany({
          where: whereReceipt,
          orderBy: { id: 'desc' },
          skip,
          take: size,
          include: {
            notification: {
              select: {
                id: true,
                type: true,
                message: true,
                refId: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.notificationUser.count({ where: whereReceipt }),
      ])

      // filter isi notification
      const filtered = rows.filter((r) => {
        const notif = r.notification
        if (!notif) return false
        if (whereCondition?.type && notif.type !== whereCondition.type) return false
        if (whereCondition?.search && !notif.message.toLowerCase().includes(whereCondition.search.toLowerCase())) return false
        if (whereCondition?.since && notif.createdAt < whereCondition.since) return false
        return true
      })

      return {
        total,
        count: filtered.length,
        limit: size,
        offset: skip,
        data: filtered.map((r) => ({
          id: r.notification.id,
          type: r.notification.type,
          message: r.notification.message,
          refId: r.notification.refId,
          createdAt: r.notification.createdAt,
          readStatus: r.readStatus,
          readAt: r.readAt,
          deliveredAt: r.deliveredAt,
        })),
      }
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to fetch notifications')
    }
  },

  deleteAllNotifications: async (userId: number) => {
    try {
      await prisma.notificationUser.deleteMany({
        where: { userId },
      })
      return { ok: true }
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to delete all notifications')
    }
  },
}

export default NotificationServices
