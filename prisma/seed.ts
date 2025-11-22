import { PrismaClient } from '@prisma/client'
import { readdirSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to generate creatives data from files
function generateNov25Creatives(projectId: string) {
  const creatives: any[] = []
  const basePath = join(process.cwd(), 'public', 'creatives', 'nov25')
  const locations = ['aracariguama', 'cajamar', 'extrema', 'perus']

  locations.forEach(location => {
    const locationPath = join(basePath, location)
    const files = readdirSync(locationPath).filter(f => f.endsWith('.jpg'))

    files.forEach(file => {
      // Parse format from filename (1_1, 4_5, 9_16)
      const formatMatch = file.match(/^(\d+_\d+)/)
      const formatRatio = formatMatch ? formatMatch[1] : '1_1'

      let width = 1080
      let height = 1080

      if (formatRatio === '4_5') {
        width = 1080
        height = 1350
      } else if (formatRatio === '9_16') {
        width = 1080
        height = 1920
      }

      creatives.push({
        name: file,
        url: `/creatives/nov25/${location}/${file}`,
        thumbnailUrl: `/creatives/nov25/${location}/${file}`,
        format: 'jpg',
        width,
        height,
        projectId,
      })
    })
  })

  return creatives
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clean database
  await prisma.comment.deleteMany()
  await prisma.creative.deleteMany()
  await prisma.project.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  const defaultPasswordHash = await bcrypt.hash('password123', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@uxer.com',
      name: 'Admin UXER',
      role: 'ADMIN',
      passwordHash: defaultPasswordHash,
    },
  })

  const client1 = await prisma.user.create({
    data: {
      email: 'joao@techstartup.com',
      name: 'João Silva',
      role: 'CLIENT',
      passwordHash: defaultPasswordHash,
    },
  })

  const client2 = await prisma.user.create({
    data: {
      email: 'maria@fashionbrand.com',
      name: 'Maria Santos',
      role: 'CLIENT',
      passwordHash: defaultPasswordHash,
    },
  })

  console.log('✅ Users created')

  // Create Organizations
  const org1 = await prisma.organization.create({
    data: {
      name: 'Tech Startup Inc',
      plan: 'STARTER',
      maxCreatives: 300,
      maxBrands: 1,
      users: {
        connect: [{ id: client1.id }],
      },
    },
  })

  const org2 = await prisma.organization.create({
    data: {
      name: 'Fashion Brand Co',
      plan: 'PROFESSIONAL',
      maxCreatives: 750,
      maxBrands: 3,
      users: {
        connect: [{ id: client2.id }],
      },
    },
  })

  const org3 = await prisma.organization.create({
    data: {
      name: 'Creative Agency Ltd',
      plan: 'AGENCY',
      maxCreatives: 2000,
      maxBrands: 10,
      users: {
        connect: [{ id: adminUser.id }],
      },
    },
  })

  console.log('✅ Organizations created')

  // Create Brands
  const brand1 = await prisma.brand.create({
    data: {
      name: 'Mercado Livre',
      logoUrl: '/brands/mercado-livre/ML-Color-Izquierda.png',
      brandBookUrl: '/brands/mercado-livre/PT-BR_BrandBook_MercadoLivre.pdf',
      toneOfVoice: 'Próximo, acessível e democrático. Facilitamos a vida das pessoas com tecnologia.',
      primaryColor: '#FFE600',
      secondaryColor: '#2D3277',
      organizationId: org1.id,
    },
  })

  const brand2 = await prisma.brand.create({
    data: {
      name: 'StyleHub',
      logoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200&h=200&fit=crop',
      brandBookUrl: 'https://example.com/brandbook-stylehub.pdf',
      toneOfVoice: 'Elegante, sofisticado e inspirador. Tom feminino e empoderador.',
      primaryColor: '#EC4899',
      secondaryColor: '#BE185D',
      organizationId: org2.id,
    },
  })

  const brand3 = await prisma.brand.create({
    data: {
      name: 'GreenLife',
      logoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&h=200&fit=crop',
      brandBookUrl: 'https://example.com/brandbook-greenlife.pdf',
      toneOfVoice: 'Natural, sustentável e consciente. Tom acolhedor e educativo.',
      primaryColor: '#10B981',
      secondaryColor: '#047857',
      organizationId: org2.id,
    },
  })

  const brand4 = await prisma.brand.create({
    data: {
      name: 'FitPro',
      logoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      toneOfVoice: 'Energético, motivador e direto. Foco em resultados.',
      primaryColor: '#F59E0B',
      secondaryColor: '#D97706',
      organizationId: org3.id,
    },
  })

  const brand5 = await prisma.brand.create({
    data: {
      name: 'Urban Eats',
      logoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
      toneOfVoice: 'Descontraído, saboroso e convidativo. Tom jovem e urbano.',
      primaryColor: '#EF4444',
      secondaryColor: '#DC2626',
      organizationId: org3.id,
    },
  })

  console.log('✅ Brands created')

  // Create Assets for brands
  await prisma.asset.createMany({
    data: [
      // Mercado Livre assets
      {
        name: 'Logo Colorido',
        url: '/brands/mercado-livre/ML-Color-Izquierda.png',
        type: 'image',
        size: 6309,
        brandId: brand1.id,
      },
      {
        name: 'Logo Outline Branco',
        url: '/brands/mercado-livre/ML-Outline-Esquerda-Filled-B.png',
        type: 'image',
        size: 3799,
        brandId: brand1.id,
      },
      {
        name: 'Logo Outline Preto',
        url: '/brands/mercado-livre/ML-Outline-Esquerda-Filled-P.png',
        type: 'image',
        size: 3797,
        brandId: brand1.id,
      },
      {
        name: 'Brandbook Mercado Livre',
        url: '/brands/mercado-livre/PT-BR_BrandBook_MercadoLivre.pdf',
        type: 'pdf',
        size: 26407930,
        brandId: brand1.id,
      },
      // StyleHub assets
      {
        name: 'Logo StyleHub',
        url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        type: 'image',
        size: 198000,
        brandId: brand2.id,
      },
      {
        name: 'Coleção Verão',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200',
        type: 'image',
        size: 892000,
        brandId: brand2.id,
      },
      {
        name: 'Lookbook',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200',
        type: 'image',
        size: 734000,
        brandId: brand2.id,
      },
      // GreenLife assets
      {
        name: 'Logo GreenLife',
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        type: 'image',
        size: 156000,
        brandId: brand3.id,
      },
      {
        name: 'Produtos Naturais',
        url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200',
        type: 'image',
        size: 445000,
        brandId: brand3.id,
      },
    ],
  })

  console.log('✅ Assets created')

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Black Friday Mercado Livre 2024',
      briefingUrl: 'https://example.com/briefing-blackfriday-ml.csv',
      briefingData: JSON.stringify([
        { categoria: 'Eletrônicos', desconto: 'Até 70% OFF', cta: 'Aproveitar', frete: 'Grátis' },
        { categoria: 'Moda', desconto: 'Até 60% OFF', cta: 'Ver Ofertas', frete: 'Grátis' },
        { categoria: 'Casa', desconto: 'Até 50% OFF', cta: 'Comprar', frete: 'Grátis' },
      ]),
      estimatedCreatives: 25,
      status: 'READY',
      brandId: brand1.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Meli+ Premium 2025',
      briefingUrl: 'https://example.com/briefing-meliplus.csv',
      briefingData: JSON.stringify([
        { beneficio: 'Frete Grátis', headline: 'Economize em todas as compras', cta: 'Assinar Agora' },
        { beneficio: 'Ofertas Exclusivas', headline: 'Acesso antecipado', cta: 'Saiba Mais' },
      ]),
      estimatedCreatives: 15,
      status: 'IN_PRODUCTION',
      brandId: brand1.id,
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Coleção Verão 2025',
      briefingUrl: 'https://example.com/briefing-verao.csv',
      briefingData: JSON.stringify([
        { product: 'Vestido Floral', headline: 'Frescor do Verão', cta: 'Comprar', price: 'R$ 299' },
        { product: 'Sandália Comfort', headline: 'Estilo e Conforto', cta: 'Ver Mais', price: 'R$ 179' },
        { product: 'Bolsa Verão', headline: 'Tendência 2025', cta: 'Comprar', price: 'R$ 399' },
      ]),
      estimatedCreatives: 40,
      status: 'APPROVED',
      brandId: brand2.id,
    },
  })

  const project4 = await prisma.project.create({
    data: {
      name: 'Dia das Mães - GreenLife',
      briefingUrl: 'https://example.com/briefing-maes.csv',
      estimatedCreatives: 20,
      status: 'READY',
      brandId: brand3.id,
    },
  })

  const project5 = await prisma.project.create({
    data: {
      name: 'Anúncios Instagram Stories - FitPro',
      estimatedCreatives: 30,
      status: 'DRAFT',
      brandId: brand4.id,
    },
  })

  const project6 = await prisma.project.create({
    data: {
      name: 'Menu Especial - Urban Eats',
      estimatedCreatives: 12,
      status: 'IN_PRODUCTION',
      brandId: brand5.id,
    },
  })

  const project7 = await prisma.project.create({
    data: {
      name: 'Retargeting Ads Q4',
      estimatedCreatives: 50,
      status: 'REVISION',
      brandId: brand2.id,
    },
  })

  const project8 = await prisma.project.create({
    data: {
      name: 'Campanha Novembro 2025',
      briefingUrl: 'https://example.com/briefing-nov25.csv',
      briefingData: JSON.stringify([
        { localidade: 'Aracariguama', formato: 'Multi', quantidade: '14 peças' },
        { localidade: 'Cajamar', formato: 'Multi', quantidade: '14 peças' },
        { localidade: 'Extrema', formato: 'Multi', quantidade: '14 peças' },
        { localidade: 'Perus', formato: 'Multi', quantidade: '14 peças' },
      ]),
      estimatedCreatives: 56,
      status: 'READY',
      brandId: brand1.id,
    },
  })

  console.log('✅ Projects created')

  // Create Creatives (only for approved/ready projects)
  await prisma.creative.createMany({
    data: [
      // Project 1 - Black Friday TechFlow
      {
        name: 'BF_Feed_01.jpg',
        url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1080&h=1080&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1080,
        projectId: project1.id,
      },
      {
        name: 'BF_Stories_01.jpg',
        url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1080&h=1920&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=711&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1920,
        projectId: project1.id,
      },
      {
        name: 'BF_Feed_02.jpg',
        url: 'https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?w=1080&h=1080&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?w=400&h=400&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1080,
        projectId: project1.id,
      },
      {
        name: 'BF_Banner_Desktop.jpg',
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=600&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=125&fit=crop',
        format: 'jpg',
        width: 1920,
        height: 600,
        projectId: project1.id,
      },
      // Project 3 - Verão StyleHub
      {
        name: 'Verao_Vestido_Feed.jpg',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&h=1080&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1080,
        projectId: project3.id,
      },
      {
        name: 'Verao_Sandalia_Stories.jpg',
        url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1080&h=1920&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=711&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1920,
        projectId: project3.id,
      },
      {
        name: 'Verao_Bolsa_Feed.jpg',
        url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1080&h=1080&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1080,
        projectId: project3.id,
      },
      // Project 4 - GreenLife Dia das Mães
      {
        name: 'DiaMaes_Kit_01.jpg',
        url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1080&h=1080&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1080,
        projectId: project4.id,
      },
      {
        name: 'DiaMaes_Stories_01.jpg',
        url: 'https://images.unsplash.com/photo-1608181831042-e5a1f8a5954f?w=1080&h=1920&fit=crop',
        thumbnailUrl: 'https://images.unsplash.com/photo-1608181831042-e5a1f8a5954f?w=400&h=711&fit=crop',
        format: 'jpg',
        width: 1080,
        height: 1920,
        projectId: project4.id,
      },
      // Project 8 - Campanha Novembro 2025 (56 criativos reais)
      ...generateNov25Creatives(project8.id),
    ],
  })

  console.log('✅ Creatives created')

  // Create Comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Criativos aprovados! Podem subir na plataforma.',
        projectId: project3.id,
        userId: client2.id,
      },
      {
        content: 'Excelente trabalho! A identidade da marca está perfeita.',
        projectId: project1.id,
        userId: client1.id,
      },
      {
        content: 'Por favor, ajustar o contraste no criativo BF_Stories_01. O texto está pouco legível.',
        projectId: project7.id,
        userId: client2.id,
      },
      {
        content: 'Ajustes realizados conforme solicitado. Favor revisar.',
        projectId: project7.id,
        userId: adminUser.id,
      },
    ],
  })

  console.log('✅ Comments created')
  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
