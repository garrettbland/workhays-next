"use client";

import { useActionState } from "react";
import { respondToInvite } from "@/app/dashboard/actions";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function InviteResponse({ token, employerName }: { token: string; employerName: string }) {
  const [state, action] = useActionState(respondToInvite, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <SubmitButton name="accept" value="1" variant="gold" pendingLabel="Joining…">Accept and join {employerName}</SubmitButton>
        <SubmitButton name="accept" value="0" variant="secondary">Decline</SubmitButton>
      </div>
    </ActionForm>
  );
}
