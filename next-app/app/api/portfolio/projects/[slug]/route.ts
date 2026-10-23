
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params

    try {
        // Reuse our existing, working portfolio endpoint.
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
                { status: 404 }
            )
        }

        return NextResponse.json(
            { project },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        )
    } catch (error) {
        console.error("Project API error:", error)

        return NextResponse.json(
            { error: "Unable to load project" },
            { status: 500 }
        )
    }
}
