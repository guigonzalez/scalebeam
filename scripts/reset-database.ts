import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Limpando banco de dados...')
  console.log('')

  // Delete in correct order (respecting foreign keys)
  console.log('  Deletando Comments...')
  await prisma.comment.deleteMany()

  console.log('  Deletando Creatives...')
  await prisma.creative.deleteMany()

  console.log('  Deletando Projects...')
  await prisma.project.deleteMany()

  console.log('  Deletando Templates...')
  await prisma.template.deleteMany()

  console.log('  Deletando Assets...')
  await prisma.asset.deleteMany()

  console.log('  Deletando Brands...')
  await prisma.brand.deleteMany()

  console.log('  Deletando Users...')
  await prisma.user.deleteMany()

  console.log('  Deletando Organizations...')
  await prisma.organization.deleteMany()

  console.log('  Deletando Activity Logs...')
  await prisma.activityLog.deleteMany()

  console.log('')
  console.log('✅ Banco de dados limpo!')
  console.log('')
}

main()
  .catch((error) => {
    console.error('❌ Erro ao limpar banco:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
