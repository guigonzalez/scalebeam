import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    if (!brandId) {
      return NextResponse.json({ error: "brandId parameter is required" }, { status: 400 })
    }

    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        brandId: brandId,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}
