import { McpServer } from "@modelcontextprotocol/server";
import { connect, type CollectionItem, type Field } from "framer-api";
import { z } from "zod";
import { loggedToolCall } from "./tool-logging";

type FramerData = {
  projectFields: Field[];
  projects: CollectionItem[];
  copyFields: Field[];
  copyItems: CollectionItem[];
};

let framerDataPromise: Promise<FramerData> | undefined;

function requiredEnvironmentVariable(name: "FRAMER_API_KEY" | "FRAMER_PROJECT_URL") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function stripHtml(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/<[^>]*>/g, "");
}

function getFieldValue(item: CollectionItem, fields: Field[], fieldName: string) {
  const field = fields.find((candidate) => candidate.name === fieldName);
  return field ? item.fieldData[field.id]?.value : undefined;
}

function cleanProject(project: CollectionItem, fields: Field[]) {
  return {
    slug: project.slug,
    name: getFieldValue(project, fields, "Project / Client Name"),
    role: getFieldValue(project, fields, "Main scope of work"),
    description: stripHtml(getFieldValue(project, fields, "Description")),
    year: getFieldValue(project, fields, "Year"),
    skills: getFieldValue(project, fields, "Scope of work"),
    website: getFieldValue(project, fields, "Link to Live Website"),
    projectType: getFieldValue(project, fields, "Project Type"),
    hasUserResearch: getFieldValue(project, fields, "Has User Research?"),
  };
}

function cleanCopyItem(item: CollectionItem, fields: Field[]) {
  return {
    slug: item.slug,
    title: getFieldValue(item, fields, "Title"),
    text: stripHtml(getFieldValue(item, fields, "Text")),
    image: getFieldValue(item, fields, "Image"),
    video: getFieldValue(item, fields, "Video"),
    videoPoster: getFieldValue(item, fields, "Video Poster"),
  };
}

function getReferencedCopyItems(
  project: CollectionItem,
  projectFields: Field[],
  fieldName: string,
  copyItems: CollectionItem[],
  copyFields: Field[],
) {
  const value: unknown = getFieldValue(project, projectFields, fieldName);
  const slugs = Array.isArray(value)
    ? value.filter((slug): slug is string => typeof slug === "string")
    : [];

  return slugs.flatMap((slug) => {
    const item = copyItems.find((candidate) => candidate.slug === slug);
    return item ? [cleanCopyItem(item, copyFields)] : [];
  });
}

async function fetchFramerData() {
  const projectUrl = requiredEnvironmentVariable("FRAMER_PROJECT_URL");
  const apiKey = requiredEnvironmentVariable("FRAMER_API_KEY");
  const framer = await connect(projectUrl, apiKey);

  try {
    const collections = await framer.getCollections();
    const projectsCollection = collections.find(
      (collection) => collection.name === "Projects",
    );
    const copyCollection = collections.find(
      (collection) => collection.name === "Copy",
    );

    if (!projectsCollection) {
      throw new Error("Couldn't find the Projects collection");
    }

    if (!copyCollection) {
      throw new Error("Couldn't find the Copy collection");
    }

    const [projects, projectFields, copyItems, copyFields] = await Promise.all([
      projectsCollection.getItems(),
      projectsCollection.getFields(),
      copyCollection.getItems(),
      copyCollection.getFields(),
    ]);

    return { projects, projectFields, copyItems, copyFields };
  } finally {
    await framer.disconnect();
  }
}

async function getFramerData() {
  if (!framerDataPromise) {
    framerDataPromise = fetchFramerData().catch((error) => {
      framerDataPromise = undefined;
      throw error;
    });
  }

  return framerDataPromise;
}

export function createDominiquePortfolioMcpServer() {
  const server = new McpServer(
    { name: "dominique-portfolio", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "List Dominique's Framer portfolio projects",
    },
    async (context) => loggedToolCall("list_projects", context, async () => {
      const { projects, projectFields } = await getFramerData();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              projects.map((project) => cleanProject(project, projectFields)),
              null,
              2,
            ),
          },
        ],
      };
    }),
  );

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description: "Get one portfolio project by slug",
      inputSchema: z.object({
        slug: z.string().min(1).describe("Project slug, e.g. mochihealth"),
      }),
    },
    async ({ slug }, context) => loggedToolCall("get_project", context, async () => {
      const { projects, projectFields, copyItems, copyFields } =
        await getFramerData();
      const project = projects.find((candidate) => candidate.slug === slug);

      if (!project) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Couldn't find a project with slug "${slug}"`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                ...cleanProject(project, projectFields),
                designProcess: getReferencedCopyItems(
                  project,
                  projectFields,
                  "Design Process",
                  copyItems,
                  copyFields,
                ),
                conclusion: getReferencedCopyItems(
                  project,
                  projectFields,
                  "Conclusion",
                  copyItems,
                  copyFields,
                ),
              },
              null,
              2,
            ),
          },
        ],
      };
    }),
  );

  return server;
}
