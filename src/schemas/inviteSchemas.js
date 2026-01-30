import { z } from 'zod';
import { ghostIdSchema, emailSchema, nqlFilterSchema, limitSchema, pageSchema } from './common.js';

/**
 * Invite schemas for Ghost CMS staff invitation management
 * Invites are used to add new staff members to Ghost
 */

/**
 * Browse invites query schema
 * Supports pagination and filtering of pending invites
 */
export const inviteQuerySchema = z.object({
  limit: limitSchema,
  page: pageSchema,
  filter: nqlFilterSchema,
  order: z
    .string()
    .regex(/^[a-zA-Z_]+\s+(asc|desc)$/i, 'Order must be in format "field asc" or "field desc"')
    .optional(),
});

/**
 * Create invite schema
 * Requires role_id and email to send staff invitation
 */
export const createInviteSchema = z.object({
  role_id: ghostIdSchema,
  email: emailSchema,
  expires_at: z
    .string()
    .datetime('Expiry must be a valid ISO 8601 datetime')
    .refine(
      (datetime) => {
        const expiryDate = new Date(datetime);
        const now = new Date();
        return expiryDate > now;
      },
      {
        message: 'Expiry date must be in the future',
      }
    )
    .optional(),
  status: z.enum(['pending', 'sent']).default('pending').optional(),
});

/**
 * Delete invite schema
 * Requires invite ID to revoke/delete
 */
export const deleteInviteSchema = z.object({
  id: ghostIdSchema,
});

/**
 * Invite ID schema for lookup
 * Validates 24-character hex Ghost ID
 */
export const inviteIdSchema = ghostIdSchema;

/**
 * Invite output schema
 * Structure returned by Ghost API for invites
 */
export const inviteOutputSchema = z.object({
  id: ghostIdSchema,
  role_id: ghostIdSchema,
  email: emailSchema,
  status: z.enum(['pending', 'sent']),
  expires: z.number().int('Expiry timestamp must be an integer'),
  created_at: z.string().datetime(),
  created_by: ghostIdSchema,
  updated_at: z.string().datetime().nullable(),
  updated_by: ghostIdSchema.nullable(),
});
