import { EyeClosedIcon, EyeOpenIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Select, Text, TextField } from "@radix-ui/themes";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

type FieldFrameProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  disabled?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

export function FieldFrame({ label, description, error, required = false, optionalLabel = "Optional", disabled = false, children }: FieldFrameProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`form-field ${disabled ? "opacity-60" : ""}`}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <Text as="label" htmlFor={id} size="2" weight="medium">
          {label}{required ? <span aria-hidden="true" className="ml-1 text-red-600">*</span> : null}
        </Text>
        {!required ? <Text size="1" color="gray">{optionalLabel}</Text> : null}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {description && !error ? <Text as="p" id={descriptionId} color="gray" size="1" mt="1">{description}</Text> : null}
      {error ? <Text as="p" id={errorId} color="red" size="1" mt="1" role="alert" className="flex items-center gap-1"><ExclamationTriangleIcon aria-hidden="true" />{error}</Text> : null}
    </div>
  );
}

type FormTextFieldProps = Omit<ComponentProps<typeof TextField.Root>, "id" | "aria-describedby" | "aria-invalid"> & {
  label: string;
  description?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  optionalLabel?: string;
  showPasswordToggle?: boolean;
};

export function FormTextField({ label, description, error, startAdornment, endAdornment, optionalLabel, required, disabled, size, showPasswordToggle = false, type, className, ...inputProps }: FormTextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";
  const resolvedType = showPasswordToggle && isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <FieldFrame label={label} description={description} error={error} required={required} optionalLabel={optionalLabel} disabled={disabled}>
      {({ id, describedBy, invalid }) => (
        <TextField.Root {...inputProps} className={`w-full ${className ?? ""}`} id={id} type={resolvedType} size={size ?? "3"} required={required} disabled={disabled} aria-describedby={describedBy} aria-invalid={invalid || undefined} color={invalid ? "red" : undefined}>
          {startAdornment ? <TextField.Slot side="left">{startAdornment}</TextField.Slot> : null}
          {showPasswordToggle && isPasswordField ? <TextField.Slot side="right"><button type="button" className="cursor-pointer text-slate-500 hover:text-slate-900 focus-visible:outline-none" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible}>{isPasswordVisible ? <EyeClosedIcon aria-hidden="true" /> : <EyeOpenIcon aria-hidden="true" />}</button></TextField.Slot> : endAdornment ? <TextField.Slot side="right">{endAdornment}</TextField.Slot> : null}
        </TextField.Root>
      )}
    </FieldFrame>
  );
}

type SelectOption = { value: string; label: string };
type FormSelectProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  description?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  optionalLabel?: string;
};

export function FormSelect({ label, value, onValueChange, options, description, error, placeholder, required, disabled, optionalLabel }: FormSelectProps) {
  return (
    <FieldFrame label={label} description={description} error={error} required={required} disabled={disabled} optionalLabel={optionalLabel}>
      {({ id, describedBy, invalid }) => (
        <Select.Root value={value} onValueChange={onValueChange} disabled={disabled} required={required}>
          <Select.Trigger className="form-select-trigger" id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} color={invalid ? "red" : undefined} placeholder={placeholder} />
          <Select.Content>{options.map((option) => <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>)}</Select.Content>
        </Select.Root>
      )}
    </FieldFrame>
  );
}
