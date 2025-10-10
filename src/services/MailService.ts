import nodemailer from 'nodemailer'
import { CONFIG } from '@/config'

export interface MailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

export default class MailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: CONFIG.smtp.host,
      port: parseInt(CONFIG.smtp.port || '587'),
      secure: CONFIG.smtp.host === 'smtp.gmail.com',
      auth: {
        user: CONFIG.smtp.email,
        pass: CONFIG.smtp.password,
      },
    })
  }

  async sendMail(options: MailOptions): Promise<void> {
    // console.log('Sending email to:', `"${CONFIG.appName} Team" <${CONFIG.smtp.sender}>`)
    try {
      const info = await this.transporter.sendMail({
        from: `"${CONFIG.appName} Team <${CONFIG.smtp.sender}>"`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })

      console.log(`✅ Email terkirim: ${info.messageId}`)
      const preview = nodemailer.getTestMessageUrl(info)
      if (preview) console.log(`🔗 Preview URL: ${preview}`)
    } catch (error: any) {
      console.error('❌ Gagal kirim email:', error.message)
    }
  }

  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify()
      console.log('✅ SMTP connection verified')
    } catch (error: any) {
      console.error('❌ SMTP connection failed:', error.message)
    }
  }
}
