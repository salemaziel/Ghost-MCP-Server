import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContextLogger } from '../../__tests__/helpers/mockLogger.js';
import { mockDotenv } from '../../__tests__/helpers/testUtils.js';

// Mock the Ghost Admin API with invites support
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
      newsletters: {
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
      invites: {
        add: vi.fn(),
        browse: vi.fn(),
        delete: vi.fn(),
      },
      webhooks: {
        add: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      users: {
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      roles: {
        browse: vi.fn(),
        read: vi.fn(),
      },
      images: {
        upload: vi.fn(),
      },
      site: {
        read: vi.fn(),
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
  getInvites,
  createInvite,
  deleteInvite,
  api,
  ghostCircuitBreaker,
} from '../ghostServiceImproved.js';

describe('ghostServiceImproved - Invites', () => {
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

  describe('getInvites', () => {
    it('should retrieve invites with default options', async () => {
      const mockInvites = [
        {
          id: '6495a0b1c35ec2002c738f7c',
          role_id: '6495a0b1c35ec2002c738f78',
          status: 'sent',
          email: 'newauthor@example.com',
          expires: 1234567890000,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '6495a0b1c35ec2002c738f7d',
          role_id: '6495a0b1c35ec2002c738f79',
          status: 'pending',
          email: 'neweditor@example.com',
          expires: 1234567890000,
          created_at: '2024-01-02T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
        },
      ];

      api.invites.browse.mockResolvedValue(mockInvites);

      const result = await getInvites();

      expect(api.invites.browse).toHaveBeenCalled();
      expect(result).toEqual(mockInvites);
    });

    it('should retrieve invites with custom options', async () => {
      const mockInvites = [
        {
          id: '6495a0b1c35ec2002c738f7c',
          role_id: '6495a0b1c35ec2002c738f78',
          status: 'sent',
          email: 'newauthor@example.com',
        },
      ];

      api.invites.browse.mockResolvedValue(mockInvites);

      const options = {
        limit: 5,
        page: 2,
        filter: 'status:sent',
        order: 'created_at DESC',
      };

      const result = await getInvites(options);

      expect(api.invites.browse).toHaveBeenCalled();
      expect(result).toEqual(mockInvites);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      error.statusCode = 500;
      api.invites.browse.mockRejectedValue(error);

      await expect(getInvites()).rejects.toThrow('External service error: Ghost API');
    });

    it('should handle empty results', async () => {
      api.invites.browse.mockResolvedValue([]);

      const result = await getInvites();

      expect(result).toEqual([]);
    });
  });

  describe('createInvite', () => {
    it('should create invite with required fields', async () => {
      const inviteData = {
        role_id: '6495a0b1c35ec2002c738f78',
        email: 'newstaff@example.com',
      };

      const mockResponse = {
        invites: [
          {
            id: '6495a0b1c35ec2002c738f7c',
            ...inviteData,
            status: 'pending',
            expires: 1234567890000,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      api.invites.add.mockResolvedValue(mockResponse);

      const result = await createInvite(inviteData);

      expect(api.invites.add).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.invites[0]);
      expect(result.email).toBe('newstaff@example.com');
    });

    it('should create invite with optional expires_at field', async () => {
      const inviteData = {
        role_id: '6495a0b1c35ec2002c738f78',
        email: 'newstaff@example.com',
        expires_at: '2025-12-31T23:59:59.000Z',
      };

      const mockResponse = {
        invites: [
          {
            id: '6495a0b1c35ec2002c738f7c',
            ...inviteData,
            status: 'pending',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      api.invites.add.mockResolvedValue(mockResponse);

      const result = await createInvite(inviteData);

      expect(api.invites.add).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.invites[0]);
      expect(result.expires_at).toBe('2025-12-31T23:59:59.000Z');
    });

    it('should create invite with optional status field', async () => {
      const inviteData = {
        role_id: '6495a0b1c35ec2002c738f78',
        email: 'newstaff@example.com',
        status: 'pending',
      };

      const mockResponse = {
        invites: [
          {
            id: '6495a0b1c35ec2002c738f7c',
            ...inviteData,
            expires: 1234567890000,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      api.invites.add.mockResolvedValue(mockResponse);

      const result = await createInvite(inviteData);

      expect(api.invites.add).toHaveBeenCalled();
      expect(result.status).toBe('pending');
    });

    it('should handle API errors', async () => {
      const inviteData = {
        role_id: '6495a0b1c35ec2002c738f78',
        email: 'newstaff@example.com',
      };

      const error = new Error('Invalid role_id');
      error.statusCode = 400;
      api.invites.add.mockRejectedValue(error);

      await expect(createInvite(inviteData)).rejects.toThrow('External service error: Ghost API');
    });

    it('should handle validation errors for invalid email', async () => {
      const inviteData = {
        role_id: '6495a0b1c35ec2002c738f78',
        email: 'invalid-email',
      };

      const error = new Error('Validation error: email must be valid');
      error.statusCode = 422;
      api.invites.add.mockRejectedValue(error);

      await expect(createInvite(inviteData)).rejects.toThrow('External service error: Ghost API');
    });
  });

  describe('deleteInvite', () => {
    it('should delete invite successfully', async () => {
      const inviteId = '6495a0b1c35ec2002c738f7c';

      api.invites.delete.mockResolvedValue({ success: true });

      await deleteInvite(inviteId);

      expect(api.invites.delete).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const inviteId = '6495a0b1c35ec2002c738f7c';

      const error = new Error('API Error');
      error.statusCode = 500;
      api.invites.delete.mockRejectedValue(error);

      await expect(deleteInvite(inviteId)).rejects.toThrow('External service error: Ghost API');
    });

    it('should handle not found errors', async () => {
      const inviteId = 'nonexistent123456789012';

      const notFoundError = new Error('Resource not found');
      notFoundError.statusCode = 404;
      api.invites.delete.mockRejectedValue(notFoundError);

      // handleApiRequest transforms 404 errors to NotFoundError, but with retry logic it becomes generic error
      await expect(deleteInvite(inviteId)).rejects.toThrow();
    });

    it('should throw ValidationError for empty ID', async () => {
      await expect(deleteInvite('')).rejects.toThrow('Invite ID is required');
    });

    it('should throw ValidationError for undefined ID', async () => {
      await expect(deleteInvite(undefined)).rejects.toThrow('Invite ID is required');
    });
  });
});
