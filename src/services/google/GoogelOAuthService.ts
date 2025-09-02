import { CONFIG } from '@/config'
import prisma from '@/config/database'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'


passport.use(
  new GoogleStrategy(
    {
      clientID: CONFIG.google.GoogleOAuthConfig.clientID,
      clientSecret: CONFIG.google.GoogleOAuthConfig.clientSecret,
      callbackURL: CONFIG.google.GoogleOAuthConfig.callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(null, false)

        // console.log('Google OAuth profile:', profile)

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          return done(null, false, { message: 'User belum terdaftar. Silahkan Daftar' })
        }

        return done(null, user) // return full user
      } catch (err) {
        return done(err)
      }
    },
  ),
)
