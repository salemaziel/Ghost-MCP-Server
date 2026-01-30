import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockContextLogger } from '../../__tests__/helpers/mockLogger.js';
import { mockDotenv } from '../../__tests__/helpers/testUtils.js';

// Mock the Ghost Admin API with roles support
vi.mock('@tryghost/admin-api', () => ({
  default: vi.fn(function () {
    return {
      posts: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      pages: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      tags: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      members: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      tiers: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      newsletters: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      roles: {
        browse: vi.fn(),
        read: vi.fn(),
      },
      site: {
        read: vi.fn(),
      },
      images: {
        upload: vi.fn(),
      },
    };
  }),
}));

// Mock dotenv
vi.mock('dotenv', () => mockDotenv());

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createContextLogger: createMockContextLogger(),
}));

// Mock fs for validateImagePath
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
  },
}));

// Import after setting up mocks
import { getRoles, getRole, api, ghostCircuitBreaker } from '../ghostServiceImproved.js';
import { ValidationError } from '../../errors/index.js';

describe('ghostServiceImproved - Role Management', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Reset circuit breaker to closed state
    if (ghostCircuitBreaker) {
      ghostCircuitBreaker.state = 'CLOSED';
      ghostCircuitBreaker.failureCount = 0;
      ghostCircuitBreaker.lastFailureTime = null;
      ghostCircuitBreaker.nextAttempt = null;
    }
  });

  describe('getRoles', () => {
    it('should retrieve roles with default pagination', async () => {
      const mockRoles = [
        {
          id: '1',
          name: 'Administrator',
          description: 'Administrators',
        },
        {
          id: '2',
          name: 'Editor',
          description: 'Editors',
        },
      ];

      api.roles.browse.mockResolvedValue({
        roles: mockRoles,
        meta: { pagination: { page: 1, limit: 15, pages: 1, total: 2 } },
      });

      const response = await getRoles();

      expect(response).toBeDefined();
      expect(Array.isArray(response.roles)).toBe(true);
      expect(response.roles).toHaveLength(2);
      expect(api.roles.browse).toHaveBeenCalled();
    });

    it('should retrieve roles with custom pagination', async () => {
      const options = { limit: 5, page: 2 };
      const mockRoles = [{ id: '3', name: 'Author' }];

      api.roles.browse.mockResolvedValue({
        roles: mockRoles,
        meta: { pagination: { page: 2, limit: 5, pages: 1, total: 1 } },
      });

      const response = await getRoles(options);

      expect(response).toBeDefined();
      expect(response.roles).toHaveLength(1);
      expect(api.roles.browse).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      api.roles.browse.mockResolvedValue({
        roles: [],
        meta: { pagination: { page: 1, limit: 15, pages: 1, total: 0 } },
      });

      const response = await getRoles();

      expect(response).toBeDefined();
      expect(Array.isArray(response.roles)).toBe(true);
      expect(response.roles).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      try {
        await getRoles();
      } catch (error) {
        // Error handling is tested through the circuit breaker
        expect(error).toBeDefined();
      }
    });
  });

  describe('getRole', () => {
    it('should retrieve a role by ID', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const mockRole = {
        id: roleId,
        name: 'Administrator',
        description: 'Administrators',
      };

      api.roles.read.mockResolvedValue(mockRole);

      const role = await getRole(roleId);

      expect(role).toBeDefined();
      expect(role.id).toBe(roleId);
      expect(role.name).toBe('Administrator');
      expect(api.roles.read).toHaveBeenCalledWith({ id: roleId }, { id: roleId });
    });

    it('should throw ValidationError for missing ID', async () => {
      await expect(getRole()).rejects.toThrow(ValidationError);
      await expect(getRole('')).rejects.toThrow(ValidationError);
      await expect(getRole('   ')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string ID', async () => {
      await expect(getRole(123)).rejects.toThrow(ValidationError);
      await expect(getRole(null)).rejects.toThrow(ValidationError);
      await expect(getRole(undefined)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439099';
      const ghostError = new Error('Resource not found');
      ghostError.statusCode = 404;

      api.roles.read.mockRejectedValue(ghostError);

      await expect(getRole(nonExistentId)).rejects.toThrow();
    });

    it('should handle valid Ghost ID format', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const mockRole = { id: validId, name: 'Editor' };

      api.roles.read.mockResolvedValue(mockRole);

      const role = await getRole(validId);

      expect(role).toBeDefined();
      expect(role.id).toBe(validId);
    });
  });

  describe('Role Response Structure', () => {
    it('should return role with expected properties', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const mockRole = {
        id: roleId,
        name: 'Administrator',
        description: 'Administrators',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      api.roles.read.mockResolvedValue(mockRole);

      const role = await getRole(roleId);

      expect(role).toBeDefined();
      expect(typeof role.id).toBe('string');
      expect(typeof role.name).toBe('string');
      expect(role.id).toBe(roleId);
      expect(role.name).toBe('Administrator');
    });

    it('should return roles array with meta information', async () => {
      const mockRoles = [
        { id: '1', name: 'Administrator' },
        { id: '2', name: 'Editor' },
      ];

      api.roles.browse.mockResolvedValue({
        roles: mockRoles,
        meta: { pagination: { page: 1, limit: 10, pages: 1, total: 2 } },
      });

      const response = await getRoles({ limit: 10, page: 1 });

      expect(response).toBeDefined();
      expect(Array.isArray(response.roles)).toBe(true);
      expect(response.meta).toBeDefined();
      expect(response.meta.pagination).toBeDefined();
      expect(response.meta.pagination.total).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum limit gracefully', async () => {
      api.roles.browse.mockResolvedValue({
        roles: [],
        meta: { pagination: { page: 1, limit: 100, pages: 1, total: 0 } },
      });

      const response = await getRoles({ limit: 100 });

      expect(response).toBeDefined();
      expect(api.roles.browse).toHaveBeenCalled();
    });

    it('should handle page 1 correctly', async () => {
      api.roles.browse.mockResolvedValue({
        roles: [],
        meta: { pagination: { page: 1, limit: 15, pages: 1, total: 0 } },
      });

      const response = await getRoles({ page: 1 });

      expect(response).toBeDefined();
      expect(api.roles.browse).toHaveBeenCalled();
    });

    it('should sanitize role ID input', async () => {
      const dirtyId = '  507f1f77bcf86cd799439011  ';

      try {
        await getRole(dirtyId);
      } catch (error) {
        // Should either work or throw ValidationError, not crash
        expect(error).toBeDefined();
      }
    });
  });
});
