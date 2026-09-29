import * as assignmentsRepo from "./assignments.repository.js";
import * as tasksRepo from "@/modules/tasks/tasks.repository.js";
import * as squadMembersRepo from "@/modules/squad-members/squad-members.repository.js";
import * as usersRepo from "@/modules/users/users.repository.js";

// List all assignments for a task
export async function getAssignmentsForTask(taskId) {
  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  return await assignmentsRepo.findByTaskId(taskId);
}

// Assign developer(s) to a task
export async function createTaskAssignments(taskId, payload) {
  const task = await tasksRepo.findById(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  const splitMode = (payload.split_mode || "SINGLE_DEVELOPER").toUpperCase();
  const createdAssignments = [];

  if (splitMode === "ENTIRE_TEAM") {
    const squadMembers = await squadMembersRepo.findActiveBySquadId(task.squad_id);
    if (!squadMembers || squadMembers.length === 0) {
      throw new Error("No active members found in this squad to assign");
    }

    const hoursPerPerson = Number(payload.assigned_hours_per_person);

    for (const member of squadMembers) {
      const assignment = await assignmentsRepo.upsertAssignment({
        taskId,
        userId: member.user_id,
        assignedHours: hoursPerPerson,
        splitMode: "ENTIRE_TEAM",
      });
      createdAssignments.push(assignment);
    }
  } else {
    // SINGLE_DEVELOPER or MULTIPLE_DEVELOPERS
    for (const item of payload.assignments) {
      const user = await usersRepo.findById(item.user_id);
      if (!user) {
        throw new Error(`User with ID ${item.user_id} not found`);
      }

      const assignment = await assignmentsRepo.upsertAssignment({
        taskId,
        userId: item.user_id,
        assignedHours: Number(item.assigned_hours),
        splitMode,
      });
      createdAssignments.push(assignment);
    }
  }

  return await assignmentsRepo.findByTaskId(taskId);
}

// Delete an individual assignment
export async function deleteAssignment(id) {
  const existing = await assignmentsRepo.findById(id);
  if (!existing) {
    throw new Error("Assignment not found");
  }

  return await assignmentsRepo.deleteAssignment(id);
}
