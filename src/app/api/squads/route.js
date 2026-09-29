import {
  listSquadsController,
  createSquadController,
} from "@/modules/squads/squads.controller";

// GET /api/squads - List all active squads
export async function GET(request) {
  return listSquadsController(request);
}

// POST /api/squads - Create a new squad
export async function POST(request) {
  return createSquadController(request);
}
