
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SITE_ORIGIN = "https://dominiquecalaguas.framer.website"

function getCorsHeaders(request: Request) {
    const origin = request.headers.get("origin")

    const allowed =
        origin === SITE_ORIGIN ||
        (origin !== null &&
            /^https:\/\/[a-z0-9-]+\.framercanvas\.com$/.test(origin))

    return {
        ...(allowed && origin
            ? { "Access-Control-Allow-Origin": origin }
            : {}),
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
    }
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request),
    })
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params

    try {
        // Reuse our existing, working portfolio endpoint
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
                    headers: getCorsHeaders(request),
                }
            )
        }

        return NextResponse.json(
            { project },
            {
                headers: {
                    ...getCorsHeaders(request),
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
                headers: getCorsHeaders(request),
            }
        )
    }
}
