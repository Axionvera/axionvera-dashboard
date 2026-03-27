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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/30 p-6 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">Profile Information</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 transition-colors">
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
          <label htmlFor="bio" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 transition-colors">
            Bio
          </label>
          <textarea
            id="bio"
            value={bioProps.value}
            onChange={(e) => bioProps.onChange(e.target.value)}
            onBlur={bioProps.onBlur}
            rows={4}
            className={`
              w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 outline-none ring-0 
              placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none
              ${bioProps.error?.hasError && bioProps.touched
                ? 'border-red-500/70 bg-red-50 dark:bg-red-500/5 text-red-900 dark:text-red-100 focus:border-red-500' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-slate-900 dark:text-white focus:border-axion-500/70 dark:focus:border-axion-500/70'
              }
            `}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          <div className="mt-1 flex justify-between">
            {bioProps.error?.hasError && bioProps.touched ? (
              <p className="text-xs text-red-500 dark:text-red-400">{bioProps.error.message}</p>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">Optional: Brief description about yourself</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
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
