import { z } from 'zod';
import { ghostIdSchema, limitSchema, pageSchema, nqlFilterSchema } from './common.js';

/**
 * Role Schemas for Ghost CMS MCP Server
 * Roles are read-only in Ghost - they define permission levels for users
 */

/**
 * Role query schema with pagination
 * Used for browsing/listing roles
 */
export const roleQuerySchema = z.object({
  limit: limitSchema,
  page: pageSchema,
  filter: nqlFilterSchema,
  order: z.string().optional().describe('Sort order (e.g., "name ASC", "created_at DESC")'),
  include: z
    .string()
    .optional()
    .describe('Comma-separated list of relations to include (e.g., "permissions")'),
});

/**
 * Role ID schema for reading a single role
 */
export const roleIdSchema = z.object({
  id: ghostIdSchema.describe('The ID of the role to retrieve'),
});

/**
 * Role output schema (for documentation/validation)
 * Roles cannot be created or modified via API
 */
export const roleOutputSchema = z.object({
  id: ghostIdSchema,
  name: z.string().describe('Role name (e.g., "Administrator", "Editor", "Author")'),
  description: z.string().describe('Role description'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});
