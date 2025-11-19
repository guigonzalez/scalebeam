import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting existing templates...')

  const result = await prisma.template.deleteMany({})

  console.log(`✅ Deleted ${result.count} templates`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
