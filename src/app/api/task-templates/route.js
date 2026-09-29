import {
  listTaskTemplatesController,
  createTaskTemplateController,
} from "@/modules/task-templates/task-templates.controller";

/**
 * GET /api/task-templates - List all task templates
 */
export async function GET(request) {
  return listTaskTemplatesController(request);
}

/**
 * POST /api/task-templates - Create a new custom task template
 */
export async function POST(request) {
  return createTaskTemplateController(request);
}
