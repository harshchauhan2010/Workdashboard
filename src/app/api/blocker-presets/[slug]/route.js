import {
  getBlockerPresetBySlugController,
  deleteBlockerPresetController,
} from "@/modules/blocker-presets/blocker-presets.controller";

/**
 * GET /api/blocker-presets/:slug - Get single blocker preset by slug or ID
 */
export async function GET(request, context) {
  return getBlockerPresetBySlugController(request, context);
}

/**
 * DELETE /api/blocker-presets/:slug - Delete blocker preset
 */
export async function DELETE(request, context) {
  return deleteBlockerPresetController(request, context);
}
