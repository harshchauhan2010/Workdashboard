import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as usersService from "./users.service.js";
import { validateCreateUser, validateUpdateUser } from "./users.validator.js";

// GET /api/users - List active users
export async function listUsersController(request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await usersService.getAllActiveUsers();
    return NextResponse.json({
      status: "success",
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error("[users.controller.listUsers] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// GET /api/users/:id - Get single user
export async function getUserByIdController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await usersService.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.error("[users.controller.getUserById] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function createUserController(request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationError = validateCreateUser(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const newUser = await usersService.createUser(body);
    return NextResponse.json(
      {
        status: "success",
        message: "User created successfully",
        data: newUser,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[users.controller.createUser] Error:", err);
    if (err.message?.includes("already exists")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/users/:id - Update user
export async function updateUserController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validationError = validateUpdateUser(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updatedUser = await usersService.updateUser(id, body);
    return NextResponse.json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("[users.controller.updateUser] Error:", err);
    if (err.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - Soft-delete user
export async function deleteUserController(request, context) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const deactivatedUser = await usersService.deactivateUser(id);
    return NextResponse.json({
      status: "success",
      message: "User deactivated successfully",
      data: deactivatedUser,
    });
  } catch (err) {
    console.error("[users.controller.deleteUser] Error:", err);
    if (err.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
