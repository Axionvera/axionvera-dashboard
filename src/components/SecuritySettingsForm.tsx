import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { securitySettingsSchema, SecuritySettingsFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';

interface SecuritySettingsFormProps {
  onSubmit?: (data: SecuritySettingsFormData) => Promise<void>;
}

export default function SecuritySettingsForm({ onSubmit }: SecuritySettingsFormProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid, isSubmitting }
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword') || '';
  const hasNewPassword = newPassword.length > 0;

  const handleFormSubmit = async (data: SecuritySettingsFormData) => {
    if (onSubmit) {
      try {
        await onSubmit(data);
        notify.success("Security Updated", "Your security settings have been saved successfully.");
      } catch (error) {
        notify.error("Update Failed", "Could not update security settings.");
      }
    }
  };

  const shouldDisableSubmit = !isDirty || !isValid || isSubmitting;

  return (
    <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Security Settings</h2>
        <p className="mt-1 text-sm text-text-muted">
          Update your password and security preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-4">Change Password</h3>
          
          <FormInput
            {...register('currentPassword')}
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            label="Current Password"
            required
            error={errors.currentPassword}
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.current}
              >
                {showPasswords.current ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </FormInput>

          <FormInput
            {...register('newPassword')}
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            label="New Password"
            required={hasNewPassword}
            error={errors.newPassword}
            helperText={!hasNewPassword ? "Leave blank to keep current password" : "Must be at least 8 characters with uppercase, lowercase, number, and special character"}
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.new}
              >
                {showPasswords.new ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </FormInput>

          <FormInput
            {...register('confirmPassword')}
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            label="Confirm New Password"
            required={hasNewPassword}
            error={errors.confirmPassword}
            helperText={!hasNewPassword ? "Leave blank if not changing password" : "Re-enter your new password to confirm"}
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.confirm}
              >
                {showPasswords.confirm ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </FormInput>
        </div>

        {/* Password Strength Indicator */}
        {hasNewPassword && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-secondary">Password Strength</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={[
                newPassword.length >= 8,
                /[A-Z]/.test(newPassword),
                /[a-z]/.test(newPassword),
                /[0-9]/.test(newPassword),
                /[^A-Za-z0-9]/.test(newPassword)
              ].filter(Boolean).length} aria-label="Password strength">
                <div className={`h-1 flex-1 rounded-full ${
                  newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 flex-1 rounded-full ${
                  /[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 flex-1 rounded-full ${
                  /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 flex-1 rounded-full ${
                  /[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                }`} />
                <div className={`h-1 flex-1 rounded-full ${
                  /[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                }`} />
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 dark:text-slate-500 transition-colors">
                <span>8+ chars</span>
                <span>Upper</span>
                <span>Lower</span>
                <span>Number</span>
                <span>Special</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <button
            type="button"
            aria-label="Cancel password change"
            className="px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={shouldDisableSubmit}
            aria-label={isSubmitting ? 'Updating password' : 'Update password'}
            className="rounded-xl bg-axion-500 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-axion-500/50"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
