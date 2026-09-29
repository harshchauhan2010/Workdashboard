import { getDeveloperHeatmapController } from "@/modules/capacity/capacity.controller";

/**
 * GET /api/capacity/developers - Get developer capacity heatmap data
 */
export async function GET(request) {
  return getDeveloperHeatmapController(request);
}
