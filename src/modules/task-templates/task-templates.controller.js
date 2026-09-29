import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as templatesService from "./task-templates.service";

/**
 * GET /api/task-templates - List all templates (optional ?category= filter)
 */
export async function listTaskTemplatesController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const templates = await templatesService.getAllTemplates({ category });
    return NextResponse.json({
      status: "success",
      count: templates.length,
      data: templates,
    });
  } catch (err) {
    console.error("[taskTemplates.controller.listTaskTemplates] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/task-templates - Create a new custom task template
 */
export async function createTaskTemplateController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const created = await templatesService.createTemplate(authUserId, body);

    return NextResponse.json(
      {
        status: "success",
        message: "Task blueprint template created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[taskTemplates.controller.createTaskTemplate] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/task-templates/:id - Get template details by ID
 */
export async function getTaskTemplateByIdController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const template = await templatesService.getTemplateById(id);
    return NextResponse.json({
      status: "success",
      data: template,
    });
  } catch (err) {
    console.error("[taskTemplates.controller.getTaskTemplateById] Error:", err);
    const statusCode = err.statusCode || (err.message === "Task template not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/task-templates/:id - Update custom template
 */
export async function updateTaskTemplateController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await templatesService.updateTemplate(id, body);

    return NextResponse.json({
      status: "success",
      message: "Task template updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[taskTemplates.controller.updateTaskTemplate] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/task-templates/:id - Delete custom template
 */
export async function deleteTaskTemplateController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const result = await templatesService.deleteTemplate(id);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (err) {
    console.error("[taskTemplates.controller.deleteTaskTemplate] Error:", err);
    const statusCode = err.statusCode || (err.message === "Task template not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/task-templates/:id/instantiate - Create task from template
 */
export async function instantiateTaskTemplateController(request, context) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const result = await templatesService.instantiateTaskFromTemplate(id, authUserId, body);

    return NextResponse.json(
      {
        status: "success",
        ...result,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[taskTemplates.controller.instantiateTaskTemplate] Error:", err);
    const statusCode = err.statusCode || (err.message === "Task template not found" ? 404 : 500);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: statusCode }
    );
  }
}
