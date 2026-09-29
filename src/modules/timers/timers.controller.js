import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import * as timersService from "./timers.service";

// Helper to extract explicit dev user id from header/query if present
function getExplicitDevUserId(request) {
  if (process.env.NODE_ENV !== "production" && request) {
    const devUserId = request.headers.get("x-dev-user-id");
    if (devUserId) return devUserId;
    const { searchParams } = new URL(request.url);
    if (searchParams.get("user_id")) return searchParams.get("user_id");
  }
  return null;
}

// GET /api/timers/me (or GET /api/timers) - Get current user's active timer
export async function getMyTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const explicitUserId = getExplicitDevUserId(request);
    const timer = await timersService.getActiveTimer(authUserId, explicitUserId);

    return NextResponse.json({
      status: "success",
      data: timer,
    });
  } catch (err) {
    console.error("[timers.controller.getMyTimer] Error:", err);
    if (err.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/timers/start - Start timer on a task
export async function startTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const explicitUserId = getExplicitDevUserId(request);
    if (explicitUserId && !body.user_id) {
      body.user_id = explicitUserId;
    }

    const timer = await timersService.startTimer(authUserId, body);
    return NextResponse.json(
      {
        status: "success",
        message: "Timer started successfully",
        data: timer,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[timers.controller.startTimer] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message },
      { status: statusCode }
    );
  }
}

// PATCH /api/timers/pause - Pause running timer
export async function pauseTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }

    const explicitUserId = getExplicitDevUserId(request);
    if (explicitUserId && !body.user_id) {
      body.user_id = explicitUserId;
    }

    const timer = await timersService.pauseTimer(authUserId, body);
    return NextResponse.json({
      status: "success",
      message: "Timer paused successfully",
      data: timer,
    });
  } catch (err) {
    console.error("[timers.controller.pauseTimer] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message },
      { status: statusCode }
    );
  }
}

// PATCH /api/timers/resume - Resume paused timer
export async function resumeTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }

    const explicitUserId = getExplicitDevUserId(request);
    if (explicitUserId && !body.user_id) {
      body.user_id = explicitUserId;
    }

    const timer = await timersService.resumeTimer(authUserId, body);
    return NextResponse.json({
      status: "success",
      message: "Timer resumed successfully",
      data: timer,
    });
  } catch (err) {
    console.error("[timers.controller.resumeTimer] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message },
      { status: statusCode }
    );
  }
}

// POST /api/timers/stop - Stop timer and log work
export async function stopTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }

    const explicitUserId = getExplicitDevUserId(request);
    if (explicitUserId && !body.user_id) {
      body.user_id = explicitUserId;
    }

    const result = await timersService.stopTimer(authUserId, body);
    return NextResponse.json({
      status: "success",
      message: result.message,
      hours_logged: result.hours_logged,
      seconds_recorded: result.seconds_recorded,
      data: result.work_log,
    });
  } catch (err) {
    console.error("[timers.controller.stopTimer] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message },
      { status: statusCode }
    );
  }
}

// DELETE /api/timers/me (or DELETE /api/timers) - Discard active timer without logging
export async function discardTimerController(request) {
  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const explicitUserId = getExplicitDevUserId(request);
    const deleted = await timersService.discardTimer(authUserId, explicitUserId);

    return NextResponse.json({
      status: "success",
      message: "Active timer discarded successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("[timers.controller.discardTimer] Error:", err);
    const statusCode = err.statusCode || (err.message?.startsWith("Validation Error") ? 400 : 500);
    return NextResponse.json(
      { error: err.message },
      { status: statusCode }
    );
  }
}
