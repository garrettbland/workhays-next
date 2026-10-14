"use client";

import { useActionState, useEffect, useRef } from "react";
import { replyToMessage } from "@/app/admin/actions";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function ReplyForm({ messageId, to, inboxReady }: { messageId: string; to: string; inboxReady: boolean }) {
  const [state, action] = useActionState(replyToMessage, undefined);
  const form = useRef<HTMLFormElement>(null);
  // Clear the box after a reply is sent; errors keep what was typed.
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <ActionForm ref={form} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="message_id" value={messageId} />
      <label htmlFor="reply-body" className="text-[15px] font-semibold">Reply to {to}</label>
      <textarea id="reply-body" name="body" rows={7} required minLength={2} maxLength={10000} className="border-[1.5px] border-ink px-3 py-2 text-[16px]" />
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Sending…">Send reply</SubmitButton>
        <span className="text-[13px] text-muted">
          Sent from Work Hays with your first name. {inboxReady ? "When they reply, it shows up here." : "Email replies won't come back here until the inbox address is set up."} Sending marks it handled.
        </span>
      </div>
    </ActionForm>
  );
}
