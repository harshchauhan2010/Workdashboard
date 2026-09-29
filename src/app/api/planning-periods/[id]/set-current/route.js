import { setCurrentPeriodController } from "@/modules/planning-periods/planning-periods.controller";

/**
 * PATCH /api/planning-periods/:id/set-current - Switch active sprint
 */
export async function PATCH(request, context) {
  return setCurrentPeriodController(request, context);
}
