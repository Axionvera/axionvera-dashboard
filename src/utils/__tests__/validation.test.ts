import { 
  profileSchema, 
  securitySettingsSchema, 
  settingsSchema, 
  depositSchema, 
  withdrawSchema 
} from '../validation';

describe('validation schemas', () => {
  describe('profileSchema', () => {
    it('should validate a valid profile', () => {
      const validProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        bio: 'Hello world',
        website: 'https://example.com',
        location: 'New York',
      };
      expect(profileSchema.safeParse(validProfile).success).toBe(true);
    });

    it('should fail if names are too short', () => {
      const invalidProfile = {
        firstName: 'J',
        lastName: 'D',
        email: 'john@example.com',
      };
      expect(profileSchema.safeParse(invalidProfile).success).toBe(false);
    });

    it('should fail for invalid email', () => {
      const invalidProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
      };
      expect(profileSchema.safeParse(invalidProfile).success).toBe(false);
    });
  });

  describe('securitySettingsSchema', () => {
    it('should validate when passwords match', () => {
      const valid = {
        currentPassword: 'password123',
        newPassword: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      };
      expect(securitySettingsSchema.safeParse(valid).success).toBe(true);
    });

    it('should fail when passwords do not match', () => {
      const invalid = {
        currentPassword: 'password123',
        newPassword: 'NewPassword1!',
        confirmPassword: 'DifferentPassword1!',
      };
      expect(securitySettingsSchema.safeParse(invalid).success).toBe(false);
    });
    
    it('should allow empty newPassword', () => {
       const valid = {
        currentPassword: 'password123',
        newPassword: '',
        confirmPassword: '',
      };
      expect(securitySettingsSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('depositSchema', () => {
    it('should validate valid amounts', () => {
      expect(depositSchema.safeParse({ amount: '100' }).success).toBe(true);
      expect(depositSchema.safeParse({ amount: '0.1' }).success).toBe(true);
    });

    it('should fail for invalid amounts', () => {
      expect(depositSchema.safeParse({ amount: '0' }).success).toBe(false);
      expect(depositSchema.safeParse({ amount: '-10' }).success).toBe(false);
      expect(depositSchema.safeParse({ amount: '10001' }).success).toBe(false);
      expect(depositSchema.safeParse({ amount: 'abc' }).success).toBe(false);
    });
  });

  describe('withdrawSchema', () => {
    it('should validate valid amounts', () => {
      expect(withdrawSchema.safeParse({ amount: '50' }).success).toBe(true);
    });

    it('should fail for invalid amounts', () => {
      expect(withdrawSchema.safeParse({ amount: '0' }).success).toBe(false);
      expect(withdrawSchema.safeParse({ amount: '10001' }).success).toBe(false);
    });
  });

  describe('settingsSchema', () => {
    it('should validate valid settings', () => {
      const valid = {
        email: 'test@example.com',
        notifications: {
          email: true,
          push: false,
          marketing: true,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: true,
          showLocation: false,
        },
        theme: 'dark',
        language: 'en',
      };
      expect(settingsSchema.safeParse(valid).success).toBe(true);
    });
  });
});
