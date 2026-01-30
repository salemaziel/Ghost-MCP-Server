import { z } from 'zod';
import { ghostIdSchema, limitSchema, pageSchema, nqlFilterSchema } from './common.js';

/**
 * Offer Schemas
 * Offers are promotional discounts/trials for Ghost membership tiers
 */

/**
 * Offer type enum
 * - percent: Percentage discount (e.g., 20% off)
 * - fixed: Fixed amount discount (e.g., $10 off)
 * - trial: Free trial period
 */
export const offerTypeSchema = z.enum(['percent', 'fixed', 'trial'], {
  errorMap: () => ({ message: 'Offer type must be percent, fixed, or trial' }),
});

/**
 * Offer cadence enum
 * - month: Monthly billing
 * - year: Annual billing
 */
export const offerCadenceSchema = z.enum(['month', 'year'], {
  errorMap: () => ({ message: 'Cadence must be month or year' }),
});

/**
 * Offer duration enum
 * - once: Apply discount once
 * - repeating: Apply for multiple billing cycles
 * - forever: Apply indefinitely
 * - trial: Free trial period
 */
export const offerDurationSchema = z.enum(['once', 'repeating', 'forever', 'trial'], {
  errorMap: () => ({ message: 'Duration must be once, repeating, forever, or trial' }),
});

/**
 * Currency code validation (ISO 4217)
 * Common currencies: USD, EUR, GBP, etc.
 */
export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO 4217 code')
  .default('USD');

/**
 * Offer code validation
 * Used in redemption URLs (e.g., /offer/SAVE20)
 */
export const offerCodeSchema = z
  .string()
  .min(1, 'Offer code cannot be empty')
  .max(191, 'Offer code cannot exceed 191 characters')
  .regex(
    /^[a-zA-Z0-9-_]+$/,
    'Offer code can only contain letters, numbers, hyphens, and underscores'
  );

/**
 * Query schema for browsing offers
 */
export const offerQuerySchema = z.object({
  limit: limitSchema,
  page: pageSchema,
  filter: nqlFilterSchema,
  order: z.string().optional(),
});

/**
 * Schema for getting a specific offer by ID
 */
export const offerIdSchema = z.object({
  id: ghostIdSchema,
});

/**
 * Schema for creating a new offer
 */
export const createOfferSchema = z.object({
  name: z.string().min(1, 'Offer name is required').max(191, 'Name cannot exceed 191 characters'),
  code: offerCodeSchema,
  display_title: z.string().max(191, 'Display title cannot exceed 191 characters').optional(),
  display_description: z
    .string()
    .max(500, 'Display description cannot exceed 500 characters')
    .optional(),
  type: offerTypeSchema,
  cadence: offerCadenceSchema,
  amount: z.number().int('Amount must be an integer').min(0, 'Amount must be non-negative'),
  duration: offerDurationSchema,
  duration_in_months: z
    .number()
    .int('Duration in months must be an integer')
    .min(1, 'Duration must be at least 1 month')
    .max(60, 'Duration cannot exceed 60 months')
    .optional(),
  currency: currencySchema.optional(),
  tier_id: ghostIdSchema,
});

/**
 * Schema for updating an existing offer
 * Only certain fields can be updated after creation
 */
export const updateOfferSchema = z.object({
  id: ghostIdSchema,
  name: z.string().min(1).max(191).optional(),
  display_title: z.string().max(191).optional(),
  display_description: z.string().max(500).optional(),
  code: offerCodeSchema.optional(),
  // Note: tier_id, type, cadence, amount, duration cannot be changed after creation
});

/**
 * Schema for deleting an offer
 */
export const deleteOfferSchema = z.object({
  id: ghostIdSchema,
});

/**
 * Output schema for offer responses
 * Defines the structure of offer objects returned from Ghost API
 */
export const offerOutputSchema = z.object({
  id: ghostIdSchema,
  name: z.string(),
  code: z.string(),
  display_title: z.string().nullable().optional(),
  display_description: z.string().nullable().optional(),
  type: offerTypeSchema,
  cadence: offerCadenceSchema,
  amount: z.number(),
  duration: offerDurationSchema,
  duration_in_months: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  redemption_count: z.number().optional(),
  tier: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
