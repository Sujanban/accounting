import { Dialog, Flex } from "@radix-ui/themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type PromptDialogOptions = ConfirmDialogOptions & {
  inputLabel: string;
  inputPlaceholder?: string;
};

type ActiveDialog =
  | (ConfirmDialogOptions & { kind: "confirm" })
  | (PromptDialogOptions & { kind: "prompt" });

type DialogResult = boolean | string | null;

export function useActionDialog() {
  const [request, setRequest] = useState<ActiveDialog | null>(null);
  const [inputValue, setInputValue] = useState("");
  const resolveRef = useRef<((value: DialogResult) => void) | null>(null);

  const finish = useCallback((value: DialogResult) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
    setInputValue("");
  }, []);

  useEffect(() => () => resolveRef.current?.(null), []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    resolveRef.current?.(false);
    setInputValue("");
    setRequest({ ...options, kind: "confirm" });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = (value) => resolve(value === true);
    });
  }, []);

  const prompt = useCallback((options: PromptDialogOptions) => {
    resolveRef.current?.(null);
    setInputValue("");
    setRequest({ ...options, kind: "prompt" });
    return new Promise<string | null>((resolve) => {
      resolveRef.current = (value) => resolve(typeof value === "string" ? value : null);
    });
  }, []);

  const dialog = (
    <Dialog.Root
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) finish(request?.kind === "confirm" ? false : null);
      }}
    >
      <Dialog.Content className="action-dialog" maxWidth="440px">
        <Dialog.Title>{request?.title}</Dialog.Title>
        <Dialog.Description mt="2">{request?.description}</Dialog.Description>
        {request?.kind === "prompt" ? (
          <label className="action-dialog__field">
            {request.inputLabel}
            <textarea
              autoFocus
              rows={3}
              value={inputValue}
              placeholder={request.inputPlaceholder}
              onChange={(event) => setInputValue(event.target.value)}
            />
          </label>
        ) : null}
        <Flex justify="end" gap="3" mt="5">
          <Button type="button" variant="outline" onClick={() => finish(request?.kind === "confirm" ? false : null)}>
            Cancel
          </Button>
          <Button
            type="button"
            className={request?.destructive ? "action-dialog__confirm--destructive" : undefined}
            disabled={request?.kind === "prompt" && !inputValue.trim()}
            onClick={() => finish(request?.kind === "prompt" ? inputValue.trim() : true)}
          >
            {request?.confirmLabel ?? "Confirm"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );

  return { confirm, prompt, dialog };
}
