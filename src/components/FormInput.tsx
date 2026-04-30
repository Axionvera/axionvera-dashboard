import { forwardRef } from "react";
import type { FieldError } from "react-hook-form";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: FieldError;
  touched?: boolean;
  error?: FieldError | { message: string };
  helperText?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched = false, helperText, className = "", id, ...props }, ref) => {
    const hasError = Boolean(error);
    const showError = hasError && (touched || props["aria-invalid"] === true || props["aria-invalid"] === "true");
    const inputId =
      id ??
      (typeof label === "string" ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : "input-field");
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy = [showError ? errorId : null, helperText && !showError ? helperId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex w-full flex-col gap-2">
        {label ? (
  isTouched?: boolean;
  children?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className = '', touched, ...props }, ref) => {
  ({ label, error, touched, helperText, children, className = '', id, ...props }, ref) => {
  ({ label, error, helperText, isTouched, children, className = '', ...props }, ref) => {
    const hasError = !!error;

    const inputId =
      props.id ||
      `input-${typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : Math.random().toString(36).slice(2)}`;
    const inputId = id || `input-${typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'field'}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const showError = hasError;

    const inputId = props.id || `input-${label?.toString().toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`text-xs font-medium ${
              hasError ? "text-red-500 dark:text-red-400" : "text-text-secondary"
            }`}
          >
            {label}
            {props.required && (
              <span className="text-red-500 dark:text-red-400 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={
            `${hasError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined
          }
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={`${showError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
            className={`
              w-full rounded-xl border px-4 py-3 text-sm text-text-primary
              transition-all duration-200
              placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-axion-500/50 focus:border-axion-500
              ${hasError
                ? 'border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border-primary bg-background-secondary/30'
              }
              ${className}
            `}
            {...props}
          />
          {children}
        </div>

        <div className="min-h-[1.25rem]">
          {showError ? (
            <p id={errorId} className="text-xs text-red-500 dark:text-red-400 font-medium">{error!.message}</p>
          ) : helperText && !touched ? (
        
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full rounded-xl border px-4 py-3 text-sm text-text-primary transition-all duration-200",
            "placeholder:text-text-muted focus:border-axion-500 focus:outline-none focus:ring-2 focus:ring-axion-500/50",
            hasError
              ? "border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20"
              : "border-border-primary bg-background-secondary/30",
            className
          ]
            .filter(Boolean)
            .join(" ")}
          aria-describedby={`${hasError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
          className={`
            w-full rounded-xl border px-4 py-3 text-sm text-text-primary 
            transition-all duration-200
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-axion-500/50 focus:border-axion-500
            ${
              hasError
                ? 'border-red-500/70 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border-primary bg-background-secondary/30'
            }
            ${className}
          `}
          {...props}
        />

        <div className="min-h-[1.25rem]">
          {showError ? (
            <p id={errorId} className="text-xs font-medium text-red-500 dark:text-red-400">
              {error?.message}
            </p>
          ) : helperText ? (
            <p id={helperId} className="text-xs text-text-muted">
              {helperText}
            </p>
          {hasError ? (
            <p id={errorId} className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errorMessage}
            </p>
          ) : helperText && !touched ? (
            <p id={helperId} className="text-xs text-text-muted">
              {helperText}
            </p>
            <p id={errorId} className="text-xs text-red-500 dark:text-red-400 font-medium">{errorMessage}</p>
          ) : helperText && !isTouched ? (
            <p id={helperId} className="text-xs text-text-muted">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
