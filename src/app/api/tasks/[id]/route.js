import {
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
} from "@/modules/tasks/tasks.controller";

/**
 * GET /api/tasks/:id - Get task by ID with assignments and blockers
 */
export async function GET(request, context) {
  return getTaskByIdController(request, context);
}

/**
 * PATCH /api/tasks/:id - Update task fields & status transitions
 */
export async function PATCH(request, context) {
  return updateTaskController(request, context);
}

/**
 * DELETE /api/tasks/:id - Delete task
 */
export async function DELETE(request, context) {
  return deleteTaskController(request, context);
}
