
import { NextResponse } from "next/server"
import { connect } from "framer-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"


const ALLOWED_ORIGIN = "https://dominiquecalaguas.framer.website"

function getCorsHeaders(origin: string | null) {
    const isAllowed =
        origin === ALLOWED_ORIGIN ||
        (origin !== null &&
            /^https:\/\/[a-z0-9-]+\.framercanvas\.com$/.test(origin))

    return {
        "Access-Control-Allow-Origin": isAllowed ? origin! : ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    })
}

function cleanText(value: unknown): string {
    if (typeof value !== "string") return ""

    return value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
}

export async function GET() {
    const projectUrl = process.env.FRAMER_PROJECT_URL
    const apiKey = process.env.FRAMER_API_KEY

    if (!projectUrl || !apiKey) {
        return NextResponse.json(
            { error: "Framer credentials are not configured" },
            {
                status: 500,
                headers: corsHeaders,
            }
        )
    }

    let framer: Awaited<ReturnType<typeof connect>> | undefined

    try {
        framer = await connect(projectUrl, apiKey)

        const collections = await framer.getCollections()

        const projectsCollection = collections.find(
            (collection) => collection.name === "Projects"
        )

        const copyCollection = collections.find(
            (collection) => collection.name === "Copy"
        )

        if (!projectsCollection || !copyCollection) {
            throw new Error("Required CMS collections not found")
        }

        const [
            projects,
            projectFields,
            copyItems,
            copyFields,
        ] = await Promise.all([
            projectsCollection.getItems(),
            projectsCollection.getFields(),
            copyCollection.getItems(),
            copyCollection.getFields(),
        ])

        function getField(
            item: any,
            fields: { id: string; name: string }[],
            name: string
        ): unknown {
            const field = fields.find((f) => f.name === name)

            return field
                ? item.fieldData?.[field.id]?.value
                : undefined
        }

        function resolveSection(value: unknown) {
            if (typeof value === "string") {
                return [{ title: "", text: cleanText(value) }]
            }

            if (!Array.isArray(value)) return []

            return value.flatMap((slug) => {
                if (typeof slug !== "string") return []

                const item = copyItems.find(
                    (entry) => entry.slug === slug
                )

                if (!item) return []

                return [{
                    title: cleanText(
                        getField(item, copyFields, "Title")
                    ),
                    text: cleanText(
                        getField(item, copyFields, "Text")
                    ),
                }]
            })
        }

        const result = projects.map((project) => ({
            slug: project.slug,
            name: getField(
                project,
                projectFields,
                "Project / Client Name"
            ),
            summary: getField(
                project,
                projectFields,
                "1-Liner"
            ),
            role: getField(
                project,
                projectFields,
                "Main scope of work"
            ),
            year: getField(
                project,
                projectFields,
                "Year"
            ),
            skills: getField(
                project,
                projectFields,
                "Scope of work"
            ),
            website: getField(
                project,
                projectFields,
                "Link to Live Website"
            ),
            sections: {
                background: resolveSection(
                    getField(project, projectFields, "Background")
                ),
                userResearch: resolveSection(
                    getField(project, projectFields, "User Research")
                ),
                designProcess: resolveSection(
                    getField(project, projectFields, "Design Process")
                ),
                conclusion: resolveSection(
                    getField(project, projectFields, "Conclusion")
                ),
            },
        }))

        return NextResponse.json(
            { projects: result },
            {
                headers: {
                    ...corsHeaders,
                    "Cache-Control": "no-store",
                },
            }
        )
    } catch (error) {
        console.error("Portfolio API error:", error)

        return NextResponse.json(
            { error: "Unable to load portfolio data" },
            {
                status: 500,
                headers: corsHeaders,
            }
        )
    } finally {
        if (framer) {
            await framer.disconnect()
        }
    }
}
