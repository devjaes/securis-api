import { Prisma, PrismaClient } from 'src/core/database/generated/client'
import { hashPassword } from 'src/shared/utils/encrypter'

const mainUser = (): Prisma.UserCreateInput => ({
  email: 'pvillacres6317@uta.edu.ec',
  passwordHash: hashPassword('123456'),
  name: 'Pablo Villacres',
})

export const createUser1 = (prisma: PrismaClient) => {
  const mainUserData = mainUser()
  return prisma.user.upsert({
    create: mainUserData,
    update: mainUserData,
    where: {
      email: mainUserData.email,
    },
  })
}
