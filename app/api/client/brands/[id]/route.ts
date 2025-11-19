import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        assets: {
          orderBy: { createdAt: "desc" },
        },
        templates: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        projects: {
          include: {
            _count: {
              select: { creatives: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error("Error fetching brand:", error)
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 })
  }
}
