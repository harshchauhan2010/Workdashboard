import {
  listSquadMembersController,
  addSquadMemberController,
} from "@/modules/squad-members/squad-members.controller";

// GET /api/squads/:id/members - List all active members of a squad
export async function GET(request, context) {
  return listSquadMembersController(request, context);
}

// POST /api/squads/:id/members - Add a developer to a squad
export async function POST(request, context) {
  return addSquadMemberController(request, context);
}
