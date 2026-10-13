"use client";

import { useState } from "react";

/** Employer logo that quietly disappears if the image is missing. */
export function EmployerLogo({ src, name, size = 72 }: { src: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      className="shrink-0 border border-line bg-white object-contain p-1"
      style={{ width: size, height: size }}
    />
  );
}
