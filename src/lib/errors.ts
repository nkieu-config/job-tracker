export type AiErrorKind =
  | "config"
  | "transport"
  | "timeout"
  | "empty"
  | "malformed"
  | "schema";

const RETRYABLE: ReadonlySet<AiErrorKind> = new Set(["transport", "timeout"]);

const MODEL_OUTPUT: ReadonlySet<AiErrorKind> = new Set([
  "empty",
  "malformed",
  "schema",
]);

export class AiError extends Error {
  readonly kind: AiErrorKind;

  constructor(
    message: string,
    kind: AiErrorKind = "transport",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AiError";
    this.kind = kind;
  }

  get retryable(): boolean {
    return RETRYABLE.has(this.kind);
  }

  get isModelOutputFailure(): boolean {
    return MODEL_OUTPUT.has(this.kind);
  }
}
