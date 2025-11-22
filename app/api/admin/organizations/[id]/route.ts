import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name,
        plan: body.plan,
        maxCreatives: body.maxCreatives,
        maxBrands: body.maxBrands,
        paymentStatus: body.paymentStatus,
      },
    })

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error("Error updating organization:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, session } = await requireAuth()
  if (authError) return authError

  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await params

    await prisma.organization.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting organization:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    )
  }
}
