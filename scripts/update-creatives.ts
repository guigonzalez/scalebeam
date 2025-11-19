import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating creatives with lista and modelo...')

  const creatives = await prisma.creative.findMany()

  const listas = ['Eletrônicos', 'Moda', 'Casa', 'Alimentos', 'Esportes']
  const modelos = ['Modelo A', 'Modelo B', 'Modelo C', 'Modelo D']

  for (const creative of creatives) {
    const randomLista = listas[Math.floor(Math.random() * listas.length)]
    const randomModelo = modelos[Math.floor(Math.random() * modelos.length)]

    await prisma.creative.update({
      where: { id: creative.id },
      data: {
        lista: randomLista,
        modelo: randomModelo,
      },
    })
  }

  console.log(`✅ Updated ${creatives.length} creatives`)
  console.log('🎉 Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
