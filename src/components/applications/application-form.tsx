"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
} from "@/lib/schemas/application";
import { Button, buttonClass } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/form-styles";
import { useToast } from "@/components/ui/toast";
import { autofillFromJd, type FormState } from "@/actions/applications";

export type ApplicationFormValues = {
  company?: string;
  role?: string;
  status?: string;
  jobUrl?: string;
  deadline?: string; // yyyy-mm-dd
  jobDescription?: string;
  notes?: string;
};

function FieldError({ name, messages }: { name: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <span
      id={`${name}-error`}
      role="alert"
      className="text-fine font-sans text-semantic-error"
    >
      {messages[0]}
    </span>
  );
}

export function ApplicationForm({
  action,
  defaultValues = {},
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: ApplicationFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors;
  const values = { ...defaultValues, ...state.values };

  const toast = useToast();
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const [jdLength, setJdLength] = useState(
    (values.jobDescription ?? "").trim().length,
  );
  const [autofilling, startAutofill] = useTransition();
  const [autofillError, setAutofillError] = useState<string | null>(null);

  // Fill only fields the user hasn't touched, so re-running never clobbers an
  // edit. The form is uncontrolled, so we read and write the DOM values through
  // refs; on submit the FormData picks them up like anything typed by hand.
  function onAutofill() {
    setAutofillError(null);
    startAutofill(async () => {
      const result = await autofillFromJd(jobDescriptionRef.current?.value ?? "");
      if (result.error) {
        setAutofillError(result.error);
        return;
      }
      if (!result.fields) return;

      const filled: string[] = [];
      const fillIfEmpty = (
        ref: React.RefObject<HTMLInputElement | null>,
        value: string | null,
        label: string,
      ) => {
        const el = ref.current;
        if (value && el && el.value.trim() === "") {
          el.value = value;
          filled.push(label);
        }
      };
      fillIfEmpty(companyRef, result.fields.company, "company");
      fillIfEmpty(roleRef, result.fields.role, "role");
      fillIfEmpty(deadlineRef, result.fields.deadline, "deadline");

      toast(
        filled.length
          ? `Filled ${filled.join(", ")} from the description.`
          : "Those fields already have values — nothing to fill.",
      );
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Company
          <input
            ref={companyRef}
            name="company"
            defaultValue={values.company}
            required
            aria-invalid={fe?.company ? true : undefined}
            aria-describedby={fe?.company ? "company-error" : undefined}
            className={inputClass}
          />
          <FieldError name="company" messages={fe?.company} />
        </label>

        <label className={labelClass}>
          Role
          <input
            ref={roleRef}
            name="role"
            defaultValue={values.role}
            required
            aria-invalid={fe?.role ? true : undefined}
            aria-describedby={fe?.role ? "role-error" : undefined}
            className={inputClass}
          />
          <FieldError name="role" messages={fe?.role} />
        </label>

        <label className={labelClass}>
          Status
          <select
            name="status"
            defaultValue={values.status ?? "SAVED"}
            aria-invalid={fe?.status ? true : undefined}
            aria-describedby={fe?.status ? "status-error" : undefined}
            className={inputClass}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <FieldError name="status" messages={fe?.status} />
        </label>

        <label className={labelClass}>
          Deadline
          <input
            ref={deadlineRef}
            type="date"
            name="deadline"
            defaultValue={values.deadline}
            aria-invalid={fe?.deadline ? true : undefined}
            aria-describedby={fe?.deadline ? "deadline-error" : undefined}
            className={inputClass}
          />
          <FieldError name="deadline" messages={fe?.deadline} />
        </label>
      </div>

      <label className={labelClass}>
        Job URL
        <input
          type="url"
          name="jobUrl"
          defaultValue={values.jobUrl}
          placeholder="https://…"
          aria-invalid={fe?.jobUrl ? true : undefined}
          aria-describedby={fe?.jobUrl ? "jobUrl-error" : undefined}
          className={inputClass}
        />
        <FieldError name="jobUrl" messages={fe?.jobUrl} />
      </label>

      <div className={labelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="jobDescription">Job description</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAutofill}
            disabled={autofilling || jdLength < 40}
            aria-describedby={autofillError ? "autofill-error" : undefined}
          >
            <Wand2
              size={14}
              aria-hidden="true"
              className={autofilling ? "animate-pulse" : undefined}
            />
            {autofilling ? "Reading…" : "Auto-fill from description"}
          </Button>
        </div>
        <textarea
          ref={jobDescriptionRef}
          id="jobDescription"
          name="jobDescription"
          defaultValue={values.jobDescription}
          onInput={(e) => setJdLength(e.currentTarget.value.trim().length)}
          rows={6}
          aria-invalid={fe?.jobDescription ? true : undefined}
          aria-describedby={
            fe?.jobDescription ? "jobDescription-error" : undefined
          }
          className={inputClass}
        />
        {autofillError && (
          <span
            id="autofill-error"
            role="alert"
            className="text-fine font-sans text-semantic-error"
          >
            {autofillError}
          </span>
        )}
        <div className="text-caption font-sans text-ink bg-canvas-lavender px-3 py-2 rounded-lg border border-hairline flex items-start gap-2 mt-1 shadow-sm">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span><b>Pro Tip:</b> Paste the full job description, then <b>Auto-fill</b> to set the company and role — and unlock AI Skills Analysis and Resume Fit Scoring.</span>
        </div>
        <FieldError name="jobDescription" messages={fe?.jobDescription} />
      </div>

      <label className={labelClass}>
        Notes
        <textarea
          name="notes"
          defaultValue={values.notes}
          rows={3}
          aria-invalid={fe?.notes ? true : undefined}
          aria-describedby={fe?.notes ? "notes-error" : undefined}
          className={inputClass}
        />
        <FieldError name="notes" messages={fe?.notes} />
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-semantic-error-tint px-3 py-2 text-body font-sans text-semantic-error"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className={buttonClass({ variant: "secondary", size: "lg" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
