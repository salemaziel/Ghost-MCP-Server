/**
 * Centralized Zod Schema Library for Ghost MCP Server
 *
 * This module exports all validation schemas for Ghost CMS resources.
 * Use these schemas for consistent input/output validation across all MCP tools.
 *
 * @example
 * import { createPostSchema, tagQuerySchema } from './schemas/index.js';
 *
 * // Validate input
 * const validatedPost = createPostSchema.parse(inputData);
 *
 * // Safe parse with error handling
 * const result = tagQuerySchema.safeParse(queryParams);
 * if (!result.success) {
 *   console.error(result.error);
 * }
 */

// Common validators and utilities
export * from './common.js';

// Post schemas
export * from './postSchemas.js';

// Page schemas
export * from './pageSchemas.js';

// Tag schemas
export * from './tagSchemas.js';

// Member schemas
export * from './memberSchemas.js';

// Newsletter schemas
export * from './newsletterSchemas.js';

// Tier (membership/product) schemas
export * from './tierSchemas.js';

// Offer schemas
export * from './offerSchemas.js';

// Role schemas
export * from './roleSchemas.js';

// User schemas
export * from './userSchemas.js';

// Webhook schemas
export * from './webhookSchemas.js';

// Invite schemas
export * from './inviteSchemas.js';
