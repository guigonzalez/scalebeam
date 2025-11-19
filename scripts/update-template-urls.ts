import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Atualizando URLs dos templates...')

  const updates = [
    {
      oldUrl: '/templates/mercado-livre/#13960_MELI_PeakSeason_Araçariguama_auxiliarStories 1.png',
      newUrl: '/templates/mercado-livre/peak-season-stories.png'
    },
    {
      oldUrl: '/templates/mercado-livre/01_01 (2) 1.png',
      newUrl: '/templates/mercado-livre/feed-1x1.png'
    },
    {
      oldUrl: '/templates/mercado-livre/4_5.png',
      newUrl: '/templates/mercado-livre/formato-4x5.png'
    },
    {
      oldUrl: '/templates/mercado-livre/MELI_PeakSeason-InfoOutubro_FEED-Perus_v1 1.png',
      newUrl: '/templates/mercado-livre/peak-season-feed.png'
    },
    {
      oldUrl: '/templates/mercado-livre/Rectangle 3.png',
      newUrl: '/templates/mercado-livre/banner-retangular.png'
    },
    {
      oldUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.55 (3).png',
      newUrl: '/templates/mercado-livre/whatsapp-1.png'
    },
    {
      oldUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.56 (1).png',
      newUrl: '/templates/mercado-livre/whatsapp-2.png'
    },
    {
      oldUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.57.png',
      newUrl: '/templates/mercado-livre/whatsapp-3.png'
    },
  ]

  for (const update of updates) {
    await prisma.template.updateMany({
      where: { imageUrl: update.oldUrl },
      data: { imageUrl: update.newUrl }
    })
    console.log(`✅ Atualizado: ${update.oldUrl} -> ${update.newUrl}`)
  }

  console.log('🎉 Todos os templates foram atualizados!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
