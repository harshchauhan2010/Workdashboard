import { deleteAssignmentController } from "@/modules/assignments/assignments.controller";

/**
 * DELETE /api/assignments/:id - Remove a developer assignment from a task
 */
export async function DELETE(request, context) {
  return deleteAssignmentController(request, context);
}
