import { CONFIG } from '@/config'
import prisma from '@/config/database'
import MailService from '@/services/MailService'
import { templateOtpHtml } from '@/template/OtpTemplate'
import { generateAccesToken, verifyAccesToken } from '@/utilities/JwtHanldler'
import { generateOtp } from '@/utilities/Otp'
import { hashPassword } from '@/utilities/PasswordHandler'
import { ResponseData } from '@/utilities/Response'
import { validateInput } from '@/utilities/ValidateHandler'
import { Request, Response } from 'express'
import z from 'zod'

const ResetPasswordController = {
  async searchEmail(req: Request, res: Response) {
    const schema = z.object({
      email: z.string().email(),
    })

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }

    const reqBody = validateResult.data!

    try {
      const cekuser = await prisma.user.findUnique({
        where: {
          email: reqBody.email,
        },
      })

      if (!cekuser) {
        return ResponseData.notFound(res, 'Akun tidak ditemukan, silahkan melakukan pendaftaran')
      }

      await prisma.otp.deleteMany({
        where: {
          userId: cekuser.id,
        },
      })

      const otp = await generateOtp(6)

      const data = await prisma.otp.create({
        data: {
          userId: cekuser.id,
          code: otp,
          purpose: 'RESET_PASSWORD',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP berlaku 10 menit
        },
      })

      const mail = new MailService()
      const verifyConnection = await mail.verifyConnection()
      if (verifyConnection instanceof Error) {
        return ResponseData.serverError(res, verifyConnection)
      }

      const otpTemplate = templateOtpHtml({ otp: data.code })

      await mail.sendMail({
        to: cekuser.email,
        subject: 'Kode OTP untuk Reset Password',
        text: `Kode OTP Anda adalah: ${data.code}. Kode berlaku selama 10 menit.`,
        html: otpTemplate,
      })

      return ResponseData.ok(res, { message: 'Email found' })
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },

  async verifyOtp(req: Request, res: Response) {
    const schema = z.object({
      otp: z.string().length(6),
    })

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }

    const reqBody = validateResult.data!

    try {
      const cekOtp = await prisma.otp.findUnique({
        where: {
          code: reqBody.otp,
        },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!cekOtp) {
        return ResponseData.notFound(res, 'Kode OTP tidak valid')
      }

      if (cekOtp.expiresAt < new Date()) {
        return ResponseData.badRequest(res, 'Kode OTP sudah kadaluarsa')
      }

      // Hapus OTP setelah berhasil diverifikasi
      await prisma.otp.deleteMany({
        where: {
          userId: cekOtp.userId,
        },
      })

      const token = generateAccesToken(
        {
          id: cekOtp.user.id,
          name: cekOtp.user.name || '',
          roleType: cekOtp.user.role.roleType,
          purpose: 'RESET_PASSWORD',
        },
        CONFIG.secret.jwtSecret,
        15 * 60, // token berlaku 15 menit
      )

      return ResponseData.ok(res, { message: 'OTP verified', token }, 'OTP verified successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
  async resetPassword(req: Request, res: Response) {
    const { token } = req.query
    if (!token || typeof token !== 'string') {
      return ResponseData.unauthorized(res, 'Token is required')
    }
    const schema = z
      .object({
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(6),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Password confirmation does not match',
        path: ['confirmPassword'],
      })

    const validateResult = validateInput(schema, req.body)
    if (!validateResult.success) {
      return ResponseData.badRequest(res, undefined, validateResult.errors)
    }

    const reqBody = validateResult.data!

    try {
      const decode = verifyAccesToken(token, CONFIG.secret.jwtSecret)

      if (!decode || decode.purpose !== 'RESET_PASSWORD') {
        return ResponseData.unauthorized(res, 'Unauthorized - Invalid token')
      }

      const cekuser = await prisma.user.findUnique({
        where: {
          id: decode.id,
        },
      })

      if (!cekuser) {
        return ResponseData.notFound(res, 'User not found')
      }
      const hashedPassword = await hashPassword(reqBody.newPassword)

      await prisma.user.update({
        where: {
          id: cekuser.id,
        },
        data: {
          password: hashedPassword,
        },
      })

      return ResponseData.ok(res, {}, 'Password has been reset successfully')
    } catch (error) {
      return ResponseData.serverError(res, error)
    }
  },
}

export default ResetPasswordController
