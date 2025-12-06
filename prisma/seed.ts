import { Logger } from '@nestjs/common'
import { PrismaClient } from 'src/core/database/generated/client'
import { createUser1 } from './data/users'

import 'dotenv/config'
import { PrismaMssql } from '@prisma/adapter-mssql'

const adapter = new PrismaMssql({
  user: process.env.DB_USER_ADMIN!,
  password: process.env.DB_PASSWORD_ADMIN!,
  database: process.env.DB_NAME!,
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT!, 10),
  options: {
    trustServerCertificate: true,
    encrypt: true,
  },
})
const prisma = new PrismaClient({ adapter })

const main = async () => {
  await createUser1(prisma)
  Logger.log('Seed data created successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    Logger.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
