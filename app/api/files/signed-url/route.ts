import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getSignedUrl } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const { bucket, path, expiresIn } = await request.json()

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Bucket and path are required" },
        { status: 400 }
      )
    }

    const signedUrl = await getSignedUrl(bucket, path, expiresIn || 3600)

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: expiresIn || 3600,
    })
  } catch (error: any) {
    console.error("Signed URL error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate signed URL" },
      { status: 500 }
    )
  }
}
