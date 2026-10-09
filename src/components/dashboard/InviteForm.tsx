"use client";

import { useActionState } from "react";
import { inviteMember } from "@/app/dashboard/actions";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormMessage, SubmitButton } from "@/components/ui/Form";

export function InviteForm({ employerId, canInviteAdmins }: { employerId: string; canInviteAdmins: boolean }) {
  const [state, action] = useActionState(inviteMember, undefined);
  return (
    <form action={action} className="flex max-w-[760px] flex-col gap-4">
      <input type="hidden" name="employer_id" value={employerId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-[1_1_280px]">
          <Field label="Email address" htmlFor="invite-email"><Input id="invite-email" name="email" type="email" required /></Field>
        </div>
        <div className="w-[180px]">
          <Field label="Role" htmlFor="invite-role">
            <Select id="invite-role" name="role" defaultValue="member">
              <option value="member">Member</option>
              {canInviteAdmins && <option value="admin">Admin</option>}
            </Select>
          </Field>
        </div>
        <SubmitButton variant="gold" pendingLabel="Sending…">Send invite</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
