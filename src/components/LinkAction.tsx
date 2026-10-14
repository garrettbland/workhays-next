"use client";

import { useActionState } from "react";
import { performLink } from "@/app/link/[token]/actions";
import { ActionForm, FormMessage, SubmitButton } from "@/components/ui/Form";

export function LinkAction({ token, label }: { token: string; label: string }) {
  const [state, action] = useActionState(performLink, undefined);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <div><SubmitButton variant="gold" pendingLabel="Working…">{label}</SubmitButton></div>
    </ActionForm>
  );
}
