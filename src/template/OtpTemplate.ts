import path from 'path'
import fs from 'fs'
import { CONFIG } from '@/config'

export function templateOtpHtml(data: { otp: string }): string {
  const pagePath = path.resolve(process.cwd(), './src/Template/HTML/otp.html')
  const template = fs.readFileSync(pagePath, 'utf8')

  console.log('TemplateHtml', data)

  return template
    .replace('{{OTP_CODE}}', data.otp)
    .replace('{{YEAR}}', new Date().getFullYear().toString())
    .replace('{{APP_NAME}}', CONFIG.appName || 'Newus')
}
