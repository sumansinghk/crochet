const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
try { require('dotenv').config() } catch (e) { /* dotenv optional */ }

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@crochet.local'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin user already exists:', email)
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email,
      hashedPassword: hashed,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Created admin user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
