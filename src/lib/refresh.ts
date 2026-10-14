import "server-only";
import { revalidatePath, updateTag } from "next/cache";

// Call from server actions after a change. Tags refresh the cached data; the paths make sure
// the very next visitor gets the new page (otherwise a prerendered page can be served stale once).

export function refreshJobs(opts: { jobId?: string | null; employerId?: string | null } = {}) {
  updateTag("jobs");
  updateTag("employers");
  revalidatePath("/");
  revalidatePath("/employers");
  if (opts.jobId) {
    updateTag(`job:${opts.jobId}`);
    revalidatePath(`/jobs/${opts.jobId}`);
  }
  if (opts.employerId) {
    updateTag(`employer:${opts.employerId}`);
    revalidatePath(`/employers/${opts.employerId}`);
  }
}

export function refreshEvents(eventId?: string | null) {
  updateTag("events");
  revalidatePath("/events");
  if (eventId) {
    updateTag(`event:${eventId}`);
    revalidatePath(`/events/${eventId}`);
  }
}
