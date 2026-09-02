import db from '@/config/database'
import { hashPassword } from '../../../utilities/PasswordHandler'

export async function seedUser() {
  console.log('Seed data inserted user')

  const passwordHash = await hashPassword('password')

  const roles = await db.orm.public.Role.all()

  for (const role of roles) {
    const email = `${role.name.toLowerCase().replace(/ /g, '_')}@app.com`
    const existing = await db.orm.public.User.where({ email }).first()

    if (!existing) {
      await db.orm.public.User.create({
        password: passwordHash,
        name: role.name,
        email,
        roleId: role.id,
        registeredViaGoogle: false,
        updatedAt: new Date(),
      })
    }
  }
}
