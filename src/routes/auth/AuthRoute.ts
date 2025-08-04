import { CONFIG } from '@/config'
import prisma from '@/config/database'
import AuthController from '@/controllers/auth/AuthController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { generateAccesToken } from '@/utilities/JwtHanldler'
import logger from '@/utilities/Log'
import { logActivity } from '@/utilities/LogActivity'
import { NextFunction, Request, Response, Router } from 'express'
import passport from 'passport'


export const AuthRoute = () : Router => {
  const router = Router()
  
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
  )

  router.get(
    '/google/callback',
    (req: Request, res: Response, next : NextFunction) => {
      passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
          console.error('Google Auth Error:', err)
          return res.redirect(`${CONFIG.client.callBackGoogleOAuth}?status=fail&msg=${encodeURIComponent('Terjadi kesalahan autentikasi.')}`)
        }
  
        if (!user) {
          const message = info?.message || 'User belum terdaftar.'
          console.warn('Google Auth Info:', message)
          return res.redirect(`${CONFIG.client.callBackGoogleOAuth}?status=fail&msg=${encodeURIComponent(message)}`)
        }
  
        try {
          const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              name: true,
              email: true,

              role: {
                select: { name: true,roleType : true },
              },
              // profileImage: true,
            },
          })
  
          if (!userData) {
            return res.redirect('/login?error=' + encodeURIComponent('User tidak ditemukan di sistem.'))
          }
  
          // const cekRoleType = (roleType: string) => userData.role.name === roleType
  
          const tokenPayload: jwtPayloadInterface = {
            id: userData.id,
            name: userData.name as string,
            role: userData.role.roleType as string,
          }
  
          const token = generateAccesToken(tokenPayload, CONFIG.secret.jwtSecret, 3600 * 24) // 1 day
  
          await prisma.session.create({
            data: {
              token,
              userId: userData.id,
            },
          })
  
          await logActivity(userData.id, 'LOGIN', 'User login via Google OAuth')
  
          // ✅ Redirect ke frontend atau kirim JSON
          return res.redirect(`${CONFIG.client.callBackGoogleOAuth}?status=success&msg=success&token=${token}`)
  
        } catch (error) {
          logger.error(error)
          return res.redirect(`${CONFIG.client.callBackGoogleOAuth}?status=fail&msg=${encodeURIComponent('Gagal memproses data pengguna.')}`)
        }
      })(req, res, next)
    },
  )
  

  router.post('/register', AuthController.register)
  router.post('/login', AuthController.login)
  router.delete('/logout',AuthMiddleware, AuthController.logout)

  return router
}