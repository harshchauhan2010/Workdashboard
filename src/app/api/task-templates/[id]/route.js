import {
  getTaskTemplateByIdController,
  updateTaskTemplateController,
  deleteTaskTemplateController,
} from "@/modules/task-templates/task-templates.controller";

/**
 * GET /api/task-templates/:id - Get template by ID
 */
export async function GET(request, context) {
  return getTaskTemplateByIdController(request, context);
}

/**
 * PUT /api/task-templates/:id - Update custom template
 */
export async function PUT(request, context) {
  return updateTaskTemplateController(request, context);
}

/**
 * DELETE /api/task-templates/:id - Delete custom template
 */
export async function DELETE(request, context) {
  return deleteTaskTemplateController(request, context);
}
