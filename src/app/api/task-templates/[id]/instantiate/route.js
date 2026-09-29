import { instantiateTaskTemplateController } from "@/modules/task-templates/task-templates.controller";

/**
 * POST /api/task-templates/:id/instantiate - Create task from template blueprint
 */
export async function POST(request, context) {
  return instantiateTaskTemplateController(request, context);
}
