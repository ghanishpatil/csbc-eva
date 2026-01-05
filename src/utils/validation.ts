import { z } from 'zod';

/**
 * Validation schemas for frontend form validation
 */

export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password too long');

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name too long')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name contains invalid characters');

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

export const yearSchema = z
  .number()
  .int('Year must be a whole number')
  .min(1, 'Year must be between 1 and 5')
  .max(5, 'Year must be between 1 and 5')
  .optional()
  .nullable();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  phone: phoneSchema,
  institute: z.string().max(200, 'Institute name too long').optional().or(z.literal('')),
  branch: z.string().max(100, 'Branch name too long').optional().or(z.literal('')),
  year: yearSchema,
});

export const updateUserSchema = z.object({
  displayName: displayNameSchema.optional(),
  role: z.enum(['admin', 'captain', 'player']).optional(),
  teamId: z.string().optional().nullable(),
});

/**
 * Validate form data against schema
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}

