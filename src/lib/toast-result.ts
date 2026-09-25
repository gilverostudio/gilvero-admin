import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";

/** Show the standard toast for an action result. Returns true on success. */
export function toastResult<T>(result: ActionResult<T>, success: string): result is Extract<ActionResult<T>, { ok: true }> {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  if (result.website === "pending") {
    toast.success(success, { description: "Saved. The live site couldn't be refreshed right now — it will update within the hour." });
  } else {
    toast.success(success);
  }
  return true;
}
