import { z } from 'zod';
import {
  emailSchema,
  urlSchema,
  slugSchema,
  ghostIdSchema,
  nqlFilterSchema,
  limitSchema,
  pageSchema,
} from './common.js';

/**
 * User Schemas for Ghost Staff Management
 *
 * Users represent Ghost staff members (authors, editors, administrators).
 * Note: Ghost does not support user creation via API - use invites instead.
 */

// ----- Query Parameters -----

/**
 * User query options schema for browsing/filtering users
 */
export const userQuerySchema = z
  .object({
    limit: limitSchema.optional(),
    page: pageSchema.optional(),
    filter: nqlFilterSchema.optional(),
    order: z
      .string()
      .regex(/^[a-zA-Z_]+\s+(asc|desc)$/i, 'Order must be in format "field asc" or "field desc"')
      .optional(),
    include: z
      .string()
      .regex(/^(roles|count\.posts)$/, 'Include must be "roles" or "count.posts"')
      .optional(),
  })
  .strict();

/**
 * User ID schema for reading/updating/deleting users
 */
export const userIdSchema = z.object({
  id: ghostIdSchema,
});

/**
 * User slug schema (alternative to ID for reading)
 */
export const userSlugSchema = z.object({
  slug: slugSchema,
});

/**
 * User email schema (alternative to ID for reading)
 */
export const userEmailSchema = z.object({
  email: emailSchema,
});

// ----- Update Schema -----

/**
 * Update user schema
 * Allows updating user profile information
 * Note: Cannot create users via API, only update existing ones
 */
export const updateUserSchema = z
  .object({
    id: ghostIdSchema,
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(191, 'Name cannot exceed 191 characters')
      .optional(),
    slug: slugSchema.optional(),
    email: emailSchema.optional(),
    bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
    location: z.string().max(150, 'Location cannot exceed 150 characters').optional(),
    website: urlSchema.optional(),
    facebook: z.string().max(150, 'Facebook cannot exceed 150 characters').optional(),
    twitter: z.string().max(150, 'Twitter handle cannot exceed 150 characters').optional(),
    meta_title: z.string().max(300, 'Meta title cannot exceed 300 characters').optional(),
    meta_description: z
      .string()
      .max(500, 'Meta description cannot exceed 500 characters')
      .optional(),
    cover_image: urlSchema.optional(),
    profile_image: urlSchema.optional(),
  })
  .strict()
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

// ----- Delete Schema -----

/**
 * Delete user schema
 * Validates user ID for deletion
 */
export const deleteUserSchema = userIdSchema;

// ----- Output Schema -----

/**
 * Complete user output schema
 * Represents a Ghost staff user with all fields
 */
export const userOutputSchema = z.object({
  id: ghostIdSchema,
  name: z.string(),
  slug: z.string(),
  email: emailSchema,
  profile_image: z.string().nullable(),
  cover_image: z.string().nullable(),
  bio: z.string().nullable(),
  website: z.string().nullable(),
  location: z.string().nullable(),
  facebook: z.string().nullable(),
  twitter: z.string().nullable(),
  accessibility: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'locked']),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  tour: z.string().nullable(),
  last_seen: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  url: z.string(),
});
