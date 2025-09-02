import webpush from 'web-push'
import { CONFIG } from '.'

export function initWebPush() {
  webpush.setVapidDetails(
    CONFIG.vapid.subject,
    CONFIG.vapid.publicKey,
    CONFIG.vapid.privateKey,
  )
}

export { webpush }