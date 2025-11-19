import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
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
