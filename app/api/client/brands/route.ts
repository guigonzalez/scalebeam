import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Filtrar marcas baseado no role
    const whereClause =
      session.user.role === "CLIENT"
        ? { organizationId: { in: session.user.organizationIds } }
        : {} // ADMIN vê todas

    const brands = await prisma.brand.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can create brands" }, { status: 403 })
    }

    const body = await request.json()
    const { name, organizationId, logoUrl, toneOfVoice } = body

    // Verify user belongs to this organization
    if (!session.user.organizationIds.includes(organizationId)) {
      return NextResponse.json(
        { error: "You don't have permission to create brands for this organization" },
        { status: 403 }
      )
    }

    // Check organization's brand limit
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { brands: true },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (organization._count.brands >= organization.maxBrands) {
      return NextResponse.json(
        {
          error: `Limite de marcas atingido. Seu plano permite até ${organization.maxBrands} marca(s).`,
        },
        { status: 400 }
      )
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name,
        organizationId,
        logoUrl: logoUrl || null,
        toneOfVoice: toneOfVoice || null,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "brand_created",
        description: `Marca "${name}" criada pelo cliente`,
        userId: session.user.id,
        organizationId,
      },
    })

    return NextResponse.json({ brand }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating brand:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 }
    )
  }
}
