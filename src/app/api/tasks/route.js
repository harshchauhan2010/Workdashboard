import {
  listTasksController,
  createTaskController,
} from "@/modules/tasks/tasks.controller";

/**
 * GET /api/tasks - List tasks with query filters
 */
export async function GET(request) {
  return listTasksController(request);
}

/**
 * POST /api/tasks - Create new task
 */
export async function POST(request) {
  return createTaskController(request);
}
