import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import {
  securitySettingsSchema,
  securityPrefsSchema,
  SecuritySettingsFormData,
  SecurityPrefs,
  SECURITY_PREFS_KEY,
} from '@/utils/validation';
import { notify } from '@/utils/notifications';

const DEFAULT_PREFS: SecurityPrefs = {
  requireConfirmationModal: true,
  emailNotifications: false,
  trustedAddresses: [],
};

function loadPrefs(): SecurityPrefs {
  try {
    const raw = localStorage.getItem(SECURITY_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = securityPrefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: SecurityPrefs) {
  localStorage.setItem(SECURITY_PREFS_KEY, JSON.stringify(prefs));
}

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-text-primary cursor-pointer">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-axion-500/50
          ${checked ? 'bg-axion-500' : 'bg-background-secondary'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transform transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

interface SecuritySettingsFormProps {
  onSubmit?: (data: SecuritySettingsFormData) => Promise<void>;
}

export default function SecuritySettingsForm({ onSubmit }: SecuritySettingsFormProps) {
  const [prefs, setPrefs] = useState<SecurityPrefs>(DEFAULT_PREFS);
  const [newAddress, setNewAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid, isSubmitting },
    formState: { errors, isSubmitting },
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') || '';
  const hasNewPassword = newPassword.length > 0;
  const shouldDisableSubmit = !isValid || !isDirty || isSubmitting;

  function updatePref<K extends keyof SecurityPrefs>(key: K, value: SecurityPrefs[K]) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated); // optimistic
    savePrefs(updated);
  }

  function addAddress() {
    const addr = newAddress.trim();
    if (!addr) return;
    if (prefs.trustedAddresses.includes(addr)) {
      setAddressError('Address already added');
      return;
    }
    setAddressError('');
    updatePref('trustedAddresses', [...prefs.trustedAddresses, addr]);
    setNewAddress('');
  }

  function removeAddress(addr: string) {
    updatePref('trustedAddresses', prefs.trustedAddresses.filter((a) => a !== addr));
  }

  const handleFormSubmit = async (data: SecuritySettingsFormData) => {
    if (onSubmit) await onSubmit(data);
    notify.success('Password Updated', 'Your password has been changed successfully.');
  };

  const toggleVisibility = (field: keyof typeof showPasswords) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

  return (
    <div className="space-y-6">
      {/* Security Preferences */}
      <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-text-primary">Security Preferences</h2>
          <p className="mt-1 text-sm text-text-muted">Changes are saved automatically.</p>
        </div>
        <div className="divide-y divide-border-primary">
          <Toggle
            id="requireConfirmationModal"
            label="Require confirmation before signing"
            description="Show a confirmation modal before submitting any transaction (Issue #21)."
            checked={prefs.requireConfirmationModal}
            onChange={(v) => updatePref('requireConfirmationModal', v)}
          />
          <Toggle
            id="emailNotifications"
            label="Email notifications"
            description="Receive email alerts for deposits, withdrawals, and security events."
            checked={prefs.emailNotifications}
            onChange={(v) => updatePref('emailNotifications', v)}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit || (() => {}))} className="space-y-6">
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
                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.current}
              >
                {showPasswords.current ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
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
            helperText={
              !hasNewPassword
                ? 'Leave blank to keep current password'
                : 'Must be at least 8 characters with uppercase, lowercase, number, and special character'
            }
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.new}
              >
                {showPasswords.new ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
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
            helperText={
              !hasNewPassword
                ? 'Leave blank if not changing password'
                : 'Re-enter your new password to confirm'
            }
          >
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                aria-pressed={showPasswords.confirm}
              >
                {showPasswords.confirm ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
      {/* Trusted Withdrawal Addresses */}
      <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Trusted Withdrawal Addresses</h2>
          <p className="mt-1 text-sm text-text-muted">
            Withdrawals to these addresses skip the extra confirmation step.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => { setNewAddress(e.target.value); setAddressError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAddress())}
            placeholder="Stellar address (G…)"
            aria-label="New trusted address"
            aria-describedby={addressError ? 'address-error' : undefined}
            aria-invalid={!!addressError}
            className="flex-1 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-axion-500/50 focus:border-axion-500"
          />
          <button
            type="button"
            onClick={addAddress}
            className="rounded-xl bg-axion-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-axion-400 focus:outline-none focus:ring-2 focus:ring-axion-500/50"
          >
            Add
          </button>
        </div>
        {addressError && (
          <p id="address-error" className="mt-1.5 text-xs text-red-500">{addressError}</p>
        )}

        {prefs.trustedAddresses.length > 0 && (
          <ul className="mt-4 space-y-2" aria-label="Trusted addresses">
            {prefs.trustedAddresses.map((addr) => (
              <li
                key={addr}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-2.5"
              >
                <span className="truncate font-mono text-xs text-text-secondary">{addr}</span>
                <button
                  type="button"
                  onClick={() => removeAddress(addr)}
                  aria-label={`Remove ${addr}`}
                  className="shrink-0 text-text-muted transition hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
          <p className="mt-1 text-sm text-text-muted">Update your account password.</p>
        </div>

        {/* Password Strength Indicator */}
        {hasNewPassword && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-text-secondary">Password Strength</div>
            <div className="space-y-1">
              <div
                className="flex items-center gap-2"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={
                  [
                    (newPassword || '').length >= 8,
                    /[A-Z]/.test(newPassword || ''),
                    /[a-z]/.test(newPassword || ''),
                    /[0-9]/.test(newPassword || ''),
                    /[^A-Za-z0-9]/.test(newPassword || ''),
                  ].filter(Boolean).length
                }
                aria-label="Password strength"
              >
                <div
                  className={`h-1 flex-1 rounded-full ${
                    newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    /[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    /[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    /[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
                <div
                  className={`h-1 flex-1 rounded-full ${
                    /[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 dark:text-slate-500 transition-colors">
                <span>8+ chars</span>
                <span>Upper</span>
                <span>Lower</span>
                <span>Number</span>
                <span>Special</span>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {(['current', 'new', 'confirm'] as const).map((field) => {
            const fieldKey = field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword';
            const label = field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password';
            const visible = showPasswords[field];
            return (
              <FormInput
                key={field}
                {...register(fieldKey)}
                id={fieldKey}
                type={visible ? 'text' : 'password'}
                label={label}
                required={field === 'current' || hasNewPassword}
                error={errors[fieldKey]}
                helperText={
                  field === 'new' && !hasNewPassword ? 'Leave blank to keep current password' : undefined
                }
              >
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field)}
                    className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50 rounded-lg p-1"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                  >
                    <EyeIcon visible={visible} />
                  </button>
                </div>
              </FormInput>
            );
          })}

          {hasNewPassword && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-secondary">Password Strength</p>
              <div
                className="flex gap-1"
                role="progressbar"
                aria-label="Password strength"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={[
                  newPassword.length >= 8,
                  /[A-Z]/.test(newPassword),
                  /[a-z]/.test(newPassword),
                  /[0-9]/.test(newPassword),
                  /[^A-Za-z0-9]/.test(newPassword),
                ].filter(Boolean).length}
              >
                {[
                  newPassword.length >= 8,
                  /[A-Z]/.test(newPassword),
                  /[a-z]/.test(newPassword),
                  /[0-9]/.test(newPassword),
                  /[^A-Za-z0-9]/.test(newPassword),
                ].map((met, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${met ? 'bg-green-500' : 'bg-slate-700'}`} />
                ))}
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
            disabled={!isDirty || !isValid || isSubmitting}
            aria-label={isSubmitting ? 'Updating password' : 'Update password'}
            className="rounded-xl bg-axion-500 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-axion-500/50"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label={isSubmitting ? 'Updating password' : 'Update password'}
              className="rounded-xl bg-axion-500 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-axion-500/50"
            >
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
