import { resolveBlockerController } from "@/modules/blockers/blockers.controller";

/**
 * PATCH /api/blockers/:id/resolve - Resolve blocker
 */
export async function PATCH(request, context) {
  return resolveBlockerController(request, context);
}

/**
 * POST /api/blockers/:id/resolve - Resolve blocker (alternative verb)
 */
export async function POST(request, context) {
  return resolveBlockerController(request, context);
}
