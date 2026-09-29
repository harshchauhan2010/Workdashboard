import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as squadMembersService from "./squad-members.service.js";
import {
  validateAddMember,
  validateUpdateAllocation,
} from "./squad-members.validator.js";

// GET /api/squads/:id/members - List current active members of a squad
export async function listSquadMembersController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const squadId = params?.id;
    if (!squadId) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const members = await squadMembersService.getActiveMembersBySquadId(squadId);
    return NextResponse.json({
      status: "success",
      count: members.length,
      data: members,
    });
  } catch (err) {
    console.error("[squadMembers.controller.listSquadMembers] Error:", err);
    if (err.message === "Squad not found") {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/squads/:id/members - Add member to squad
export async function addSquadMemberController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const squadId = params?.id;
    if (!squadId) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateAddMember(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newMember = await squadMembersService.addMemberToSquad(squadId, body);
    return NextResponse.json(
      {
        status: "success",
        message: "Member added to squad successfully",
        data: newMember,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[squadMembers.controller.addSquadMember] Error:", err);
    if (err.message === "Squad not found" || err.message?.includes("User not found")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err.message?.includes("already an active member")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/squad-members/:id - Update allocation percentage
export async function updateMemberAllocationController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const memberId = params?.id;
    if (!memberId) {
      return NextResponse.json({ error: "Membership ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateUpdateAllocation(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updatedMember = await squadMembersService.updateMemberAllocation(memberId, body);
    return NextResponse.json({
      status: "success",
      message: "Allocation percentage updated successfully",
      data: updatedMember,
    });
  } catch (err) {
    console.error("[squadMembers.controller.updateMemberAllocation] Error:", err);
    if (err.message === "Active squad membership not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/squad-members/:id - Soft remove member from squad
export async function removeSquadMemberController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const memberId = params?.id;
    if (!memberId) {
      return NextResponse.json({ error: "Membership ID is required" }, { status: 400 });
    }

    const removedMember = await squadMembersService.removeMemberFromSquad(memberId);
    return NextResponse.json({
      status: "success",
      message: "Member removed from squad successfully",
      data: removedMember,
    });
  } catch (err) {
    console.error("[squadMembers.controller.removeSquadMember] Error:", err);
    if (err.message === "Active squad membership not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
