import { deleteWorkLogController } from "@/modules/work-logs/work-logs.controller";

/**
 * DELETE /api/work-logs/:id - Delete a work log entry
 */
export async function DELETE(request, context) {
  return deleteWorkLogController(request, context);
}
