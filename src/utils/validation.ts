import { z } from 'zod';

// Base validation schemas
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Profile form schema
export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  website: z
    .string()
    .url('Invalid website URL')
    .or(z.literal(''))
    .optional(),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
});

// Security settings schema with password confirmation
export const securitySettingsSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: passwordSchema.optional().or(z.literal('')),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, confirmPassword must match
      if (data.newPassword && data.newPassword.length > 0) {
        return data.confirmPassword === data.newPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => {
      // If confirmPassword is provided, newPassword must match
      if (data.confirmPassword && data.confirmPassword.length > 0) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['newPassword'],
    }
  );

// Settings form schema
export const settingsSchema = z.object({
  email: emailSchema,
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']),
    showEmail: z.boolean(),
    showLocation: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(1, 'Language is required'),
});

// Deposit/Withdraw form schemas
export const createDepositSchema = (walletBalance: number | null) =>
  z.object({
    amount: z.coerce
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a valid number',
      })
      .positive('Amount must be greater than 0')
      .max(10000, 'Amount cannot exceed 10,000')
      .refine(
        (val) => walletBalance === null || val <= walletBalance,
        (val) => ({
          message: `Amount exceeds your wallet balance of ${walletBalance}`,
        })
      ),
  });

export const depositSchema = createDepositSchema(null);

export const createWithdrawSchema = (maxBalance: number) =>
  z.object({
    amount: z.coerce
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a valid number',
      })
      .positive('Amount must be greater than 0')
      .max(maxBalance, `Amount cannot exceed your vault balance of ${maxBalance}`),
  });

export const withdrawSchema = createWithdrawSchema(10000); // Default for types

// Security preferences (persisted to localStorage)
export const SECURITY_PREFS_KEY = 'axionvera_security_prefs';

export const securityPrefsSchema = z.object({
  requireConfirmationModal: z.boolean(),
  emailNotifications: z.boolean(),
  trustedAddresses: z.array(z.string()),
});

// Type exports
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type DepositFormData = z.infer<typeof depositSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type SecurityPrefs = z.infer<typeof securityPrefsSchema>;
