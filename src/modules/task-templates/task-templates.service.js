import * as taskTemplatesRepo from "./task-templates.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";
import * as authRepo from "@/modules/auth/auth.repository.js";
import * as tasksRepo from "@/modules/tasks/tasks.repository.js";
import * as squadsRepo from "@/modules/squads/squads.repository.js";
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  isValidUUID,
} from "./task-templates.validator.js";

// Helper to resolve user from Clerk ID, DB user ID, or fallback
async function resolveDbUser(authUserId, explicitUserId = null) {
  if (explicitUserId && isValidUUID(explicitUserId)) {
    const explicit = await usersRepo.findById(explicitUserId);
    if (explicit) return explicit;
  }
  if (!authUserId) return null;
  let user = await authRepo.findUserByClerkId(authUserId);
  if (!user && isValidUUID(authUserId)) {
    user = await usersRepo.findById(authUserId);
  }
  return user;
}

/**
 * Get all task templates (system + custom), with optional category filter
 */
export async function getAllTemplates(filters = {}) {
  return await taskTemplatesRepo.findAll(filters);
}

/**
 * Get single template by ID
 */
export async function getTemplateById(id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid template ID format");
    error.statusCode = 400;
    throw error;
  }

  const template = await taskTemplatesRepo.findById(id);
  if (!template) {
    const error = new Error("Task template not found");
    error.statusCode = 404;
    throw error;
  }

  return template;
}

/**
 * Create a new custom task template
 */
export async function createTemplate(authUserId, payload = {}) {
  const validation = validateCreateTemplate(payload);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await resolveDbUser(authUserId, payload.created_by_user_id);

  return await taskTemplatesRepo.createTemplate({
    name: payload.name.trim(),
    default_task_title: payload.default_task_title.trim(),
    category: payload.category || "DEVELOPMENT",
    task_type: payload.task_type || "PRE_PLANNING",
    recurrence_frequency: payload.recurrence_frequency || null,
    default_estimated_hours:
      payload.default_estimated_hours !== undefined
        ? Number(payload.default_estimated_hours)
        : 4.0,
    default_priority: payload.default_priority || "P2_MEDIUM",
    created_by_user_id: user ? user.id : null,
  });
}

/**
 * Update an existing custom task template
 * (Protected: system templates cannot be modified)
 */
export async function updateTemplate(id, payload = {}) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid template ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await taskTemplatesRepo.findById(id);
  if (!existing) {
    const error = new Error("Task template not found");
    error.statusCode = 404;
    throw error;
  }

  // System templates cannot be modified
  if (existing.is_system) {
    const error = new Error("System templates cannot be modified");
    error.statusCode = 403;
    throw error;
  }

  const validation = validateUpdateTemplate(payload);
  if (!validation.isValid) {
    const error = new Error(`Validation Error: ${validation.errors.join("; ")}`);
    error.statusCode = 400;
    throw error;
  }

  const updateFields = {};
  if (payload.name !== undefined) updateFields.name = payload.name.trim();
  if (payload.default_task_title !== undefined)
    updateFields.default_task_title = payload.default_task_title.trim();
  if (payload.category !== undefined) updateFields.category = payload.category;
  if (payload.task_type !== undefined) updateFields.task_type = payload.task_type;
  if (payload.recurrence_frequency !== undefined)
    updateFields.recurrence_frequency = payload.recurrence_frequency;
  if (payload.default_estimated_hours !== undefined)
    updateFields.default_estimated_hours = Number(payload.default_estimated_hours);
  if (payload.default_priority !== undefined)
    updateFields.default_priority = payload.default_priority;

  return await taskTemplatesRepo.updateTemplate(id, updateFields);
}

/**
 * Delete a custom task template
 * (Protected: system templates cannot be deleted)
 */
export async function deleteTemplate(id) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid template ID format");
    error.statusCode = 400;
    throw error;
  }

  const existing = await taskTemplatesRepo.findById(id);
  if (!existing) {
    const error = new Error("Task template not found");
    error.statusCode = 404;
    throw error;
  }

  // System templates cannot be deleted
  if (existing.is_system) {
    const error = new Error("System templates cannot be deleted");
    error.statusCode = 403;
    throw error;
  }

  await taskTemplatesRepo.deleteTemplate(id);
  return { message: "Task template deleted successfully", deleted_id: id };
}

/**
 * Instantiate a new task from a blueprint template
 */
export async function instantiateTaskFromTemplate(id, authUserId, overrides = {}) {
  if (!isValidUUID(id)) {
    const error = new Error("Invalid template ID format");
    error.statusCode = 400;
    throw error;
  }

  const template = await taskTemplatesRepo.findById(id);
  if (!template) {
    const error = new Error("Task template not found");
    error.statusCode = 404;
    throw error;
  }

  if (!overrides.squad_id) {
    const error = new Error("squad_id is required to instantiate a task from a template");
    error.statusCode = 400;
    throw error;
  }

  const squad = await squadsRepo.findByIdWithDetails(overrides.squad_id);
  if (!squad) {
    const error = new Error("Squad not found");
    error.statusCode = 404;
    throw error;
  }
  if (!squad.is_active) {
    const error = new Error("Cannot instantiate tasks in an inactive squad");
    error.statusCode = 400;
    throw error;
  }

  const user = await resolveDbUser(authUserId, overrides.assigned_by_user_id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const taskData = {
    title: overrides.title || template.default_task_title,
    description:
      overrides.description ||
      `Instantiated from template blueprint: "${template.name}"`,
    squad_id: overrides.squad_id,
    task_type: overrides.task_type || template.task_type || "PRE_PLANNING",
    category: overrides.category || template.category || "DEVELOPMENT",
    priority: overrides.priority || template.default_priority || "P2_MEDIUM",
    status: overrides.status || "IN_PROGRESS",
    estimated_hours:
      overrides.estimated_hours !== undefined
        ? Number(overrides.estimated_hours)
        : Number(template.default_estimated_hours),
    recurrence_frequency:
      overrides.recurrence_frequency || template.recurrence_frequency || null,
    assigned_by_user_id: user.id,
    due_date: overrides.due_date || null,
  };

  const newTask = await tasksRepo.createTask(taskData);
  return {
    message: "Task successfully instantiated from blueprint template",
    template_used: {
      id: template.id,
      name: template.name,
    },
    task: newTask,
  };
}
