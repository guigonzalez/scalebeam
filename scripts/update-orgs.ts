import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating organizations with payment data...')

  // Update organizations with payment data
  const orgs = await prisma.organization.findMany()

  const statuses = ['active', 'overdue', 'suspended', 'active', 'active']

  for (let i = 0; i < orgs.length && i < statuses.length; i++) {
    await prisma.organization.update({
      where: { id: orgs[i].id },
      data: {
        paymentStatus: statuses[i],
        lastPaymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log('✅ Organizations updated')
  console.log('🔄 Creating activity logs...')

  // Create activity logs
  const users = await prisma.user.findMany()
  const actions = [
    { action: 'created_project', description: 'Criou novo projeto "Campanha Black Friday"' },
    { action: 'uploaded_creative', description: 'Fez upload de 15 criativos' },
    { action: 'approved_project', description: 'Aprovou projeto "Coleção Verão"' },
    { action: 'created_brand', description: 'Criou nova marca' },
    { action: 'uploaded_assets', description: 'Fez upload de assets da marca' },
    { action: 'commented_project', description: 'Comentou no projeto' },
    { action: 'updated_project', description: 'Atualizou informações do projeto' },
    { action: 'downloaded_creative', description: 'Baixou criativos aprovados' },
  ]

  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      await prisma.activityLog.create({
        data: {
          ...action,
          userId: user.id,
          organizationId: orgs[Math.floor(Math.random() * orgs.length)].id,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  console.log('✅ Activity logs created')
  console.log('🎉 Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
