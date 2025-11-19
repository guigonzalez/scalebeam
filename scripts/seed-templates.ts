import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templateData = [
  {
    name: 'Feed Minimalista',
    description: 'Template clean e moderno para posts de feed',
    imageUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=400&fit=crop',
    category: 'feed',
    isActive: true,
  },
  {
    name: 'Stories Dinâmico',
    description: 'Template animado para Instagram Stories',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=711&fit=crop',
    category: 'stories',
    isActive: true,
  },
  {
    name: 'Banner E-commerce',
    description: 'Banner responsivo para sites de e-commerce',
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=125&fit=crop',
    category: 'banner',
    isActive: true,
  },
  {
    name: 'Carrossel Produtos',
    description: 'Template de carrossel para múltiplos produtos',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
    category: 'carrossel',
    isActive: true,
  },
  {
    name: 'Video Ads',
    description: 'Template para anúncios em vídeo',
    imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=400&fit=crop',
    category: 'video',
    isActive: true,
  },
  {
    name: 'Display Ads',
    description: 'Template para anúncios display (300x250, 728x90, etc)',
    imageUrl: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=400&h=200&fit=crop',
    category: 'display',
    isActive: true,
  },
]

async function main() {
  console.log('🔄 Creating templates...')

  // Get all brands
  const brands = await prisma.brand.findMany()

  if (brands.length === 0) {
    console.log('⚠️  No brands found. Please run the main seed script first.')
    return
  }

  console.log(`📦 Found ${brands.length} brands`)

  // Create templates for each brand
  for (const brand of brands) {
    console.log(`  Creating templates for brand: ${brand.name}`)

    const templatesWithBrandId = templateData.map(template => ({
      ...template,
      brandId: brand.id,
    }))

    await prisma.template.createMany({
      data: templatesWithBrandId,
      skipDuplicates: true,
    })
  }

  const totalTemplates = await prisma.template.count()
  console.log(`✅ Created templates (Total: ${totalTemplates})`)
  console.log('🎉 Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
