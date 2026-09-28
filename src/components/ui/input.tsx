import * as React from "react";

import { cn } from "@/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorMessage?: string;
  containerClassName?: string;
}

/**
 * The shared text-field primitive (design.md P13, DESIGN.md §Forms): a
 * visible label above the field, optional helper text below it, and an
 * optional error message that also flips `aria-invalid` and the border to
 * `destructive`. Follows the button.tsx pattern (cn() last, forwardRef).
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorMessage, id, className, containerClassName, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "border-line-2 bg-background flex h-11 w-full items-center rounded-md border px-3.5 text-sm",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            errorMessage && "border-destructive",
            className,
          )}
          {...props}
        />
        {helperText ? (
          <p id={helperId} className="text-muted-foreground-1 text-xs">
            {helperText}
          </p>
        ) : null}
        {errorMessage ? (
          <p id={errorId} className="text-destructive text-xs">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
