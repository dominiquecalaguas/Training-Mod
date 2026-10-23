
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_ORIGIN = "https://dominiquecalaguas.framer.website"

const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    })
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params

    try {
        // Reuse the existing portfolio endpoint
        const origin = new URL(request.url).origin

        const response = await fetch(
            `${origin}/api/portfolio/projects`,
            { cache: "no-store" }
        )

        if (!response.ok) {
            throw new Error(
                `Portfolio API returned ${response.status}`
            )
        }

        const data = await response.json()

        const project = data.projects?.find(
            (item: { slug: string }) => item.slug === slug
        )

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                {
                    status: 404,
                    headers: corsHeaders,
                }
            )
        }

        return NextResponse.json(
            { project },
            {
                headers: {
                    ...corsHeaders,
                    "Cache-Control": "no-store",
                },
            }
        )
    } catch (error) {
        console.error("Project API error:", error)

        return NextResponse.json(
            { error: "Unable to load project" },
            {
                status: 500,
                headers: corsHeaders,
            }
        )
    }
}
