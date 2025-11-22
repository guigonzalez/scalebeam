import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")
    const status = searchParams.get("status") // APPROVED, PENDING_APPROVAL, REJECTED

    if (!brandId) {
      return NextResponse.json({ error: "brandId parameter is required" }, { status: 400 })
    }

    const where: any = {
      isActive: true,
      brandId: brandId,
    }

    // Se status foi especificado, filtrar por ele
    // Se não foi especificado, retornar apenas APPROVED (comportamento padrão)
    if (status) {
      where.templateStatus = status
    } else {
      where.templateStatus = "APPROVED"
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}
