export type ToastMessage = {
  id: number;
  title: string;
  message: string;
  details: string[];
  metadata?: string;
};

type ErrorWithDetails = Error & {
  status?: number;
  code?: string;
  requestId?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
};

const listeners = new Set<() => void>();
let messages: ToastMessage[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return messages;
}

export function dismissToast(id: number) {
  messages = messages.filter((message) => message.id !== id);
  emit();
}

export function showRequestError(error: unknown) {
  const requestError = error instanceof Error ? error as ErrorWithDetails : null;
  const id = nextId++;
  const metadata = [
    requestError?.code ? `Code: ${requestError.code}` : null,
    requestError?.status ? `HTTP ${requestError.status}` : null,
    requestError?.requestId ? `Request: ${requestError.requestId}` : null,
  ].filter(Boolean).join(" · ");

  messages = [
    ...messages.slice(-3),
    {
      id,
      title: "Request failed",
      message: requestError?.message ?? "The request could not be completed.",
      details: requestError?.fieldErrors?.map(({ field, message }) => `${field}: ${message}`) ?? [],
      metadata: metadata || undefined,
    },
  ];
  emit();

  globalThis.setTimeout(() => dismissToast(id), 10_000);
}
