import {
  listUsersController,
  createUserController,
} from "@/modules/users/users.controller";

/**
 * GET /api/users - List all active users
 */
export async function GET(request) {
  return listUsersController(request);
}

/**
 * POST /api/users - Create a new user profile
 */
export async function POST(request) {
  return createUserController(request);
}
