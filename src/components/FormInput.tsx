import { forwardRef } from 'react';
import { FormFieldError } from '@/hooks/useFormValidation';

// Support both our custom validation and react-hook-form
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: FormFieldError | { message?: string };
  touched?: boolean;
  helperText?: React.ReactNode;
  children?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, helperText, children, className = '', ...props }, ref) => {
    // Determine error state from either our custom hook or react-hook-form
    const hasError = error ? (('hasError' in error) ? (error.hasError && touched) : true) : false;
    const errorMessage = error?.message;
    const shouldDisplayError = !!(hasError && errorMessage);
    
    const { onChange, ...inputProps } = props;

    const inputId = props.id || `input-${label?.toString().toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className={`text-xs font-medium ${
              hasError ? 'text-red-500 dark:text-red-400' : 'text-text-secondary'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={`${shouldDisplayError ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
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
          {...inputProps}
          onChange={(event) => {
            if (props.name) {
              onChange?.(event);
            } else {
              onChange?.(event.target.value as never);
            }
          }}
        />
        
        <div className="min-h-[1.25rem]">
          {shouldDisplayError ? (
            <p id={errorId} className="text-xs text-red-500 dark:text-red-400 font-medium">{errorMessage}</p>
          ) : helperText && !touched ? (
            <p id={helperId} className="text-xs text-text-muted">{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
