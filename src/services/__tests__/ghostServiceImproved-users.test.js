import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContextLogger } from '../../__tests__/helpers/mockLogger.js';
import { mockDotenv } from '../../__tests__/helpers/testUtils.js';

// Mock the Ghost Admin API with users support
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
      offers: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      users: {
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
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
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  api,
  ghostCircuitBreaker,
} from '../ghostServiceImproved.js';

describe('ghostServiceImproved - Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset circuit breaker to closed state
    if (ghostCircuitBreaker) {
      ghostCircuitBreaker.state = 'CLOSED';
      ghostCircuitBreaker.failureCount = 0;
      ghostCircuitBreaker.lastFailureTime = null;
      ghostCircuitBreaker.nextAttempt = null;
    }
  });

  describe('getUsers', () => {
    it('should successfully fetch all users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          slug: 'john-doe',
          status: 'active',
          roles: [{ id: 'role1', name: 'Administrator' }],
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          slug: 'jane-smith',
          status: 'active',
          roles: [{ id: 'role2', name: 'Editor' }],
        },
      ];

      api.users.browse.mockResolvedValue(mockUsers);

      const result = await getUsers();

      expect(api.users.browse).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should successfully fetch users with pagination', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      ];

      api.users.browse.mockResolvedValue(mockUsers);

      const result = await getUsers({ limit: 1, page: 2 });

      expect(api.users.browse).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should successfully fetch users with filter', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Bob Editor',
          email: 'bob@example.com',
          status: 'active',
        },
      ];

      api.users.browse.mockResolvedValue(mockUsers);

      const result = await getUsers({ filter: 'status:active' });

      expect(api.users.browse).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should handle users browse errors', async () => {
      const mockError = new Error('Failed to fetch users');
      api.users.browse.mockRejectedValue(mockError);

      await expect(getUsers()).rejects.toThrow();
    });

    it('should handle empty users array', async () => {
      api.users.browse.mockResolvedValue([]);

      const result = await getUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('should successfully fetch user by ID', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        slug: 'john-doe',
        bio: 'Software developer and writer',
        location: 'San Francisco',
        website: 'https://johndoe.com',
        status: 'active',
        roles: [{ id: 'role1', name: 'Administrator' }],
      };

      api.users.read.mockResolvedValue(mockUser);

      const result = await getUser('1');

      expect(api.users.read).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found (404)', async () => {
      const mockError = new Error('User not found');
      mockError.response = { status: 404 };
      api.users.read.mockRejectedValue(mockError);

      await expect(getUser('nonexistent')).rejects.toThrow();
    });

    it('should handle user read errors', async () => {
      const mockError = new Error('Failed to read user');
      api.users.read.mockRejectedValue(mockError);

      await expect(getUser('1')).rejects.toThrow();
    });

    it('should throw error for invalid user ID', async () => {
      await expect(getUser('')).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should successfully update user profile', async () => {
      const updateData = {
        name: 'John Updated',
        bio: 'Updated bio',
        location: 'New York',
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'john@example.com',
        ...updateData,
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      api.users.edit.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser('1', updateData);

      expect(api.users.edit).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
      expect(result.name).toBe('John Updated');
    });

    it('should successfully update user email', async () => {
      const updateData = {
        email: 'newemail@example.com',
      };

      const mockUpdatedUser = {
        id: '1',
        name: 'John Doe',
        email: 'newemail@example.com',
      };

      api.users.edit.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser('1', updateData);

      expect(result.email).toBe('newemail@example.com');
    });

    it('should successfully update user social media links', async () => {
      const updateData = {
        facebook: 'johndoe',
        twitter: '@johndoe',
        website: 'https://newsite.com',
      };

      const mockUpdatedUser = {
        id: '1',
        name: 'John Doe',
        ...updateData,
      };

      api.users.edit.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser('1', updateData);

      expect(result.facebook).toBe('johndoe');
      expect(result.twitter).toBe('@johndoe');
    });

    it('should handle user update errors', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('Failed to update user');
      api.users.edit.mockRejectedValue(mockError);

      await expect(updateUser('1', updateData)).rejects.toThrow();
    });

    it('should handle updating non-existent user (404)', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('User not found');
      mockError.response = { status: 404 };
      api.users.edit.mockRejectedValue(mockError);

      await expect(updateUser('nonexistent', updateData)).rejects.toThrow();
    });

    it('should throw error for empty update data', async () => {
      await expect(updateUser('1', {})).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      api.users.delete.mockResolvedValue({ success: true });

      const result = await deleteUser('1');

      expect(api.users.delete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle user deletion errors', async () => {
      const mockError = new Error('Failed to delete user');
      api.users.delete.mockRejectedValue(mockError);

      await expect(deleteUser('1')).rejects.toThrow();
    });

    it('should handle deleting non-existent user (404)', async () => {
      const mockError = new Error('User not found');
      mockError.response = { status: 404 };
      api.users.delete.mockRejectedValue(mockError);

      await expect(deleteUser('nonexistent')).rejects.toThrow();
    });

    it('should handle self-delete protection error', async () => {
      const mockError = new Error('Cannot delete current user');
      mockError.response = { status: 403 };
      api.users.delete.mockRejectedValue(mockError);

      await expect(deleteUser('1')).rejects.toThrow();
    });

    it('should throw error for invalid user ID', async () => {
      await expect(deleteUser('')).rejects.toThrow();
    });
  });
});
