"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      className={cardClass(
        "m-auto w-full max-w-sm p-8 shadow-[0_20px_60px_rgba(74,21,75,0.15)] backdrop:bg-ink/40",
      )}
    >
      <h2 className="font-sans text-title font-bold text-ink">{title}</h2>
      <p className="mt-2 font-sans text-body leading-relaxed text-ink-mute">
        {description}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="danger-solid" onClick={onConfirm} disabled={pending}>
          {pending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
