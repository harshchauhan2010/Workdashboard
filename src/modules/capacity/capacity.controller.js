import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as capacityService from "./capacity.service";

/**
 * GET /api/capacity/developers - Get developer capacity heatmap data
 */
export async function getDeveloperHeatmapController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const squadId = searchParams.get("squadId") || searchParams.get("squad_id");

    const heatmap = await capacityService.getDeveloperHeatmap({ squadId });
    return NextResponse.json({
      status: "success",
      count: heatmap.length,
      data: heatmap,
    });
  } catch (err) {
    console.error("[capacity.controller.getDeveloperHeatmap] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/capacity/me - Get personal capacity stats for current authenticated developer
 */
export async function getMyCapacityController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const capacity = await capacityService.getMyCapacity(authUserId);
    return NextResponse.json({
      status: "success",
      data: capacity,
    });
  } catch (err) {
    console.error("[capacity.controller.getMyCapacity] Error:", err);
    const statusCode = err.statusCode || (err.message === "User not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/capacity/developers/:id - Get capacity metrics for a specific developer
 */
export async function getDeveloperCapacityByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Developer ID is required" }, { status: 400 });
    }

    const capacity = await capacityService.getDeveloperCapacity(id);
    return NextResponse.json({
      status: "success",
      data: capacity,
    });
  } catch (err) {
    console.error("[capacity.controller.getDeveloperCapacityById] Error:", err);
    const statusCode =
      err.statusCode || (err.message === "Developer capacity summary not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/capacity/squads - Get capacity summaries across squads
 */
export async function getSquadsCapacityController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const squadId = searchParams.get("squadId") || searchParams.get("squad_id");

    const summaries = await capacityService.getSquadsCapacity({ squadId });
    return NextResponse.json({
      status: "success",
      count: summaries.length,
      data: summaries,
    });
  } catch (err) {
    console.error("[capacity.controller.getSquadsCapacity] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/capacity/squads/:id - Get single squad capacity summary
 */
export async function getSquadCapacityByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Squad ID is required" }, { status: 400 });
    }

    const summary = await capacityService.getSquadCapacity(id);
    return NextResponse.json({
      status: "success",
      data: summary,
    });
  } catch (err) {
    console.error("[capacity.controller.getSquadCapacityById] Error:", err);
    const statusCode =
      err.statusCode || (err.message === "Squad capacity summary not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}
