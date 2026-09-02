import { Socket } from 'socket.io'
import db from '../config/database'
import { getIO } from '../config/socket'
import logger from '@/utilities/Log'
import { webpush } from '@/config/webPush'
import { CONFIG } from '@/config'
import axios from 'axios'

export const NotificationSets = new Set(['messageFormDeveloper', 'user', 'admin', 'other'] as const)

export type NotificationKind = typeof NotificationSets extends Set<infer T> ? T : never

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
  const users = await db.orm.public.User.include('webPushSubscriptions')
    .include('mobilPushSubscriptions')
    .where((u) => u.id.in(userIds))
    .all()

  const web = users.flatMap((u: any) => u.webPushSubscriptions as { endpoint: string; p256dh: string; auth: string }[])
  const mobileTokens = users.flatMap((u: any) => u.mobilPushSubscriptions.map((m: any) => String(m.token)))
  return { web, mobileTokens }
}

/**
 * Send a push notification to a specific subscription
 * @param sub The web push subscription
 * @param payload The notification payload
 * @returns A promise that resolves to a boolean indicating success or failure
 */
async function sendPushToSubscription(
  sub: {
    endpoint: string
    p256dh: string
    auth: string
  },
  payload: any,
  config:
    | { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }
    | undefined = undefined,
): Promise<boolean> {
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }
  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: config?.TTL || 60, // detik
      urgency: config?.urgency || 'normal', // 'very-low'|'low'|'normal'|'high'
    })
    return true
  } catch (err: any) {
    // 404/410 biasanya subscription sudah invalid → hapus
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await db.orm.public.WebPushSubscription.where({ endpoint: sub.endpoint })
        .delete()
        .catch(() => null)
    }
    logger.error('Failed to send push notification', err)
    return false
  }
}

/**
 * Send mobile push notification via Expo
 * @param token Array of Expo push tokens
 * @param title Notification title
 * @param payload Notification body
 * @returns A promise that resolves to a boolean indicating success or failure
 */
async function sendMobilePushNotif(token: string[], title: string, payload: any): Promise<boolean> {
  if (token.length === 0) return false
  const expoNotifUrl = 'https://exp.host/--/api/v2/push/send'
  try {
    const res = await axios.post(
      expoNotifUrl,
      {
        to: token.map((t) => `ExponentPushToken[${t}]`),
        title,
        body: payload,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    console.log('Mobile push notification sent:', res.data)
    return true
  } catch (error) {
    logger.error('Failed to send mobile push notification', error)
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
  joinRoom: (socket: Socket, userId: number) => {
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
    config:
      | { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high' }
      | undefined = undefined,
  ) => {
    // Jalankan pengiriman notifikasi secara asynchronous/background task agar tidak menghambat siklus request utama.
    ;(async () => {
      const io = getIO()
      if (!io) {
        console.error('Socket.io is not initialized!')
        return
      }

      try {
        const notif = await db.orm.public.Notification.create({
          _type: data.type,
          refId: data.refId ? String(data.refId) : null,
          message: data.message,
        })

        await Promise.all(
          targetUserIds.map((uid) =>
            db.orm.public.NotificationUser.create({
              userId: uid,
              notificationId: notif.id,
              deliveredAt: new Date(),
              readStatus: false,
            }),
          ),
        )

        // Emit ke setiap room user
        targetUserIds.forEach((uid) => {
          io.to(`user-${uid}`).emit('receive_notification', {
            id: notif.id,
            type: notif._type,
            message: notif.message,
            refId: notif.refId,
            createdAt: notif.createdAt,
          })
        })

        if (CONFIG.pushNotif) {
          const { web, mobileTokens } = await getSubscriptionsByUserIds(targetUserIds)
          const payload = {
            id: notif.id,
            title: data.title || `${notificationKindText[notif._type as NotificationKind]}`,
            body: notif.message,
            data: {
              refId: notif.refId,
              type: notif._type,
              createdAt: notif.createdAt,
            },
          }
          await Promise.all(web.map((s) => sendPushToSubscription(s, payload, config)))
          await sendMobilePushNotif(mobileTokens, payload.title, payload)
        }
      } catch (error) {
        logger.error('Failed to send notification asynchronously:', error)
      }
    })()
  },

  // === Tandai satu notif sebagai sudah dibaca ===
  readNotification: async (userId: number, notificationId: number) => {
    try {
      return await db.orm.public.NotificationUser.where({
        userId,
        notificationId,
      }).update({ readStatus: true, readAt: new Date() })
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to read notification')
    }
  },

  // === Tandai semua notif user sebagai dibaca ===
  readAllNotifications: async (userId: number) => {
    try {
      await db.orm.public.NotificationUser.where({
        userId,
        readStatus: false,
      }).update({ readStatus: true, readAt: new Date() })
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

      const baseFilter: { userId: number; readStatus?: boolean } = { userId }
      if (typeof whereCondition?.readStatus === 'boolean') {
        baseFilter.readStatus = whereCondition.readStatus
      }

      const [rows, total] = await Promise.all([
        db.orm.public.NotificationUser.include('notification')
          .where(baseFilter)
          .orderBy((nu) => nu.id.desc())
          .offset(skip)
          .limit(size)
          .all(),
        db.orm.public.NotificationUser.where(baseFilter).count(),
      ])

      // filter isi notification
      const filtered = rows.filter((r: any) => {
        const notif = r.notification
        if (!notif) return false
        if (whereCondition?.type && notif._type !== whereCondition.type) return false
        if (
          whereCondition?.search &&
          typeof notif.message === 'string' &&
          !notif.message.toLowerCase().includes(whereCondition.search.toLowerCase())
        )
          return false
        if (whereCondition?.since && notif.createdAt && new Date(notif.createdAt) < whereCondition.since) return false
        return true
      })

      return {
        total: Number(total),
        count: filtered.length,
        limit: size,
        offset: skip,
        data: filtered.map((r: any) => ({
          id: r.notification.id,
          type: r.notification._type,
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
      await db.orm.public.NotificationUser.where({ userId }).delete()
      return { ok: true }
    } catch (error) {
      logger.error(error)
      throw new Error('Failed to delete all notifications')
    }
  },
}

export default NotificationServices
