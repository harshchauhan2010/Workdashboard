import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as presetsService from "./blocker-presets.service";

// GET /api/blocker-presets - List all blocker presets
export async function listBlockerPresetsController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const presets = await presetsService.getAllPresets();
    return NextResponse.json({
      status: "success",
      count: presets.length,
      data: presets,
    });
  } catch (err) {
    console.error("[blockerPresets.controller.listBlockerPresets] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/blocker-presets - Create new blocker preset
export async function createBlockerPresetController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const newPreset = await presetsService.createPreset(body);

    return NextResponse.json(
      {
        status: "success",
        message: "Blocker preset template created successfully",
        data: newPreset,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[blockerPresets.controller.createBlockerPreset] Error:", err);
    if (
      err.message?.startsWith("Validation Error") ||
      err.message?.includes("already exists")
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/blocker-presets/:slug - Get single blocker preset by slug or ID
export async function getBlockerPresetBySlugController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const preset = await presetsService.getPresetBySlugOrId(slug);
    return NextResponse.json({
      status: "success",
      data: preset,
    });
  } catch (err) {
    console.error("[blockerPresets.controller.getBlockerPresetBySlug] Error:", err);
    if (err.message === "Blocker preset not found") {
      return NextResponse.json({ error: "Blocker preset not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blocker-presets/:slug - Delete blocker preset
export async function deleteBlockerPresetController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const deleted = await presetsService.deletePreset(slug);
    return NextResponse.json({
      status: "success",
      message: "Blocker preset deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[blockerPresets.controller.deleteBlockerPreset] Error:", err);
    if (err.message === "Blocker preset not found") {
      return NextResponse.json({ error: "Blocker preset not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
