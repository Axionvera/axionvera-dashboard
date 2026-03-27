import { FormInput } from './FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { profileSchema, ProfileFormData } from '@/utils/validation';

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onSubmit?: (data: ProfileFormData) => Promise<void>;
}

export default function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const initialValues: ProfileFormData = {
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    bio: initialData?.bio || '',
    website: initialData?.website || '',
    location: initialData?.location || '',
  };

  const {
    getFieldProps,
    shouldDisableSubmit,
    isSubmitting,
    handleSubmit,
  } = useFormValidation({
    schema: profileSchema,
    initialValues,
    onSubmit,
  });

  const firstNameProps = getFieldProps('firstName');
  const lastNameProps = getFieldProps('lastName');
  const emailProps = getFieldProps('email');
  const bioProps = getFieldProps('bio');
  const websiteProps = getFieldProps('website');
  const locationProps = getFieldProps('location');

  return (
    <div className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-muted">
          Update your personal information and profile details.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            {...firstNameProps}
            id="firstName"
            label="First Name"
            required
          />
          
          <FormInput
            {...lastNameProps}
            id="lastName"
            label="Last Name"
            required
          />
        </div>

        <FormInput
          {...emailProps}
          id="email"
          type="email"
          label="Email Address"
          required
          helperText="We'll never share your email with anyone else."
        />

        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-text-secondary mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bioProps.value}
            onChange={(e) => bioProps.onChange(e.target.value)}
            onBlur={bioProps.onBlur}
            rows={4}
            className={`
              w-full rounded-xl border px-4 py-3 text-sm text-text-primary outline-none ring-0 
              placeholder:text-slate-500 transition-colors resize-none
              ${bioProps.error?.hasError && bioProps.touched
                ? 'border-red-500/70 bg-red-500/5 focus:border-red-500' 
                : 'border-border-primary bg-background-secondary/30 focus:border-axion-500/70'
              }
            `}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <div className="mt-1 flex justify-between">
            {bioProps.error?.hasError && bioProps.touched ? (
              <p className="text-xs text-red-400">{bioProps.error.message}</p>
            ) : (
              <p className="text-xs text-slate-500">Optional: Brief description about yourself</p>
            )}
            <p className="text-xs text-slate-500">
              {bioProps.value.length}/500
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            {...websiteProps}
            id="website"
            type="url"
            label="Website"
            placeholder="https://example.com"
            helperText="Optional: Your personal or professional website"
          />
          
          <FormInput
            {...locationProps}
            id="location"
            label="Location"
            placeholder="City, Country"
            helperText="Optional: Your current location"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={shouldDisableSubmit()}
            className="rounded-xl bg-axion-500 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
