import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Finding Mercado Livre brand...')

  const mercadoLivre = await prisma.brand.findFirst({
    where: { name: 'Mercado Livre' }
  })

  if (!mercadoLivre) {
    console.error('❌ Mercado Livre brand not found!')
    return
  }

  console.log(`✅ Found Mercado Livre brand: ${mercadoLivre.id}`)
  console.log('🔄 Creating templates for Mercado Livre...')

  await prisma.template.createMany({
    data: [
      {
        name: 'Peak Season Stories Auxiliar',
        description: 'Template de Stories para temporada de alta demanda',
        imageUrl: '/templates/mercado-livre/#13960_MELI_PeakSeason_Araçariguama_auxiliarStories 1.png',
        category: 'stories',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Campanha Feed 1:1',
        description: 'Template quadrado para posts de feed',
        imageUrl: '/templates/mercado-livre/01_01 (2) 1.png',
        category: 'feed',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Formato 4:5',
        description: 'Template vertical para Instagram Feed',
        imageUrl: '/templates/mercado-livre/4_5.png',
        category: 'feed',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Template de Produto 1',
        description: 'Layout de produto com destaque para ofertas',
        imageUrl: '/templates/mercado-livre/img1.png',
        category: 'produto',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Template de Produto 3',
        description: 'Layout alternativo de produto',
        imageUrl: '/templates/mercado-livre/img3.png',
        category: 'produto',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Template de Produto 7',
        description: 'Layout de produto com informações adicionais',
        imageUrl: '/templates/mercado-livre/img7.png',
        category: 'produto',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Peak Season Feed Info',
        description: 'Feed informativo para temporada de alta',
        imageUrl: '/templates/mercado-livre/MELI_PeakSeason-InfoOutubro_FEED-Perus_v1 1.png',
        category: 'feed',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Banner Retangular',
        description: 'Template de banner horizontal',
        imageUrl: '/templates/mercado-livre/Rectangle 3.png',
        category: 'banner',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Campanha WhatsApp 1',
        description: 'Template para divulgação via WhatsApp',
        imageUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.55 (3).png',
        category: 'whatsapp',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Campanha WhatsApp 2',
        description: 'Template alternativo para WhatsApp',
        imageUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.56 (1).png',
        category: 'whatsapp',
        isActive: true,
        brandId: mercadoLivre.id,
      },
      {
        name: 'Campanha WhatsApp 3',
        description: 'Template de promoção para WhatsApp',
        imageUrl: '/templates/mercado-livre/WhatsApp Image 2025-10-22 at 11.54.57.png',
        category: 'whatsapp',
        isActive: true,
        brandId: mercadoLivre.id,
      },
    ],
  })

  console.log('✅ Created 11 templates for Mercado Livre')
  console.log('🎉 Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
