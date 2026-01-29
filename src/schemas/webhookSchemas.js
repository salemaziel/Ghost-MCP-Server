import { z } from 'zod';
import { ghostIdSchema, urlSchema } from './common.js';

/**
 * Webhook schemas for Ghost CMS webhook management
 * Webhooks notify external services of Ghost events
 */

/**
 * Valid Ghost webhook events
 * Complete list of events that can trigger webhooks
 */
export const webhookEventSchema = z.enum(
  [
    // Post events
    'post.published',
    'post.added',
    'post.deleted',
    'post.edited',
    'post.published.edited',
    'post.unpublished',
    'post.scheduled',
    'post.unscheduled',
    'post.rescheduled',
    // Page events
    'page.published',
    'page.added',
    'page.deleted',
    'page.edited',
    'page.published.edited',
    'page.unpublished',
    'page.scheduled',
    'page.unscheduled',
    'page.rescheduled',
    // Tag events
    'tag.added',
    'tag.edited',
    'tag.deleted',
    // Member events
    'member.added',
    'member.edited',
    'member.deleted',
    // Site events
    'site.changed',
  ],
  {
    errorMap: () => ({ message: 'Invalid webhook event type' }),
  }
);

/**
 * Create webhook schema
 * Required: event, target_url
 * Optional: name, secret, api_version, integration_id
 */
export const createWebhookSchema = z.object({
  event: webhookEventSchema,
  target_url: urlSchema.refine(
    (url) => {
      // In production, webhooks should use HTTPS
      // In development, allow HTTP for local testing
      if (process.env.NODE_ENV === 'production') {
        return url.startsWith('https://');
      }
      return true;
    },
    {
      message: 'Webhook target_url must use HTTPS in production',
    }
  ),
  name: z
    .string()
    .min(1, 'Webhook name cannot be empty')
    .max(191, 'Webhook name cannot exceed 191 characters')
    .optional(),
  secret: z
    .string()
    .min(8, 'Webhook secret must be at least 8 characters')
    .max(191, 'Webhook secret cannot exceed 191 characters')
    .optional(),
  api_version: z
    .string()
    .regex(/^v\d+(\.\d+)?$/, 'API version must be in format v5 or v5.0')
    .optional(),
  integration_id: ghostIdSchema.optional(),
});

/**
 * Update webhook schema
 * All fields optional except id
 */
export const updateWebhookSchema = z
  .object({
    id: ghostIdSchema,
    event: webhookEventSchema.optional(),
    target_url: urlSchema.optional(),
    name: z
      .string()
      .min(1, 'Webhook name cannot be empty')
      .max(191, 'Webhook name cannot exceed 191 characters')
      .optional(),
    api_version: z
      .string()
      .regex(/^v\d+(\.\d+)?$/, 'API version must be in format v5 or v5.0')
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one field besides id is provided
      const { id: _id, ...updates } = data;
      return Object.keys(updates).length > 0;
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

/**
 * Delete webhook schema
 * Requires webhook ID
 */
export const deleteWebhookSchema = z.object({
  id: ghostIdSchema,
});

/**
 * Webhook output schema
 * Structure returned by Ghost API
 */
export const webhookOutputSchema = z.object({
  id: ghostIdSchema,
  event: webhookEventSchema,
  target_url: urlSchema,
  name: z.string().nullable(),
  secret: z.string().nullable(),
  api_version: z.string(),
  integration_id: ghostIdSchema,
  status: z.enum(['available', 'unavailable']),
  last_triggered_at: z.string().datetime().nullable(),
  last_triggered_status: z.string().nullable(),
  last_triggered_error: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});
