import {
  listBlockerPresetsController,
  createBlockerPresetController,
} from "@/modules/blocker-presets/blocker-presets.controller";

/**
 * GET /api/blocker-presets - List all blocker presets
 */
export async function GET(request) {
  return listBlockerPresetsController(request);
}

/**
 * POST /api/blocker-presets - Create new blocker preset
 */
export async function POST(request) {
  return createBlockerPresetController(request);
}
