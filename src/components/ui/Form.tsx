"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export type ActionState = { error?: string; ok?: string } | undefined;

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  name,
  value,
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "gold" | "secondary" | "danger" | "link";
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-ink text-white hover:bg-black hover:text-white px-5 py-3",
    gold: "bg-gold text-white hover:bg-gold-dark hover:text-white px-5 py-3",
    secondary: "border-[1.5px] border-ink bg-paper px-5 py-[10.5px] hover:text-gold",
    danger: "border-[1.5px] border-[#9b1c1c] text-[#9b1c1c] bg-paper px-5 py-[10.5px] hover:bg-[#fdf2f2]",
    link: "underline underline-offset-[3px] hover:text-gold",
  }[variant];
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`font-semibold disabled:cursor-wait disabled:opacity-60 ${styles} ${className}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="border-l-[3px] border-[#9b1c1c] bg-[#fdf2f2] px-4 py-3 text-[15px] text-[#7a1616]">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="border-l-[3px] border-gold bg-gold-tint px-4 py-3 text-[15px]">
        {state.ok}
      </p>
    );
  return null;
}
