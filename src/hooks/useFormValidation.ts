import { useState, useCallback, useEffect } from 'react';
import { z, ZodSchema } from 'zod';

export interface FormFieldError {
  message: string;
  hasError: boolean;
}

export type FormErrors<T> = {
  [K in keyof T]?: FormFieldError;
};

export interface UseFormValidationProps<T extends Record<string, any>> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
}: UseFormValidationProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({} as FormErrors<T>);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: any) => {
      try {
        const fieldSchema = schema.shape[field as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return { message: '', hasError: false };
        }
        return { message: '', hasError: false };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(err => err.path[0] === field);
          return {
            message: fieldError?.message || 'Invalid value',
            hasError: true,
          };
        }
        return { message: 'Invalid value', hasError: true };
      }
    },
    [schema]
  );

  // Validate entire form
  const validateForm = useCallback(
    (formData: T) => {
      try {
        schema.parse(formData);
        return { isValid: true, errors: {} as FormErrors<T> };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors = {} as FormErrors<T>;
          error.errors.forEach((err) => {
            const field = err.path[0] as keyof T;
            newErrors[field] = {
              message: err.message,
              hasError: true,
            };
          });
          return { isValid: false, errors: newErrors };
        }
        return { isValid: false, errors: {} as FormErrors<T> };
      }
    },
    [schema]
  );

  // Update field value and validate
  const updateField = useCallback(
    (field: keyof T, value: any) => {
      const newValues = { ...values, [field]: value };
      setValues(newValues);
      
      // Mark as dirty and touched
      setIsDirty(true);
      setTouched(prev => ({ ...prev, [field]: true }));
      
      // Validate field if it has been touched
      if (touched[field]) {
        const fieldError = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [field]: fieldError,
        }));
      }
    },
    [values, touched, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched(prev => ({ ...prev, [field]: true }));
      const fieldError = validateField(field, values[field]);
      setErrors(prev => ({
        ...prev,
        [field]: fieldError,
      }));
    },
    [values, validateField]
  );

  // Check if form is valid
  const isValid = useCallback(() => {
    const { isValid } = validateForm(values);
    return isValid;
  }, [values, validateForm]);

  // Check if save button should be disabled
  const shouldDisableSubmit = useCallback(() => {
    return !isDirty || !isValid() || isSubmitting;
  }, [isDirty, isValid, isSubmitting]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const { isValid, errors: validationErrors } = validateForm(values);
    
    if (!isValid) {
      setErrors(validationErrors);
      // Mark all fields as touched to show errors
      const allFieldsTouched = Object.keys(values).reduce((acc, field) => {
        acc[field as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);
      setTouched(allFieldsTouched);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      setIsDirty(false);
      setTouched({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as FormErrors<T>);
    setIsDirty(false);
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Get field props for form inputs
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field],
      onChange: (value: any) => updateField(field, value),
      onBlur: () => handleBlur(field),
      error: errors[field],
      touched: touched[field],
    }),
    [values, updateField, handleBlur, errors, touched]
  );

  return {
    values,
    errors,
    touched,
    isDirty,
    isSubmitting,
    isValid,
    shouldDisableSubmit,
    updateField,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps,
  };
}
