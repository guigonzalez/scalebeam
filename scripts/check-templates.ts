import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      brandId: true,
    }
  })

  console.log('📋 Templates no banco:')
  templates.forEach(t => {
    console.log(`  - ${t.name}`)
    console.log(`    imageUrl: ${t.imageUrl}`)
    console.log(`    brandId: ${t.brandId}`)
    console.log('')
  })

  console.log(`Total: ${templates.length} templates`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
