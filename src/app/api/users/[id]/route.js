import {
  getUserByIdController,
  updateUserController,
  deleteUserController,
} from "@/modules/users/users.controller";

/**
 * GET /api/users/:id - Get user profile by ID
 */
export async function GET(request, context) {
  return getUserByIdController(request, context);
}

/**
 * PATCH /api/users/:id - Update user profile fields
 */
export async function PATCH(request, context) {
  return updateUserController(request, context);
}

/**
 * DELETE /api/users/:id - Soft-delete / deactivate user profile
 */
export async function DELETE(request, context) {
  return deleteUserController(request, context);
}
