import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Populando banco de dados com dados de teste...')
  console.log('')

  // 1. Create Organization
  console.log('📦 Criando Organization...')
  const org = await prisma.organization.create({
    data: {
      name: 'ScaleBeam Demo',
      plan: 'PROFESSIONAL',
      maxCreatives: 500,
      maxBrands: 5,
    },
  })
  console.log(`  ✓ Organization: ${org.name}`)
  console.log('')

  // 2. Create Users
  console.log('👥 Criando Users...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@scalebeam.com',
      name: 'Admin User',
      role: 'ADMIN',
      organizations: {
        connect: { id: org.id }
      }
    },
  })
  console.log(`  ✓ Admin: ${adminUser.email}`)

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@scalebeam.com',
      name: 'Cliente Demo',
      role: 'CLIENT',
      organizations: {
        connect: { id: org.id }
      }
    },
  })
  console.log(`  ✓ Client: ${clientUser.email}`)
  console.log('')

  // 3. Create Brands
  console.log('🏷️  Criando Brands...')
  const nikeBrand = await prisma.brand.create({
    data: {
      name: 'Nike Brasil',
      organizationId: org.id,
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    },
  })
  console.log(`  ✓ Brand: ${nikeBrand.name}`)

  const adidasBrand = await prisma.brand.create({
    data: {
      name: 'Adidas Brasil',
      organizationId: org.id,
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      logoUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop',
    },
  })
  console.log(`  ✓ Brand: ${adidasBrand.name}`)
  console.log('')

  // 4. Create Assets for each brand
  console.log('🎨 Criando Assets...')

  // Nike Assets
  await prisma.asset.create({
    data: {
      name: 'Nike Logo',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      brandId: nikeBrand.id,
      size: 125000,
    },
  })

  await prisma.asset.create({
    data: {
      name: 'Nike Product 1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=600&fit=crop',
      brandId: nikeBrand.id,
      size: 250000,
    },
  })

  // Adidas Assets
  await prisma.asset.create({
    data: {
      name: 'Adidas Logo',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
      brandId: adidasBrand.id,
      size: 130000,
    },
  })

  await prisma.asset.create({
    data: {
      name: 'Adidas Product 1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=600&fit=crop',
      brandId: adidasBrand.id,
      size: 245000,
    },
  })

  console.log(`  ✓ ${4} Assets criados`)
  console.log('')

  // 5. Create Templates
  console.log('📄 Criando Templates...')

  const templateData = [
    {
      name: 'Feed Instagram',
      description: 'Template para posts de feed do Instagram (1080x1080)',
      imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop',
      category: 'feed',
    },
    {
      name: 'Stories Instagram',
      description: 'Template para Instagram Stories (1080x1920)',
      imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=711&fit=crop',
      category: 'stories',
    },
    {
      name: 'Banner Web',
      description: 'Banner para site e e-commerce (1920x600)',
      imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=250&fit=crop',
      category: 'banner',
    },
  ]

  // Create templates for Nike
  for (const template of templateData) {
    await prisma.template.create({
      data: {
        ...template,
        brandId: nikeBrand.id,
        isActive: true,
      },
    })
  }

  // Create templates for Adidas
  for (const template of templateData) {
    await prisma.template.create({
      data: {
        ...template,
        brandId: adidasBrand.id,
        isActive: true,
      },
    })
  }

  console.log(`  ✓ ${templateData.length * 2} Templates criados`)
  console.log('')

  // 6. Create Projects with different statuses
  console.log('📋 Criando Projects...')

  const feedTemplate = await prisma.template.findFirst({
    where: {
      brandId: nikeBrand.id,
      category: 'feed',
    },
  })

  const project1 = await prisma.project.create({
    data: {
      name: 'Campanha Lançamento Air Max 2024',
      status: 'IN_PRODUCTION',
      brandId: nikeBrand.id,
      templateId: feedTemplate!.id,
      estimatedCreatives: 10,
      totalCreatives: 3,
    },
  })
  console.log(`  ✓ Project: ${project1.name}`)

  const project2 = await prisma.project.create({
    data: {
      name: 'Black Friday 2024',
      status: 'DRAFT',
      brandId: adidasBrand.id,
      estimatedCreatives: 20,
    },
  })
  console.log(`  ✓ Project: ${project2.name}`)
  console.log('')

  // 7. Create Creatives for Project 1
  console.log('🎨 Criando Creatives...')

  const creative1 = await prisma.creative.create({
    data: {
      name: 'Air Max - Feed v1',
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&h=1080&fit=crop',
      format: 'jpg',
      width: 1080,
      height: 1080,
      lista: 'Lista 1',
      modelo: 'Feed Instagram',
      projectId: project1.id,
    },
  })
  console.log(`  ✓ Creative: ${creative1.name}`)

  const creative2 = await prisma.creative.create({
    data: {
      name: 'Air Max - Feed v2',
      url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1080&h=1080&fit=crop',
      format: 'jpg',
      width: 1080,
      height: 1080,
      lista: 'Lista 2',
      modelo: 'Feed Instagram',
      projectId: project1.id,
    },
  })
  console.log(`  ✓ Creative: ${creative2.name}`)

  const creative3 = await prisma.creative.create({
    data: {
      name: 'Air Max - Feed v3 (Final)',
      url: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=1080&h=1080&fit=crop',
      format: 'jpg',
      width: 1080,
      height: 1080,
      lista: 'Lista 3',
      modelo: 'Feed Instagram',
      projectId: project1.id,
    },
  })
  console.log(`  ✓ Creative: ${creative3.name}`)
  console.log('')

  // 8. Create Comments
  console.log('💬 Criando Comments...')

  await prisma.comment.create({
    data: {
      content: 'O logo da Nike precisa estar mais visível. Por favor ajuste.',
      projectId: project1.id,
      userId: clientUser.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Ajustado! Aumentei o logo e melhorei o contraste.',
      projectId: project1.id,
      userId: adminUser.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Perfeito! Aprovado para publicação.',
      projectId: project1.id,
      userId: clientUser.id,
    },
  })

  console.log(`  ✓ ${3} Comments criados`)
  console.log('')

  // 9. Create Activity Logs
  console.log('📊 Criando Activity Logs...')

  await prisma.activityLog.create({
    data: {
      action: 'created_project',
      description: `Projeto "${project1.name}" criado para ${nikeBrand.name}`,
      userId: clientUser.id,
      organizationId: org.id,
    },
  })

  await prisma.activityLog.create({
    data: {
      action: 'uploaded_creative',
      description: `3 criativos adicionados ao projeto "${project1.name}"`,
      userId: adminUser.id,
      organizationId: org.id,
    },
  })

  console.log(`  ✓ ${2} Activity Logs criados`)
  console.log('')

  // Summary
  console.log('✅ Banco de dados populado com sucesso!')
  console.log('')
  console.log('📊 Resumo:')
  console.log(`  • 1 Organization (${org.name})`)
  console.log(`  • 2 Users (Admin, Client)`)
  console.log(`  • 2 Brands (Nike, Adidas)`)
  console.log(`  • 4 Assets`)
  console.log(`  • 6 Templates (3 por brand)`)
  console.log(`  • 2 Projects`)
  console.log(`  • 3 Creatives`)
  console.log(`  • 3 Comments`)
  console.log(`  • 2 Activity Logs`)
  console.log('')
  console.log('🔐 Usuários de teste:')
  console.log('  Admin:  admin@scalebeam.com')
  console.log('  Client: client@scalebeam.com')
  console.log('')
  console.log('🚀 Próximos passos:')
  console.log('  1. Iniciar servidor: npm run dev')
  console.log('  2. Abrir Prisma Studio: npm run db:studio')
  console.log('  3. Acessar aplicação: http://localhost:3000')
  console.log('')
}

main()
  .catch((error) => {
    console.error('❌ Erro ao popular banco:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
