"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children = "保存" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="submit-button" data-pending={pending} type="submit" disabled={pending}>{pending ? "保存中…" : children}</button>;
}
