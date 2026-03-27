import { forwardRef } from 'react';
import { FormFieldError } from '@/hooks/useFormValidation';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FormFieldError;
  touched?: boolean;
  helperText?: string;
  children?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, helperText, children, className = '', ...props }, ref) => {
    const hasError = error?.hasError && touched;
    const showError = hasError && error?.message;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label 
            htmlFor={props.id}
            className={`text-xs font-medium transition-colors duration-300 ${
              hasError ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 outline-none ring-0 
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              ${hasError 
                ? 'border-red-500/70 bg-red-50 dark:bg-red-500/5 text-red-900 dark:text-red-100 focus:border-red-500' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-slate-900 dark:text-white focus:border-axion-500/70 dark:focus:border-axion-500/70'
              }
              ${children ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {children}
        </div>
        
        <div className="min-h-[1.25rem]">
          {showError ? (
            <p className="text-xs text-red-500 dark:text-red-400">{error.message}</p>
          ) : helperText && !touched ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors uppercase tracking-wider font-semibold opacity-70" style={{ fontSize: '10px' }}>{helperText}</p>
          ) : null}
        </div>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
